"use server";

import { generateObjectWithFallback } from "@/lib/gemini-fallback";
import { z } from "zod";

export async function generateFormatAction(candidateId: string, format: string, reportData: any) {
  if (!candidateId || !format || !reportData) {
    throw new Error("Missing required fields");
  }

  let schema;
  let prompt;

  if (format === "format1") {
    schema = z.object({
      "Notes Summary": z.array(z.string()).describe("A brief list of 3-5 bullet points summarizing the candidate's background, fit, and overall notes."),
      "Assessment Notes": z.array(z.string()).describe("A brief list of 3-5 bullet points covering the candidate's key strengths, areas to probe, and final recommendation.")
    });

    prompt = `You are an expert executive assessor. Your task is to extract and synthesize the provided Assessment Draft into the specific schema required for Format 1.
    
Format 1 requires two main bulleted lists:
1. Notes Summary: A summary of the candidate's general notes, background, and fit.
2. Assessment Notes: A summary of the candidate's strengths, areas to probe, and your recommendation.

Assessment Draft Data:
${JSON.stringify(reportData, null, 2)}`;

  } else if (format === "format2") {
    schema = z.object({
      notes_summary: z.string().describe("A professional paragraph summarizing the candidate's background, experience, and overall fit."),
      career_aspiration: z.string().describe("A professional paragraph summarizing the candidate's career aspirations."),
      relevant_experience: z.array(
        z.object({
          companyName: z.string(),
          duration: z.string(),
          position: z.string(),
          highlights: z.array(z.string()).describe("Key achievements or responsibilities (2-3 bullets).")
        })
      ).describe("List of relevant past experiences."),
      motivation: z.string().describe("A professional paragraph explaining the candidate's motivation for the role."),
      key_strengths: z.array(z.string()).describe("List of 3-5 key strengths."),
      areas_to_probe: z.array(z.string()).describe("List of 2-4 areas to probe or weaknesses."),
      compensation: z.object({
        current: z.string(),
        expected: z.string()
      }).describe("Current and expected compensation. Use 'Not Disclosed' if unavailable."),
      recommendation: z.string().describe("A professional paragraph with the final recommendation.")
    });

    prompt = `You are an expert executive assessor. Your task is to extract and synthesize the provided Assessment Draft into the specific schema required for Format 2.
    
Format 2 requires detailed paragraphs for summaries and specific bulleted lists for strengths/experiences. 
Please thoroughly analyze the provided Assessment Draft and synthesize the content into the required JSON schema.
If information is missing for a field (e.g. Motivation), infer it professionally from the general notes, or state 'Not provided in draft.' if completely unavailable.

Assessment Draft Data:
${JSON.stringify(reportData, null, 2)}`;

  } else {
    throw new Error("Invalid format");
  }

  const { object } = await generateObjectWithFallback({
    schema,
    prompt
  });

  return object;
}
