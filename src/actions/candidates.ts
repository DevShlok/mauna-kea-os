"use server";

import { generateObjectWithFallback } from "@/lib/gemini-fallback";
import { z } from "zod";
import { db } from "@/db";
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

export async function processCandidatesAction(mappedCandidates: any[]) {
  if (!mappedCandidates || !Array.isArray(mappedCandidates) || mappedCandidates.length === 0) {
    throw new Error("No candidates provided");
  }

  const insertedIds = [];

  for (let i = 0; i < mappedCandidates.length; i++) {
    const c = mappedCandidates[i];
    let initials = "";
    if (c.name) {
      initials = c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
    }

    const newId = "CAND-" + Date.now() + "-" + i;

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
    insertedIds.push(newId);

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

  revalidatePath("/dashboard/candidates");
  return { success: true, count: mappedCandidates.length };
}
