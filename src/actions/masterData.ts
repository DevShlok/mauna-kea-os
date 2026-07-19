"use server";
import { requireRole } from "@/lib/auth";

import { generateObjectWithFallback } from "@/lib/gemini-fallback";
import { z } from "zod";
import { db } from "@/db";
import { masterClients, masterIndustries, masterLocations } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { masterClientSchema, masterIndustrySchema, masterLocationSchema } from "@/lib/validations";

// ─────────────────────────────────────────────────────────
// MASTER CLIENTS
// ─────────────────────────────────────────────────────────

export async function mapMasterClientsAction(headers: string[], sampleData: string[][]) {
  await requireRole(["admin", "consultant"]);
  const schema = z.object({
    mapping: z.object({
      companyName: z.string().nullable().describe("Header matching Client / Company Name"),
      industry: z.string().nullable().describe("Header matching Industry / Sector"),
      accountOwner: z.string().nullable().describe("Header matching Account owner"),
      hrLeaderName: z.string().nullable().describe("Header matching HR Leader Name"),
      phone: z.string().nullable().describe("Header matching Phone no."),
      designation: z.string().nullable().describe("Header matching Designation"),
      linkedInUrl: z.string().nullable().describe("Header matching LinkedIn URL"),
      sourceUrl: z.string().nullable().describe("Header matching Source URL / Reference"),
      sourceType: z.string().nullable().describe("Header matching Source Type"),
      confidence: z.string().nullable().describe("Header matching Confidence"),
      notes: z.string().nullable().describe("Header matching Notes"),
    })
  });

  const { object } = await generateObjectWithFallback({
    schema,
    prompt: `Map the provided CSV headers to the standard system fields for Master Clients.
If a system field does not clearly match any CSV header, return null for that field.
Headers: ${JSON.stringify(headers)}
Sample: ${JSON.stringify(sampleData)}`
  });
  return object;
}

export async function bulkInsertMasterClientsAction(mappedData: any[]) {
  await requireRole(["admin", "consultant"]);
  if (!mappedData || mappedData.length === 0) throw new Error("No data provided");
  
  // Basic deduplication by companyName to avoid unique constraint errors
  const toInsert = mappedData.filter(m => m.companyName).map(m => ({
    companyName: m.companyName,
    industry: m.industry || "",
    accountOwner: m.accountOwner || "",
    hrLeaderName: m.hrLeaderName || "",
    phone: m.phone || "",
    designation: m.designation || "",
    linkedInUrl: m.linkedInUrl || "",
    sourceUrl: m.sourceUrl || "",
    sourceType: m.sourceType || "",
    confidence: m.confidence || "",
    notes: m.notes || "",
  }));

  // We can use onConflictDoNothing in drizzle, but it requires table alias or constraints.
  // For simplicity, we loop and insert, ignoring duplicates.
  let inserted = 0;
  for (const row of toInsert) {
    try {
      await db.insert(masterClients).values(row);
      inserted++;
    } catch (e) {
      // ignore unique constraint violation
    }
  }

  revalidatePath("/dashboard", "layout");
  return { success: true, count: inserted };
}

// ─────────────────────────────────────────────────────────
// MASTER INDUSTRIES
// ─────────────────────────────────────────────────────────

export async function mapMasterIndustriesAction(headers: string[], sampleData: string[][]) {
  await requireRole(["admin", "consultant"]);
  const schema = z.object({
    mapping: z.object({
      sectorName: z.string().nullable().describe("Header matching Sector / Industry"),
      includesConsolidatedFrom: z.string().nullable().describe("Header matching 'Includes / Consolidated From', or 'Industry / Sector- New', or similar. MUST be an exact match from the Headers array."),
    })
  });

  const { object } = await generateObjectWithFallback({
    schema,
    prompt: `Map the provided CSV headers to the standard system fields for Master Industries.
Headers: ${JSON.stringify(headers)}
Sample: ${JSON.stringify(sampleData)}`
  });
  return object;
}

export async function bulkInsertMasterIndustriesAction(mappedData: any[]) {
  await requireRole(["admin", "consultant"]);
  if (!mappedData || mappedData.length === 0) throw new Error("No data provided");
  
  let inserted = 0;
  for (const row of mappedData) {
    if (!row.sectorName) continue;
    try {
      await db.insert(masterIndustries).values({
        sectorName: row.sectorName,
        includesConsolidatedFrom: row.includesConsolidatedFrom || "",
      });
      inserted++;
    } catch (e: any) { 
      console.error("Failed to insert client row:", row, e.message); 
    }
  }
  revalidatePath("/dashboard", "layout");
  return { success: true, count: inserted };
}

// ─────────────────────────────────────────────────────────
// MASTER LOCATIONS
// ─────────────────────────────────────────────────────────

