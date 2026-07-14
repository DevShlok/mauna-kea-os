"use server";

import { db } from "@/db";
import { masterClients, masterIndustries, masterLocations } from "@/db/schema";
import { ilike, or } from "drizzle-orm";

export async function searchMasterLocationsAction(query: string) {
  if (!query) return [];
  const results = await db.select()
    .from(masterLocations)
    .where(or(
      ilike(masterLocations.rawEntry, `%${query}%`),
      ilike(masterLocations.standardizedLocation, `%${query}%`)
    ))
    .limit(10);
  
  // We want to return unique standardized locations
  const uniqueLocations = Array.from(new Set(results.map(r => r.standardizedLocation)));
  return uniqueLocations;
}

export async function searchMasterIndustriesAction(query: string) {
  if (!query) return [];
  const results = await db.select()
    .from(masterIndustries)
    .where(ilike(masterIndustries.sectorName, `%${query}%`))
    .limit(10);
  return results.map(r => r.sectorName);
}

export async function searchMasterClientsAction(query: string) {
  if (!query) return [];
  const results = await db.select()
    .from(masterClients)
    .where(ilike(masterClients.companyName, `%${query}%`))
    .limit(10);
  return results; // Return full objects so we can autofill HR POC and Industry
}
