"use server";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { requireRole } from "@/lib/auth";
import { MK_COMPANY } from "@/lib/constants/mk-company";

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
];

async function generateTextWithFallback(prompt: string): Promise<string> {
  let lastError: any = null;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const { text } = await generateText({
        model: google(modelName),
        prompt,
        maxRetries: 0,
      });
      return text;
    } catch (err: any) {
      lastError = err;
    }
  }
  throw new Error(`All models failed: ${lastError?.message || lastError}`);
}

// ─── Invoice Dispatch Email Draft ─────────────────────────────────────────────
export async function generateInvoiceEmailDraftAction(data: {
  invoiceNumber: string;
  clientName: string;
  clientContactName?: string | null;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  feeBeforeTax: number;
  lineItems?: { particulars: string; feeAmount: number }[];
  contractNumber?: string | null;
  consultant?: string | null;
  currency?: string;
}): Promise<{ subject: string; body: string }> {
  await requireRole(["admin", "finance"]);

  const lineItemsSummary = (data.lineItems || [])
    .map((l, i) => `${i + 1}. ${l.particulars} — ₹${l.feeAmount.toLocaleString("en-IN")}`)
    .join("\n");

  const prompt = `You are drafting a professional invoice dispatch email from ${MK_COMPANY.legalName} (Executive Search & Advisory firm) to a client.

CONTEXT:
- Invoice Number: ${data.invoiceNumber}
- Invoice Date: ${data.invoiceDate}
- Due Date: ${data.dueDate}
- Client: ${data.clientName}
- Client Contact: ${data.clientContactName || "Finance Team / Accounts Payable"}
- Fee Amount (ex. GST): ₹${data.feeBeforeTax.toLocaleString("en-IN")}
- Total Amount Payable (incl. GST): ₹${data.totalAmount.toLocaleString("en-IN")}
- Consultant: ${data.consultant || "Mauna Kea Team"}
- Contract Reference: ${data.contractNumber || "As per engagement agreement"}
- Placement(s):
${lineItemsSummary || "Executive search placement"}

INSTRUCTIONS:
- Write a professional, warm, concise invoice dispatch email (5–8 lines body)
- Tone: formal but warm, partner-level communication
- Include: invoice number, total amount, due date, bank details reminder (HDFC Bank, IFSC: ${MK_COMPANY.bank.ifsc})
- End with a polite request to process payment and confirm receipt
- Sign off as: ${data.consultant || "The Mauna Kea Team"} | ${MK_COMPANY.legalName}
- Do NOT use "I hope this finds you well" or similar filler openers
- Do NOT use em-dashes excessively

Return ONLY a JSON object with exactly two fields:
{
  "subject": "email subject line",
  "body": "full email body text (use \\n for line breaks)"
}`;

  const raw = await generateTextWithFallback(prompt);

  // Extract JSON from response
  const jsonMatch = raw.match(/\{[\s\S]*"subject"[\s\S]*"body"[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback: structure the raw text
    return {
      subject: `Invoice ${data.invoiceNumber} — ${MK_COMPANY.legalName}`,
      body: raw.trim(),
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return { subject: parsed.subject || "", body: parsed.body || "" };
  } catch {
    return {
      subject: `Invoice ${data.invoiceNumber} — ${MK_COMPANY.legalName}`,
      body: raw.trim(),
    };
  }
}

// ─── Contract Execution Email Draft ──────────────────────────────────────────
export async function generateContractEmailDraftAction(data: {
  contractNumber: string;
  clientName: string;
  clientContactName?: string | null;
  contractStartDate: string;
  contractEndDate: string;
  consultant?: string | null;
  practice?: string | null;
  commercialStructure?: string | null;
  successFeePct?: number | null;
}): Promise<{ subject: string; body: string }> {
  await requireRole(["admin", "consultant", "finance"]);

  const prompt = `You are drafting a professional contract dispatch email from ${MK_COMPANY.legalName} (Executive Search & Advisory firm) to a client.

CONTEXT:
- Contract Number: ${data.contractNumber}
- Client: ${data.clientName}
- Client Contact: ${data.clientContactName || "Business Head / HR Leader"}
- Contract Period: ${data.contractStartDate} to ${data.contractEndDate}
- Consultant: ${data.consultant || "Mauna Kea Team"}
- Practice: ${data.practice || "Executive Search"}
- Fee Structure: ${data.commercialStructure || "Success Fee"} — ${data.successFeePct || 20}% of Annual CTC

INSTRUCTIONS:
- Write a professional, partner-level email to share the commercial agreement for review and signing (6–9 lines)
- Tone: warm, confident, professional
- Mention: contract number, validity period, a request to review and revert with signed copy or questions
- Mention that a Word copy is attached (editable for review)
- Do NOT use "I hope this finds you well" or similar filler
- Sign off as: ${data.consultant || "The Mauna Kea Team"} | ${MK_COMPANY.legalName}

Return ONLY a JSON object with exactly two fields:
{
  "subject": "email subject line",
  "body": "full email body text (use \\n for line breaks)"
}`;

  const raw = await generateTextWithFallback(prompt);

  const jsonMatch = raw.match(/\{[\s\S]*"subject"[\s\S]*"body"[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      subject: `Commercial Agreement — ${data.clientName} | ${MK_COMPANY.legalName}`,
      body: raw.trim(),
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return { subject: parsed.subject || "", body: parsed.body || "" };
  } catch {
    return {
      subject: `Commercial Agreement — ${data.clientName} | ${MK_COMPANY.legalName}`,
      body: raw.trim(),
    };
  }
}