export async function mapMasterLocationsAction(headers: string[], sampleData: string[][]) {
  await requireRole(["admin", "consultant"]);
  const schema = z.object({
    mapping: z.object({
      rawEntry: z.string().nullable().describe("Header matching Original Raw Entry"),
      standardizedLocation: z.string().nullable().describe("Header matching Standardized Master Location"),
      mappingAction: z.string().nullable().describe("Header matching Mapping Action / Correction"),
    })
  });

  const { object } = await generateObjectWithFallback({
    schema,
    prompt: `Map the provided CSV headers to the standard system fields for Master Locations.
Headers: ${JSON.stringify(headers)}
Sample: ${JSON.stringify(sampleData)}`
  });
  return object;
}

export async function bulkInsertMasterLocationsAction(mappedData: any[]) {
  await requireRole(["admin", "consultant"]);
  if (!mappedData || mappedData.length === 0) throw new Error("No data provided");
  
  // const fs = require('fs');
  // fs.appendFileSync('import-debug.log', "Bulk Insert Locations Received Rows: " + mappedData.length + "\\n");
  
  let inserted = 0;
  for (const row of mappedData) {
    if (!row.rawEntry || !row.standardizedLocation) continue;
    try {
      await db.insert(masterLocations).values({
        rawEntry: row.rawEntry,
        standardizedLocation: row.standardizedLocation,
        mappingAction: row.mappingAction || "",
      });
      inserted++;
    } catch (e: any) { 
      console.error("Bulk Insert Error:", e.message); 
      // fs.appendFileSync('import-debug.log', "Insert Error for row " + JSON.stringify(row) + ": " + e.message + "\n");
    }
  }
  revalidatePath("/dashboard", "layout");
  return { success: true, count: inserted };
}

// ─────────────────────────────────────────────────────────
// MANUAL CRUD OPERATIONS
// ─────────────────────────────────────────────────────────

export async function createMasterClientAction(data: unknown) {
  await requireRole(["admin", "consultant"]);
  const validated = masterClientSchema.parse(data);
  await db.insert(masterClients).values(validated);
  revalidatePath("/dashboard/admin/master-data");
  return { success: true };
}

export async function updateMasterClientAction(id: number, data: unknown) {
  await requireRole(["admin", "consultant"]);
  const validated = masterClientSchema.parse(data);
  await db.update(masterClients).set(validated).where(eq(masterClients.id, id));
  revalidatePath("/dashboard/admin/master-data");
  return { success: true };
}

export async function deleteMasterClientAction(id: number) {
  await requireRole(["admin", "consultant"]);
  await db.delete(masterClients).where(eq(masterClients.id, id));
  revalidatePath("/dashboard/admin/master-data");
  return { success: true };
}

export async function createMasterIndustryAction(data: unknown) {
  await requireRole(["admin", "consultant"]);
  const validated = masterIndustrySchema.parse(data);
  await db.insert(masterIndustries).values(validated);
  revalidatePath("/dashboard/admin/master-data");
  return { success: true };
}

export async function updateMasterIndustryAction(id: number, data: unknown) {
  await requireRole(["admin", "consultant"]);
  const validated = masterIndustrySchema.parse(data);
  await db.update(masterIndustries).set(validated).where(eq(masterIndustries.id, id));
  revalidatePath("/dashboard/admin/master-data");
  return { success: true };
}

export async function deleteMasterIndustryAction(id: number) {
  await requireRole(["admin", "consultant"]);
  await db.delete(masterIndustries).where(eq(masterIndustries.id, id));
  revalidatePath("/dashboard/admin/master-data");
  return { success: true };
}

export async function createMasterLocationAction(data: unknown) {
  await requireRole(["admin", "consultant"]);
  const validated = masterLocationSchema.parse(data);
  await db.insert(masterLocations).values(validated);
  revalidatePath("/dashboard/admin/master-data");
  return { success: true };
}

export async function updateMasterLocationAction(id: number, data: unknown) {
  await requireRole(["admin", "consultant"]);
  const validated = masterLocationSchema.parse(data);
  await db.update(masterLocations).set(validated).where(eq(masterLocations.id, id));
  revalidatePath("/dashboard/admin/master-data");
  return { success: true };
}

export async function deleteMasterLocationAction(id: number) {
  await requireRole(["admin", "consultant"]);
  await db.delete(masterLocations).where(eq(masterLocations.id, id));
  revalidatePath("/dashboard/admin/master-data");
  return { success: true };
}

export async function bulkDeleteMasterClientsAction(ids: number[]) {
  await requireRole(["admin", "consultant"]);
  if (ids.length === 0) return { success: true };
  await db.delete(masterClients).where(inArray(masterClients.id, ids));
  revalidatePath("/dashboard/admin/master-data");
  return { success: true };
}

export async function bulkDeleteMasterIndustriesAction(ids: number[]) {
  await requireRole(["admin", "consultant"]);
  if (ids.length === 0) return { success: true };
  await db.delete(masterIndustries).where(inArray(masterIndustries.id, ids));
  revalidatePath("/dashboard/admin/master-data");
  return { success: true };
}

export async function bulkDeleteMasterLocationsAction(ids: number[]) {
  await requireRole(["admin", "consultant"]);
  if (ids.length === 0) return { success: true };
  await db.delete(masterLocations).where(inArray(masterLocations.id, ids));
  revalidatePath("/dashboard/admin/master-data");
  return { success: true };
}
