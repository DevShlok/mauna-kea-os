import { NextResponse } from "next/server";
import { generateObjectWithFallback } from "@/lib/gemini-fallback";
import { z } from "zod";

const extractedProfileSchema = z.object({
  name: z.string().optional().describe("Full name of the candidate"),
  designation: z.string().optional().describe("Current job title or designation"),
  company: z.string().optional().describe("Current company name"),
  location: z.string().optional().describe("Current location or city"),
  expYears: z.number().optional().describe("Total years of experience (numeric)"),
  pastCompanies: z.array(z.string()).default([]).describe("List of past companies worked at"),
  qual: z.array(
    z.object({
      degree: z.string(),
      college: z.string().optional(),
      year: z.string().optional(),
    })
  ).default([]).describe("Educational qualifications"),
  expTags: z.array(z.string()).default([]).describe("Key industry tags, skills, or expertise (e.g. FMCG, Sales, Python)"),
  summary: z.string().optional().describe("A brief professional summary of the candidate's career"),
  careerTimeline: z.array(
    z.object({
      roleTitle: z.string(),
      companyName: z.string(),
      startDate: z.string().describe("YYYY-MM-DD or YYYY-MM formatted date"),
      endDate: z.string().optional().describe("YYYY-MM-DD or YYYY-MM formatted date, omit if current"),
      description: z.string().optional(),
      isCurrent: z.boolean().default(false),
    })
  ).default([]).describe("Chronological list of career experiences"),
});

export async function POST(req: Request) {
  try {
    const { text, source } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const { object } = await generateObjectWithFallback({
      schema: extractedProfileSchema,
      prompt: `Extract candidate profile information from the following ${source === 'linkedin' ? 'LinkedIn profile export' : 'resume/CV'} text.
      If a field is not found, leave it empty. Be precise and format dates as YYYY-MM-DD where possible.
      
      Text to parse:
      ---
      ${text.substring(0, 30000)}
      ---`,
    });

    return NextResponse.json({ success: true, profile: object });
  } catch (error: any) {
    console.error("AI Extraction Error:", error);
    return NextResponse.json({ error: "Failed to extract profile" }, { status: 500 });
  }
}
