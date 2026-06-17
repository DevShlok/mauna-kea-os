import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { headers, sampleData } = await req.json();

    if (!headers || !Array.isArray(headers)) {
      return NextResponse.json({ error: "Missing or invalid headers" }, { status: 400 });
    }

    const schema = z.object({
      mapping: z.object({
        name: z.string().nullable().describe("Header matching Candidate Name"),
        email: z.string().nullable().describe("Header matching Email Address"),
        mobile: z.string().nullable().describe("Header matching Mobile/Phone Number"),
        location: z.string().nullable().describe("Header matching Current Location"),
        company: z.string().nullable().describe("Header matching Current Employer/Company"),
        designation: z.string().nullable().describe("Header matching Current Job Title/Designation"),
        exp: z.string().nullable().describe("Header matching Total Years of Experience"),
        tenure: z.string().nullable().describe("Header matching Time in Current Company/Tenure"),
        ctc: z.string().nullable().describe("Header matching Current CTC"),
        fixedCtc: z.string().nullable().describe("Header matching Fixed CTC"),
        variableCtc: z.string().nullable().describe("Header matching Variable CTC"),
        expected: z.string().nullable().describe("Header matching Expected CTC"),
        notice: z.string().nullable().describe("Header matching Notice Period"),
        status: z.string().nullable().describe("Header matching Status"),
        qual: z.string().nullable().describe("Header matching Qualifications"),
        expTags: z.string().nullable().describe("Header matching Prior Employers / Exp Tags"),
        dreamRoles: z.string().nullable().describe("Header matching Dream Roles"),
        dreamCos: z.string().nullable().describe("Header matching Dream Companies"),
        linkedin: z.string().nullable().describe("Header matching LinkedIn Profile URL"),
        targetCompany: z.string().nullable().describe("Header matching Target Company"),
        notes: z.string().nullable().describe("Header matching Notes"),
        cvDriveLink: z.string().nullable().describe("Header matching Resume/CV (Drive Link)"),
        linkedinPdfDriveLink: z.string().nullable().describe("Header matching LinkedIn PDF (Drive Link)"),
      }).describe("The mapped headers from the input file. If a field cannot be matched, return null for that field.")
    });

    const prompt = `You are a data mapping assistant. Your task is to map the user's uploaded spreadsheet headers to our database schema.
    
User Headers: ${JSON.stringify(headers)}

Sample Data (to help disambiguate):
${JSON.stringify(sampleData, null, 2)}

Match each of our database fields to the EXACT string of the corresponding User Header. If there is no logical match for a database field, return null for that field. Do not invent header names, you MUST pick from the provided User Headers array.`;

    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: schema,
      prompt: prompt,
    });

    return NextResponse.json({ data: result.object.mapping });
  } catch (error) {
    console.error("Mapping Error:", error);
    return NextResponse.json({ error: "Failed to generate mapping" }, { status: 500 });
  }
}
