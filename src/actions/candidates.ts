"use server";

import { generateObjectWithFallback } from "@/lib/gemini-fallback";
import { z } from "zod";
import { db } from "@/db";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { candidates, candidateFiles, clients } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { inngest } from "@/lib/inngest/client";
import crypto from "crypto";
import { getCurrentUserName } from "@/lib/server-session";

import { evaluateCandidateMatch } from "@/utils/fuzzy-match";
import { eq } from "drizzle-orm";


export async function mapCandidatesAction(headers: string[], sampleData: any[]) {
  const schema = z.object({
    mapping: z.object({
      name: z.string().nullable().describe("Match for Candidate Name"),
      designation: z.string().nullable().describe("Match for Job Title or Designation"),
      company: z.string().nullable().describe("Match for Current Company"),
      phone: z.string().nullable().describe("Match for Phone Number or Mobile"),
      email: z.string().nullable().describe("Match for Email Address"),
      linkedin: z.string().nullable().describe("Match for LinkedIn URL"),
      previousCompany: z.string().nullable().describe("Match for Previous Company"),
      location: z.string().nullable().describe("Match for City or Location"),
      industry: z.string().nullable().describe("Match for Industry"),
      ctc: z.string().nullable().describe("Match for Current CTC or Salary"),
      totalExperience: z.string().nullable().describe("Match for Total Experience in years"),
      qualification: z.string().nullable().describe("Match for Highest Qualification or Degree"),
      yearQualified: z.string().nullable().describe("Match for Year of Passing")
    }).describe("Map each standard system field to the EXACT CSV header that corresponds to it, or null if no match.")
  });

  const { object } = await generateObjectWithFallback({
    schema,
    prompt: `You are an expert data mapping assistant. You are given a list of CSV headers and a few rows of sample data. 
Your task is to map the provided CSV headers to the standard system fields. 
If a system field does not clearly match any CSV header, return null for that field.
Do not guess wildly; only map if there is a reasonable logical connection.

CSV Headers:
${JSON.stringify(headers, null, 2)}

Sample Data (first 3 rows):
${JSON.stringify(sampleData, null, 2)}`
  });

  return object;
}

export async function checkCandidateDuplicatesAction(mappedCandidates: any[]) {
  if (!mappedCandidates || mappedCandidates.length === 0) return { duplicates: [], newCandidates: [] };

  // Only fetch the columns actually needed for duplicate matching — avoids loading
  // multi-MB of CV text / profile pics for every candidate on each bulk import check.
  const existingCandidates = await db.select({
    id: candidates.id,
    name: candidates.name,
    email: candidates.email,
    mobile: candidates.mobile,
    company: candidates.company,
  }).from(candidates).where(eq(candidates.isDeleted, false));
  const existingFiles = await db.select().from(candidateFiles);
  
  // Attach files to candidates for date checking
  (existingCandidates as any[]).forEach((c: any) => {
    c.files = existingFiles.filter(f => f.candId === c.id);
  });
  const duplicates = [];
  const newCandidates = [];

  for (let i = 0; i < mappedCandidates.length; i++) {
    const inc = mappedCandidates[i];
    let foundMatch = false;

    // Check against all existing
    for (const ext of existingCandidates) {
      const match = evaluateCandidateMatch(inc, ext);
      if (match.isDuplicate) {
        duplicates.push({
          incomingCandidate: inc,
          existingCandidate: ext,
          reason: match.reason,
          scores: match.scores,
          incomingIndex: i
        });
        foundMatch = true;
        break; // Stop at first match for this candidate
      }
    }

    if (!foundMatch) {
      newCandidates.push(inc);
    }
  }

  return { duplicates, newCandidates };
}

function safeParseInt(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const parsed = parseInt(val.toString().replace(/[^\d.-]/g, ''), 10);
  return isNaN(parsed) ? null : parsed;
}

function safeStr(val: any, maxLen: number): string {
  if (!val) return "";
  return String(val).substring(0, maxLen);
}

