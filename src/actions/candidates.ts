"use server";

import { generateObjectWithFallback } from "@/lib/gemini-fallback";
import { z } from "zod";
import { db } from "@/db";
import { createClient } from "@/utils/supabase/server";
import { platformUsers } from "@/db/schema";
import { candidates, candidateFiles } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function mapCandidatesAction(headers: string[], sampleData: string[][]) {
  if (!headers || !Array.isArray(headers)) {
    throw new Error("Missing or invalid headers");
  }

  const schema = z.object({
    mapping: z.object({
      name: z.string().nullable().describe("Header matching Candidate Name"),
      designation: z.string().nullable().describe("Header matching Designation/Role"),
      company: z.string().nullable().describe("Header matching Current Company"),
      phone: z.string().nullable().describe("Header matching Phone/Mobile number"),
      email: z.string().nullable().describe("Header matching Email address"),
      previousCompany: z.string().nullable().describe("Header matching Previous Company"),
      location: z.string().nullable().describe("Header matching Location"),
      industry: z.string().nullable().describe("Header matching Industry"),
      ctc: z.string().nullable().describe("Header matching CTC or Salary"),
      totalExperience: z.string().nullable().describe("Header matching Total Experience in Years"),
      yearQualified: z.string().nullable().describe("Header matching Year Qualified or Graduation Year"),
    })
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


import { evaluateCandidateMatch } from "@/utils/fuzzy-match";
import { eq } from "drizzle-orm";


async function getCurrentUserName(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const dbUser = await db.select().from(platformUsers).where(eq(platformUsers.email, user.email));
      if (dbUser.length > 0) return dbUser[0].name;
      return user.email;
    }
  } catch(e) {}
  return "Unknown";
}

export async function checkCandidateDuplicatesAction(mappedCandidates: any[]) {
  if (!mappedCandidates || mappedCandidates.length === 0) return { duplicates: [], newCandidates: [] };

  const existingCandidates = await db.select().from(candidates).where(eq(candidates.isDeleted, false));
  const existingFiles = await db.select().from(candidateFiles);
  
  // Attach files to candidates for date checking
  existingCandidates.forEach((c: any) => {
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

export async function finalizeCandidatesImportAction(newCandidates: any[], updatedCandidates: any[]) {
  const updatedBy = await getCurrentUserName();
  let insertedCount = 0;
  let updatedCount = 0;

  // Insert pure new candidates
  for (let i = 0; i < newCandidates.length; i++) {
    const c = newCandidates[i];
    let initials = "";
    if (c.name) {
      initials = c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
    }

    const newId = "CAND-" + Date.now() + "-" + i + "-" + Math.floor(Math.random() * 1000);

    const payload = {
      id: newId,
      name: c.name || "Unknown",
      email: c.email || "",
      mobile: c.phone || "",
      location: c.location || "",
      company: c.company || "",
      designation: c.designation || "",
      exp: c.totalExperience ? parseInt(c.totalExperience) : null,
      ctc: c.ctc ? parseInt(c.ctc) : null,
      notes: c.industry ? `Industry: ${c.industry}` : "",
      expTags: c.previousCompany ? [c.previousCompany] : [],
      qual: c.yearQualified ? [{ degree: "Qualification", year: c.yearQualified }] : [],
      initials,
      status: "Active",
    };

    await db.insert(candidates).values(payload);
    insertedCount++;

    if (c.files && Array.isArray(c.files)) {
      for (const file of c.files) {
        await db.insert(candidateFiles).values({
          candId: newId,
          fileType: "CV / Resume",
          fileName: file.fileName || "resume.pdf",
          fileUrl: file.fileUrl || file.fileData,
        });
      }
    }
  }

  // Handle Updates
  for (const update of updatedCandidates) {
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
    if (fieldsToUpdate.totalExperience && c.totalExperience) updatePayload.exp = parseInt(c.totalExperience);
    if (fieldsToUpdate.ctc && c.ctc) updatePayload.ctc = parseInt(c.ctc);

    // Merge notes/tags if selected
    if (fieldsToUpdate.industry && c.industry) updatePayload.notes = c.industry;

    updatePayload.updatedAt = new Date();
    updatePayload.updatedBy = updatedBy;
    if (Object.keys(updatePayload).length > 0) {
      await db.update(candidates).set(updatePayload).where(eq(candidates.id, existingId));
      updatedCount++;
    }

    if (c.files && Array.isArray(c.files)) {
      for (const file of c.files) {
        await db.insert(candidateFiles).values({
          candId: existingId,
          fileType: "CV / Resume",
          fileName: file.fileName || "resume.pdf",
          fileUrl: file.fileUrl || file.fileData,
        });
      }
    }
  }

  revalidatePath("/dashboard/candidates");
  return { success: true, insertedCount, updatedCount };
}
