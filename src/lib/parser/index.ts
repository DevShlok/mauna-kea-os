const pdfParse = require("pdf-parse-new");
import mammoth from "mammoth";
import nlp from "compromise";
import { generateObjectWithFallback } from "@/lib/gemini-fallback";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

// ─── Supported MIME Types ─────────────────────────────────────────────────────
export const SUPPORTED_PDF_TYPES = ["application/pdf"];
export const SUPPORTED_WORD_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
];
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/gif",
];
export const ALL_SUPPORTED_TYPES = [
  ...SUPPORTED_PDF_TYPES,
  ...SUPPORTED_WORD_TYPES,
  ...SUPPORTED_IMAGE_TYPES,
];

// ─── Individual Extractors ────────────────────────────────────────────────────

/**
 * Extracts raw text from a PDF buffer using pdf-parse-new.
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
 * Extracts raw text from a Word document (.docx or .doc) buffer using mammoth.
 */
export async function extractTextFromWord(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    console.error("Failed to parse Word document", error);
    return "";
  }
}

/**
 * Extracts text from an image buffer using Gemini Vision (OCR).
 * Sends the image directly as base64 to the Gemini model.
 */
export async function extractTextFromImage(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    const base64 = buffer.toString("base64");

    // Attempt with each fallback model in order
    const fallbackModels = [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.5-flash-lite",
    ];

    let lastError: any = null;
    for (const modelName of fallbackModels) {
      try {
        const { text } = await generateText({
          model: google(modelName),
          maxRetries: 0,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  image: `data:${mimeType};base64,${base64}`,
                },
                {
                  type: "text",
                  text: "This is a CV or resume image. Please perform OCR and extract all the text you can see. Return only the raw extracted text, preserving formatting as best you can. Do not summarize, translate, or add commentary.",
                },
              ],
            },
          ],
        });
        return text || "";
      } catch (err) {
        lastError = err;
      }
    }

    console.error("All Gemini Vision models failed for OCR:", lastError);
    return "";
  } catch (error) {
    console.error("Failed to perform image OCR", error);
    return "";
  }
}

/**
 * Universal text extractor — routes to the correct extractor based on MIME type.
 * Use this as the single entry point for all file types.
 *
 * @param buffer - The raw file buffer
 * @param mimeType - The file's MIME type string
 * @returns Extracted raw text (empty string on failure)
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (SUPPORTED_PDF_TYPES.includes(mimeType)) {
    return extractTextFromPdf(buffer);
  }
  if (SUPPORTED_WORD_TYPES.includes(mimeType)) {
    return extractTextFromWord(buffer);
  }
  if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
    return extractTextFromImage(buffer, mimeType);
  }

  console.warn(`Unsupported file type for extraction: ${mimeType}`);
  return "";
}

// ─── Entity Extraction (shared for all file types) ────────────────────────────

/**
 * Reusable NLP/AI pipeline to extract entities from raw CV text.
 * Works for text extracted from PDFs, Word docs, or images.
 */
export async function extractEntitiesFromText(text: string) {
  try {
    const schema = z.object({
      names: z
        .array(z.string())
        .describe(
          "The name of the candidate. Usually the largest text at the top. Only include the actual person's name, not certifications or roles."
        ),
      primaryEmail: z
        .string()
        .nullable()
        .describe("The candidate's primary email address."),
      primaryPhone: z
        .string()
        .nullable()
        .describe("The candidate's primary phone number."),
      companies: z
        .array(z.string())
        .describe("List of companies the candidate has worked for."),
      places: z
        .array(z.string())
        .describe("Locations, cities, or countries mentioned."),
    });

    const { object } = await generateObjectWithFallback({
      schema,
      system:
        "You are a highly accurate CV parsing assistant. Extract entities carefully from the raw CV text. Ensure you do not confuse certification names (e.g. 'C++ Programming') with the candidate's personal name.",
      prompt: `Extract entities from this CV:\n\n${text.substring(0, 15000)}`,
    });

    const data = object as any;

    return {
      primaryEmail: data?.primaryEmail || null,
      primaryPhone: data?.primaryPhone || null,
      names: data?.names || [],
      companies: data?.companies || [],
      places: data?.places || [],
      rawText: text,
    };
  } catch (error) {
    console.error("AI Entity Extraction failed, falling back to NLP", error);

    // Regex fallbacks for high-accuracy fields
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex =
      /(?:\+?\d{1,3}[-.s]?)?\(?\d{3}\)?[-.s]?\d{3}[-.s]?\d{4}/g;

    const emails = text.match(emailRegex) || [];
    const phones = text.match(phoneRegex) || [];

    const cleanText = text
      .replace(/Home\s*\/\s*Candidate Database\s*\//gi, "")
      .replace(/Certification.*?–/gi, "");

    const doc = nlp(cleanText);

    let names = doc.people().out("array") as string[];
    let companies = doc.organizations().out("array") as string[];
    let places = doc.places().out("array") as string[];

    names = names.filter((n) => {
      if (n.length < 3 || n.length > 30) return false;
      if (
        n.includes("–") ||
        n.includes("/") ||
        n.includes("Programming") ||
        n.includes("Certification") ||
        n.includes("Candidate Database")
      )
        return false;
      return true;
    });

    return {
      primaryEmail: emails.length > 0 ? emails[0] : null,
      primaryPhone: phones.length > 0 ? phones[0] : null,
      names: names.length > 0 ? Array.from(new Set(names)) : [],
      companies: companies.length > 0 ? Array.from(new Set(companies)) : [],
      places: places.length > 0 ? Array.from(new Set(places)) : [],
      rawText: text,
    };
  }
}
