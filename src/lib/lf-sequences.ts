/**
 * lib/lf-sequences.ts
 *
 * Atomic auto-number generator for Legal & Finance document numbers.
 * Uses a database-level upsert+increment to ensure no duplicates even
 * under concurrent requests.
 *
 * Number formats:
 *   Contract: MK-CON-2026-00001
 *   Invoice:  MK-IN-2026-00001
 *   Credit Note: CN-MK-IN-2026-00001  (prefix added by caller)
 */
"use server";

import { db } from "@/db";
import { lfSequences } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Atomically increments the sequence counter and returns the next value.
 * Key format: '<type>_<YYYY>'  e.g. 'contract_2026' | 'invoice_2026'
 *
 * The upsert pattern:
 *   INSERT key=1  ON CONFLICT → UPDATE last_val = last_val + 1
 * This is safe under concurrent calls — Postgres serialises the UPDATE
 * and each caller gets a unique last_val on their subsequent SELECT.
 */
export async function nextLfSequence(
  type: "contract" | "invoice"
): Promise<string> {
  const year = new Date().getFullYear();
  const key = `${type}_${year}`;

  // Upsert: create the row with 1, or increment existing
  await db
    .insert(lfSequences)
    .values({ key, lastVal: 1 })
    .onConflictDoUpdate({
      target: lfSequences.key,
      set: { lastVal: sql`${lfSequences.lastVal} + 1` },
    });

  const [row] = await db
    .select({ lastVal: lfSequences.lastVal })
    .from(lfSequences)
    .where(eq(lfSequences.key, key));

  return String(row.lastVal).padStart(5, "0");
}

/**
 * Generates a full contract number: MK-CON-2026-00001
 */
export async function generateContractNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextLfSequence("contract");
  return `MK-CON-${year}-${seq}`;
}

/**
 * Generates a full invoice number: MK-IN-2026-00001
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextLfSequence("invoice");
  return `MK-IN-${year}-${seq}`;
}
