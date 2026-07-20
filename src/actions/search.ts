"use server";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { candidates, mandates, clients } from "@/db/schema";
import { eq, or, ilike, desc, and } from "drizzle-orm";

export async function searchCandidatesAction(query: string, limit = 50) {
  const { platformUser: pUser, email } = await requireRole(["admin", "consultant", "client"]);
  // We will allow empty queries to fetch the 50 most recent candidates

  // Clients shouldn't search the master candidate DB (handled at page level usually, but just in case)
  if (pUser?.role === "client") return [];
  if (pUser?.role === "candidate") return [];

  const searchPattern = `%${query}%`;
  
  // If query is empty, return the 50 most recent active candidates
  const conditions = query && query.length >= 2 
    ? or(
        ilike(candidates.name, searchPattern),
        ilike(candidates.company, searchPattern),
        ilike(candidates.designation, searchPattern)
      )
    : undefined;

  const results = await db.select({
    id: candidates.id,
    name: candidates.name,
    company: candidates.company,
    designation: candidates.designation,
    email: candidates.email,
    status: candidates.status,
    cvText: candidates.cvText,
  })
  .from(candidates)
  .where(conditions)
  .orderBy(desc(candidates.createdAt))
  .limit(limit);

  return results;
}

export async function searchMandatesAction(query: string, limit = 50) {
  const { platformUser: pUser, email } = await requireRole(["admin", "consultant", "client"]);
  if (!query || query.length < 2) return [];

  const searchPattern = `%${query}%`;
  
  let conditions = [
    or(
      ilike(mandates.company, searchPattern),
      ilike(mandates.role, searchPattern)
    )
  ];

  if (pUser?.role === "client" && pUser.linkedClientId) {
    const [client] = await db.select().from(clients).where(eq(clients.id, pUser.linkedClientId));
    if (client) {
      conditions.push(eq(mandates.company, client.name));
    } else {
      return [];
    }
  }

  const results = await db.select({
    id: mandates.id,
    company: mandates.company,
    role: mandates.role,
    status: mandates.status
  })
  .from(mandates)
  .where(and(...conditions))
  .limit(limit);

  return results;
}
