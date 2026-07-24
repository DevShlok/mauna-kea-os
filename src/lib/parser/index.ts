const pdfParse = require("pdf-parse-new");
import nlp from "compromise";
import { generateObjectWithFallback } from "@/lib/gemini-fallback";
import { z } from "zod";

/**
 * Extracts raw text from a PDF Buffer
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text || "";
  } catch (error) {
    console.error("Failed to parse PDF", error);
    return "";
  }
}

/**
 * Reusable NLP parser to extract entities from raw text.
 * Built to be reusable for both CVs and JDs.
 */
export async function extractEntitiesFromText(text: string) {
  try {
    const schema = z.object({
      names: z.array(z.string()).describe("The name of the candidate. Usually the largest text at the top. Only include the actual person's name, not certifications or roles."),
      primaryEmail: z.string().nullable().describe("The candidate's primary email address."),
      primaryPhone: z.string().nullable().describe("The candidate's primary phone number."),
      companies: z.array(z.string()).describe("List of companies the candidate has worked for."),
      places: z.array(z.string()).describe("Locations, cities, or countries mentioned."),
    });

    const { object } = await generateObjectWithFallback({
      schema,
      system: "You are a highly accurate CV parsing assistant. Extract entities carefully from the raw CV text. Ensure you do not confuse certification names (e.g. 'C++ Programming') with the candidate's personal name.",
      prompt: `Extract entities from this CV:\n\n${text.substring(0, 15000)}`
    });

    return {
      primaryEmail: object.primaryEmail || null,
      primaryPhone: object.primaryPhone || null,
      names: object.names || [],
      companies: object.companies || [],
      places: object.places || [],
      rawText: text
    };
  } catch (error) {
    console.error("AI Entity Extraction failed, falling back to NLP", error);
    // Regex fallbacks for high-accuracy fields
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

    const emails = text.match(emailRegex) || [];
    const phones = text.match(phoneRegex) || [];

    // Use compromise for NLP entity extraction on a slightly cleaned text
    // Remove typical breadcrumbs that cause noise
    const cleanText = text
      .replace(/Home\s*\/\s*Candidate Database\s*\//gi, '')
      .replace(/Certification.*?–/gi, '');
      
    const doc = nlp(cleanText);
    
    let names = doc.people().out('array') as string[];
    let companies = doc.organizations().out('array') as string[];
    let places = doc.places().out('array') as string[];

    // Strict filtering for names to avoid garbage
    names = names.filter(n => {
      if (n.length < 3 || n.length > 30) return false;
      if (n.includes('–') || n.includes('/') || n.includes('Programming') || n.includes('Certification') || n.includes('Candidate Database')) return false;
      return true;
    });

    return {
      primaryEmail: emails.length > 0 ? emails[0] : null,
      primaryPhone: phones.length > 0 ? phones[0] : null,
      names: names.length > 0 ? Array.from(new Set(names)) : [],
      companies: companies.length > 0 ? Array.from(new Set(companies)) : [],
      places: places.length > 0 ? Array.from(new Set(places)) : [],
      rawText: text
    };
  }
}