export async function finalizeCandidatesImportAction(newCandidates: any[], updatedCandidates: any[]) {
  const updatedBy = await getCurrentUserName();
  let insertedCount = 0;
  let updatedCount = 0;
  let failedRows: string[] = [];

  // Insert pure new candidates
  for (let i = 0; i < newCandidates.length; i++) {
    const c = newCandidates[i];
    try {
      let initials = "";
      if (c.name) {
        initials = c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
      }

      const newId = `CAND-${crypto.randomUUID()}`;

      const payload = {
        id: newId,
        name: safeStr(c.name || "Unknown", 255),
        email: safeStr(c.email || "", 255),
        mobile: safeStr(c.phone || "", 20),
        location: safeStr(c.location || "", 100),
        company: safeStr(c.company || "", 255),
        designation: safeStr(c.designation || "", 255),
        exp: safeParseInt(c.totalExperience),
        ctc: safeParseInt(c.ctc),
        notes: c.industry ? `Industry: ${c.industry}` : "",
        expTags: c.previousCompany ? [c.previousCompany] : [],
        qual: c.qualification ? [{ degree: c.qualification }] : (c.yearQualified ? [{ degree: "Qualification", year: c.yearQualified }] : []),
        linkedin: c.linkedin || null,
        initials,
        status: "Active",
        metadata: c.metadata || {},
      };

      await db.insert(candidates).values(payload);
      insertedCount++;

      // Dispatch Inngest event if cvLink is provided
      if (c.cvLink) {
        await inngest.send({
          name: "cv.process_gdrive_link",
          data: { candidateId: newId, gdriveUrl: c.cvLink }
        });
      }

      if (c.files && Array.isArray(c.files)) {
        for (const file of c.files) {
          try {
            await db.insert(candidateFiles).values({
              candId: newId,
              fileType: "CV / Resume",
              fileName: file.fileName || "resume.pdf",
              fileUrl: file.fileUrl || file.fileData,
            });
          } catch (fileErr) {
            console.error("Error inserting file for candidate", newId, fileErr);
          }
        }
      }
    } catch (err) {
      console.error("Failed to insert candidate row:", c, err);
      failedRows.push(c.name || `Row ${i + 1}`);
    }
  }

  // Handle Updates
  for (const update of updatedCandidates) {
    try {
      const c = update.incomingCandidate;
      const existingId = update.existingId;
      const fieldsToUpdate = update.fieldsToUpdate || {}; // { name: true, email: true, etc }

      const updatePayload: any = {};
      if (fieldsToUpdate.name && c.name) {
        updatePayload.name = c.name;
        updatePayload.initials = c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
      }
      if (fieldsToUpdate.email && c.email) updatePayload.email = c.email;
      if (fieldsToUpdate.mobile && c.phone) updatePayload.mobile = c.phone;
      if (fieldsToUpdate.location && c.location) updatePayload.location = c.location;
      if (fieldsToUpdate.company && c.company) updatePayload.company = c.company;
      if (fieldsToUpdate.designation && c.designation) updatePayload.designation = c.designation;
      if (fieldsToUpdate.totalExperience && c.totalExperience) updatePayload.exp = safeParseInt(c.totalExperience);
      if (fieldsToUpdate.ctc && c.ctc) updatePayload.ctc = safeParseInt(c.ctc);
      if (fieldsToUpdate.qualification && c.qualification) updatePayload.qual = [{ degree: c.qualification }];
      if (fieldsToUpdate.linkedin && c.linkedin) updatePayload.linkedin = c.linkedin;

      // Merge notes/tags if selected
      if (fieldsToUpdate.industry && c.industry) updatePayload.notes = c.industry;

      if (c.metadata && Object.keys(c.metadata).length > 0) {
        updatePayload.metadata = c.metadata;
      }
      
      if (Object.keys(updatePayload).length > 0) {
        updatePayload.updatedAt = new Date();
        updatePayload.updatedBy = updatedBy;

        await db.update(candidates)
          .set(updatePayload)
          .where(eq(candidates.id, existingId));

        updatedCount++;
      }
      
      // Dispatch Inngest event if cvLink is provided for an existing candidate
      if (c.cvLink) {
        await inngest.send({
          name: "cv.process_gdrive_link",
          data: { candidateId: existingId, gdriveUrl: c.cvLink }
        });
      }

      if (c.files && Array.isArray(c.files)) {
        for (const file of c.files) {
          try {
            await db.insert(candidateFiles).values({
              candId: existingId,
              fileType: "CV / Resume",
              fileName: file.fileName || "resume.pdf",
              fileUrl: file.fileUrl || file.fileData,
            });
          } catch (fileErr) {
            console.error("Error inserting file for candidate update", existingId, fileErr);
          }
        }
      }
    } catch (err) {
      console.error("Failed to update candidate row:", update, err);
      failedRows.push(update.incomingCandidate?.name || `Update Row`);
    }
  }

  revalidatePath("/dashboard/candidates");
  return { success: true, insertedCount, updatedCount, failedCount: failedRows.length, failedRows };
}





