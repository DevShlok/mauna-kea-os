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

/**
 * Single-button Smart Document Import Action (#2):
 * Accepts CV Document Formats (.pdf, .doc, .docx, .txt), parses candidate profile details,
 * updates/creates Database Table record AND attaches CV file.
 */
export async function importCandidateDocumentAction(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const buffer = Buffer.from(await file.arrayBuffer());

  // 1. Extract Text
  let extractedText = "";
  try {
    if (ext === "docx" || ext === "doc") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (ext === "txt") {
      extractedText = buffer.toString("utf-8");
    } else {
      const pdfParse = require("pdf-parse-new");
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text;
    }
  } catch (err) {
    console.warn("Text extraction error:", err);
    extractedText = file.name;
  }

  // 2. AI Extraction of Candidate Profile Fields
  const schema = z.object({
    name: z.string().describe("Candidate full name"),
    email: z.string().nullable().describe("Candidate email address"),
    mobile: z.string().nullable().describe("Candidate phone/mobile number"),
    designation: z.string().nullable().describe("Current job title/designation"),
    company: z.string().nullable().describe("Current company name"),
    location: z.string().nullable().describe("Current city/location"),
    linkedin: z.string().nullable().describe("LinkedIn profile URL"),
    ctc: z.string().nullable().describe("Current annual CTC/salary"),
    totalExperience: z.number().nullable().describe("Total work experience in years"),
    qualification: z.string().nullable().describe("Highest degree/qualification"),
    expTags: z.array(z.string()).optional().describe("5-8 key executive skills or functional expertise tags extracted from resume (e.g. M&A, FP&A, Big4 Alum, IFRS)"),
  });

  let extractedData: any = {};
  try {
    const { object } = await generateObjectWithFallback({
      schema,
      prompt: `Extract structured candidate profile details from the following resume text. Return null for missing fields.
Resume Text:
${extractedText.substring(0, 4000)}`
    });
    extractedData = object;
  } catch (aiErr) {
    console.warn("AI resume parsing fallback to basic name", aiErr);
    extractedData = { name: file.name.replace(/\.[^/.]+$/, "") };
  }

  const name = extractedData.name || file.name.replace(/\.[^/.]+$/, "");
  const email = extractedData.email || "";
  const mobile = extractedData.mobile || "";
  const designation = extractedData.designation || "";
  const company = extractedData.company || "";
  const expTags = Array.isArray(extractedData.expTags) ? extractedData.expTags : [];

  // 3. Upload Document to Supabase Storage
  let cvUrl = "";
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const filename = `cvs/import-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from("mauna-kea-documents")
      .upload(filename, buffer, { contentType: file.type || "application/pdf", upsert: true });

    if (!uploadError) {
      const { data } = supabase.storage.from("mauna-kea-documents").getPublicUrl(filename);
      cvUrl = data.publicUrl;
    }
  } catch (stErr) {
    console.warn("Supabase document storage upload fallback", stErr);
  }

  // 4. Duplicate Match & DB Table Update + CV Attachment
  const { newCandId } = await import("@/lib/ids");
  const { or, eq, and } = await import("drizzle-orm");
  const orConditions = [];
  if (email) orConditions.push(eq(candidates.email, email));
  if (mobile) orConditions.push(eq(candidates.mobile, mobile));
  if (name && company) orConditions.push(and(eq(candidates.name, name), eq(candidates.company, company)));

  let existingCandidate = null;
  if (orConditions.length > 0) {
    const found = await db.select().from(candidates).where(or(...orConditions));
    if (found.length > 0) existingCandidate = found[0];
  }

  const currentUser = await getCurrentUserName();
  let candidateId = "";

  if (existingCandidate) {
    candidateId = existingCandidate.id;
    const currentExpTags = (existingCandidate.expTags as string[]) || [];
    const mergedTags = Array.from(new Set([...currentExpTags, ...expTags]));

    await db.update(candidates).set({
      name: name || existingCandidate.name,
      email: email || existingCandidate.email,
      mobile: mobile || existingCandidate.mobile,
      designation: designation || existingCandidate.designation,
      company: company || existingCandidate.company,
      location: extractedData.location || existingCandidate.location,
      linkedin: extractedData.linkedin || existingCandidate.linkedin,
      exp: extractedData.totalExperience || existingCandidate.exp,
      ctc: extractedData.ctc || existingCandidate.ctc,
      expTags: mergedTags,
      hasCv: true,
      cvFileName: cvUrl || existingCandidate.cvFileName,
      cvText: extractedText || existingCandidate.cvText,
      updatedBy: currentUser,
    }).where(eq(candidates.id, candidateId));
  } else {
    candidateId = newCandId();
    const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "CN";
    await db.insert(candidates).values({
      id: candidateId,
      name,
      email,
      mobile,
      designation,
      company,
      location: extractedData.location || "",
      linkedin: extractedData.linkedin || "",
      initials,
      qual: extractedData.qualification ? [extractedData.qualification] : [],
      exp: extractedData.totalExperience || 0,
      ctc: extractedData.ctc || "",
      expTags,
      hasCv: true,
      cvFileName: cvUrl,
      cvText: extractedText,
      updatedBy: currentUser,
      metadata: { source: "CV Document Import" },
    });
  }

  // Attach CV to candidateFiles
  if (cvUrl) {
    await db.insert(candidateFiles).values({
      candId: candidateId,
      fileType: "CV / Resume",
      fileName: file.name,
      fileUrl: cvUrl,
      extractedText: extractedText.substring(0, 5000),
    });
  }

  revalidatePath("/dashboard/candidates", "layout");
  return {
    success: true,
    candidateId,
    candidateName: name,
    isUpdate: !!existingCandidate,
    hasCv: true,
  };
}

/**
 * Update candidate executive tags (expTags, dreamRoles, dreamCos, pastCompanies).
 */
export async function updateCandidateTagsAction(
  candId: string,
  tagData: {
    expTags?: string[];
    dreamRoles?: string[];
    dreamCos?: string[];
    pastCompanies?: string[];
  }
) {
  const currentUser = await getCurrentUserName();
  const { eq } = await import("drizzle-orm");

  const toSet: any = { updatedBy: currentUser };
  if (tagData.expTags !== undefined) toSet.expTags = tagData.expTags;
  if (tagData.dreamRoles !== undefined) toSet.dreamRoles = tagData.dreamRoles;
  if (tagData.dreamCos !== undefined) toSet.dreamCos = tagData.dreamCos;
  if (tagData.pastCompanies !== undefined) toSet.pastCompanies = tagData.pastCompanies;

  await db.update(candidates).set(toSet).where(eq(candidates.id, candId));

  revalidatePath(`/dashboard/candidates/${candId}`);
  revalidatePath("/dashboard/candidates");
  return { success: true };
}