export async function convertToClientContactAction(candId: string, clientId: string, contactData: { name: string, designation: string, number: string, email: string }) {
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (!client) throw new Error("Client not found");

  const currentContacts = Array.isArray(client.contacts) ? client.contacts : [];
  
  if (currentContacts.some((c: any) => c.linkedCandidateId === candId)) {
    throw new Error("Candidate is already a contact for this client");
  }

  const newContact = {
    ...contactData,
    linkedCandidateId: candId
  };

  await db.update(clients).set({
    contacts: [...currentContacts, newContact]
  }).where(eq(clients.id, clientId));

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/candidates/${candId}`);
  return { success: true };
}

export async function uploadAndDispatchDirectEvent(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    // Determine the file's MIME type. Fall back to extension sniffing if browser didn't set it.
    let fileType = file.type || "";
    const nameLower = file.name.toLowerCase();
    if (!fileType) {
      if (nameLower.endsWith(".pdf")) fileType = "application/pdf";
      else if (nameLower.endsWith(".docx")) fileType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else if (nameLower.endsWith(".doc")) fileType = "application/msword";
      else if (nameLower.endsWith(".jpg") || nameLower.endsWith(".jpeg")) fileType = "image/jpeg";
      else if (nameLower.endsWith(".png")) fileType = "image/png";
      else if (nameLower.endsWith(".webp")) fileType = "image/webp";
      else if (nameLower.endsWith(".tiff") || nameLower.endsWith(".tif")) fileType = "image/tiff";
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueName = `${Date.now()}-${safeName}`;

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: uploadError } = await supabase.storage
      .from("candidate-cvs")
      .upload(uniqueName, buffer, {
        contentType: fileType || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("candidate-cvs")
      .getPublicUrl(uniqueName);

    await inngest.send({
      name: "cv.process_direct_upload",
      data: {
        publicUrl: publicUrlData.publicUrl,
        fileName: file.name,
        fileType,
      },
    });

    return { success: true };
  } catch (err: any) {
    throw new Error(`Upload failed: ${err.message}`);
  }
}

export async function updatePastCompaniesAction(candId: string, pastCompanies: string[]) {
  await db.update(candidates).set({ pastCompanies }).where(eq(candidates.id, candId));
  revalidatePath(`/dashboard/candidates/${candId}`);
  return { success: true };
}

/**
 * Update the list of target companies for a candidate.
 * Also appends to the list when submitting to a new client (called from addSubmissionAction).
 */
export async function updateCandidateTargetCompaniesAction(candId: string, targetCompanies: string[]) {
  const updatedBy = await getCurrentUserName();
  const now = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  
  const [cand] = await db.select({ auditLog: candidates.auditLog }).from(candidates).where(eq(candidates.id, candId));
  const existingAudit = (cand?.auditLog as Record<string, any>) || {};

  await db.update(candidates).set({
    targetCompanies,
    auditLog: { ...existingAudit, targetCompanies: { updatedBy, updatedAt: now } }
  }).where(eq(candidates.id, candId));

  revalidatePath(`/dashboard/candidates/${candId}`);
  return { success: true };
}

/**
 * Append a single client company to the candidate's targetCompanies list (called on submission).
 */
export async function appendTargetCompanyOnSubmissionAction(candId: string, clientCompany: string) {
  const [cand] = await db.select({ targetCompanies: candidates.targetCompanies }).from(candidates).where(eq(candidates.id, candId));
  const existing: string[] = (cand?.targetCompanies as string[]) || [];
  if (!existing.includes(clientCompany)) {
    await updateCandidateTargetCompaniesAction(candId, [...existing, clientCompany]);
  }
}
