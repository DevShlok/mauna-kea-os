"use server";

import { generateObjectWithFallback } from "@/lib/gemini-fallback";
import { z } from "zod";
import { db } from "@/db";
import { clients, platformUsers, mandates } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────
// CLIENT IMPORTS
// ─────────────────────────────────────────────────────────

export async function mapClientsAction(headers: string[], sampleData: string[][]) {
  if (!headers || !Array.isArray(headers)) {
    throw new Error("Missing or invalid headers");
  }

  const schema = z.object({
    mapping: z.object({
      name: z.string().nullable().describe("Header matching Company Name"),
      vertical: z.string().nullable().describe("Header matching Vertical / Industry"),
      owner: z.string().nullable().describe("Header matching Owner / Consultant"),
      pocName: z.string().nullable().describe("Header matching POC Name"),
      pocEmail: z.string().nullable().describe("Header matching POC Email"),
    })
  });

  const { object } = await generateObjectWithFallback({
    schema,
    prompt: `You are an expert data mapping assistant. Map the provided CSV headers to the standard system fields for Clients.
If a system field does not clearly match any CSV header, return null for that field.

CSV Headers:
${JSON.stringify(headers, null, 2)}

Sample Data (first 3 rows):
${JSON.stringify(sampleData, null, 2)}`
  });

  return object;
}

export async function bulkInsertClientsAction(mappedClients: any[]) {
  if (!mappedClients || !Array.isArray(mappedClients) || mappedClients.length === 0) {
    throw new Error("No clients provided");
  }

  let insertedCount = 0;
  let failedRows: string[] = [];

  for (let i = 0; i < mappedClients.length; i++) {
    const c = mappedClients[i];
    if (!c.name) continue;

    try {
      const clientId = ("CLI-" + Date.now().toString() + "-" + i).substring(0, 50);

      // Insert Client
      await db.insert(clients).values({
        id: clientId,
        name: c.name,
        vertical: c.vertical || "",
        owner: c.owner || "System",
        status: "Active",
        metadata: c.metadata || {},
      });

      insertedCount++;

      // Auto-generate Platform User if POC details exist
      if (c.pocName && c.pocEmail) {
        const initials = c.pocName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
        
        // Check if user exists
        const existingUser = await db.select().from(platformUsers).where(eq(platformUsers.email, c.pocEmail));
        
        if (existingUser.length === 0) {
          const uId = "U-" + Math.floor(Math.random() * 9999999).toString().padStart(7, '0');
          await db.insert(platformUsers).values({
            id: uId,
            name: c.pocName,
            email: c.pocEmail,
            role: "client",
            status: "Active",
            initials,
            linkedClientId: clientId,
            lastActive: new Date(),
          });
        }
      }
    } catch (err) {
      console.error("Failed to insert client row:", c, err);
      failedRows.push(c.name || `Row ${i + 1}`);
    }
  }

  revalidatePath("/dashboard", "layout");
  return { success: true, insertedCount, failedCount: failedRows.length, failedRows };
}

// ─────────────────────────────────────────────────────────
// MANDATE IMPORTS
// ─────────────────────────────────────────────────────────

export async function mapMandatesAction(headers: string[], sampleData: string[][]) {
  if (!headers || !Array.isArray(headers)) {
    throw new Error("Missing or invalid headers");
  }

  const schema = z.object({
    mapping: z.object({
      company: z.string().nullable().describe("Header matching Company / Client company name"),
      role: z.string().nullable().describe("Header matching Role / Position (e.g. CFO, CHRO)"),
      ctc: z.string().nullable().describe("Header matching CTC Range (e.g. ₹180-240L)"),
      exp: z.string().nullable().describe("Header matching Experience (e.g. 15-20 yrs)"),
      pocName: z.string().nullable().describe("Header matching POC Name / Client point of contact"),
      pocEmail: z.string().nullable().describe("Header matching POC Email (e.g. poc@company.com)"),
      pocPhone: z.string().nullable().describe("Header matching POC Phone"),
      geography: z.string().nullable().describe("Header matching Location"),
    })
  });

  const { object } = await generateObjectWithFallback({
    schema,
    prompt: `You are an expert data mapping assistant. Map the provided CSV headers to the standard system fields for Mandates.
If a system field does not clearly match any CSV header, return null for that field.

CSV Headers:
${JSON.stringify(headers, null, 2)}

Sample Data (first 3 rows):
${JSON.stringify(sampleData, null, 2)}`
  });

  return object;
}

export async function bulkInsertMandatesAction(mappedMandates: any[], currentUserName: string, clientId?: string, clientName?: string) {
  if (!mappedMandates || !Array.isArray(mappedMandates) || mappedMandates.length === 0) {
    throw new Error("No mandates provided");
  }

  let insertedCount = 0;
  let failedRows: string[] = [];

  for (let i = 0; i < mappedMandates.length; i++) {
    const m = mappedMandates[i];
    
    try {
      // We enforce that they belong to the specified client, or the one from the file
      let companyName = clientName || m.company;
      if (!companyName) {
        throw new Error("Company name missing for row");
      }
      
      if (!clientId) {
        // Look for the client by name (case-insensitive)
        const [existing] = await db.select().from(clients).where(sql`LOWER(${clients.name}) = LOWER(${companyName})`).limit(1);
        if (!existing) {
          // Auto-create client
          const newClientId = ("CLI-" + Date.now().toString() + "-" + i).substring(0, 50);
          await db.insert(clients).values({
            id: newClientId,
            name: companyName,
            vertical: "",
            owner: currentUserName || "System",
            status: "Active",
            metadata: {},
          });
        } else {
          companyName = existing.name; // normalize to DB name
        }
      }

      if (!m.role) continue;

      await db.insert(mandates).values({
        company: companyName,
        role: m.role,
        ctc: m.ctc || "",
        exp: m.exp || "",
        geography: m.geography || "",
        clientPOC: m.pocName || "",
        pocEmail: m.pocEmail || "",
        pocPhone: m.pocPhone || "",
        status: "universe",
        internalStatus: "contractsent",
        metadata: m.metadata || {},
      });

      insertedCount++;
    } catch (err) {
      console.error("Failed to insert mandate row:", m, err);
      failedRows.push(`${m.role || 'Unknown Role'} at ${m.company || 'Unknown Company'}`);
    }
  }

  revalidatePath("/dashboard", "layout");
  return { success: true, insertedCount, failedCount: failedRows.length, failedRows };
}

// ─────────────────────────────────────────────────────────
// USER IMPORTS
// ─────────────────────────────────────────────────────────

export async function mapUsersAction(headers: string[], sampleData: string[][]) {
  if (!headers || !Array.isArray(headers)) throw new Error("Missing or invalid headers");

  const schema = z.object({
    mapping: z.object({
      name: z.string().nullable().describe("Header matching User Full Name"),
      email: z.string().nullable().describe("Header matching User Email Address"),
      role: z.string().nullable().describe("Header matching Role (admin, consultant, etc)"),
      status: z.string().nullable().describe("Header matching Status (Active, Inactive)"),
    })
  });

  const { object } = await generateObjectWithFallback({
    schema,
    prompt: `You are an expert data mapping assistant. Map the provided CSV headers to the standard system fields for Platform Users.
If a system field does not clearly match any CSV header, return null for that field.

CSV Headers:
${JSON.stringify(headers, null, 2)}

Sample Data:
${JSON.stringify(sampleData, null, 2)}`
  });

  return object;
}

export async function bulkInsertUsersAction(mappedUsers: any[]) {
  if (!mappedUsers || !Array.isArray(mappedUsers) || mappedUsers.length === 0) throw new Error("No users provided");

  let insertedCount = 0;
  let failedRows: string[] = [];

  for (let i = 0; i < mappedUsers.length; i++) {
    const u = mappedUsers[i];
    if (!u.email || !u.name) continue;

    try {
      const uId = "U-" + Math.floor(Math.random() * 9999999).toString().padStart(7, '0');
      const initials = u.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
      
      const existing = await db.select().from(platformUsers).where(eq(platformUsers.email, u.email));
      if (existing.length === 0) {
        await db.insert(platformUsers).values({
          id: uId,
          name: u.name,
          email: u.email,
          role: u.role || "consultant",
          status: u.status || "Active",
          initials,
          lastActive: new Date(),
        });
        insertedCount++;
      } else {
        failedRows.push(`Duplicate Email: ${u.email}`);
      }
    } catch (err) {
      console.error("Failed to insert user row:", u, err);
      failedRows.push(u.email);
    }
  }

  revalidatePath("/dashboard/admin", "layout");
  return { success: true, insertedCount, failedCount: failedRows.length, failedRows };
}

// ─────────────────────────────────────────────────────────
// FLOAT IMPORTS
// ─────────────────────────────────────────────────────────

export async function mapFloatsAction(headers: string[], sampleData: string[][]) {
  if (!headers || !Array.isArray(headers)) throw new Error("Missing or invalid headers");

  const schema = z.object({
    mapping: z.object({
      name: z.string().nullable().describe("Header matching Candidate Name"),
      company: z.string().nullable().describe("Header matching Current Company"),
      role: z.string().nullable().describe("Header matching Current Role"),
      geography: z.string().nullable().describe("Header matching Location"),
      ctc: z.string().nullable().describe("Header matching Current CTC"),
      status: z.string().nullable().describe("Header matching Float Status (e.g. Needs Contact)"),
    })
  });

  const { object } = await generateObjectWithFallback({
    schema,
    prompt: `You are an expert data mapping assistant. Map the provided CSV headers to the standard system fields for Floats (passive candidates list).
If a system field does not clearly match any CSV header, return null for that field.

CSV Headers:
${JSON.stringify(headers, null, 2)}

Sample Data:
${JSON.stringify(sampleData, null, 2)}`
  });

  return object;
}

export async function bulkInsertFloatsAction(mappedFloats: any[]) {
  if (!mappedFloats || !Array.isArray(mappedFloats) || mappedFloats.length === 0) throw new Error("No floats provided");

  let insertedCount = 0;
  let failedRows: string[] = [];
  const floatsModule = await import("@/db/schema");

  for (let i = 0; i < mappedFloats.length; i++) {
    const f = mappedFloats[i];
    if (!f.name) continue;

    try {
      const candId = `cand-${Math.random().toString(36).substring(2, 9)}`;
      await db.insert(floatsModule.floats).values({
        id: `float-${Math.random().toString(36).substring(2, 9)}`,
        candId: candId,
        candName: f.name,
        client: f.company || "General",
        role: f.role || "",
        status: f.status || "Pending",
        consultant: "System Import"
      });
      insertedCount++;
    } catch (err) {
      console.error("Failed to insert float row:", f, err);
      failedRows.push(f.name);
    }
  }

  revalidatePath("/dashboard/float-list", "layout");
  return { success: true, insertedCount, failedCount: failedRows.length, failedRows };
}

// ─────────────────────────────────────────────────────────
// CANDIDATE PIPELINE IMPORTS
// ─────────────────────────────────────────────────────────

export async function mapCandidatesAction(headers: string[], sampleData: string[][]) {
  if (!headers || !Array.isArray(headers)) throw new Error("Missing or invalid headers");

  const schema = z.object({
    mapping: z.object({
      name: z.string().nullable().describe("Header matching Candidate Name"),
      email: z.string().nullable().describe("Header matching Candidate Email"),
      mobile: z.string().nullable().describe("Header matching Candidate Mobile / Phone Number"),
      linkedin: z.string().nullable().describe("Header matching LinkedIn URL"),
      company: z.string().nullable().describe("Header matching Current Company"),
      designation: z.string().nullable().describe("Header matching Current Designation / Role"),
      location: z.string().nullable().describe("Header matching Location"),
    })
  });

  const { object } = await generateObjectWithFallback({
    schema,
    prompt: `You are an expert data mapping assistant. Map the provided CSV headers to the standard system fields for Candidates.
If a system field does not clearly match any CSV header, return null for that field.

CSV Headers:
${JSON.stringify(headers, null, 2)}

Sample Data:
${JSON.stringify(sampleData, null, 2)}`
  });

  return object;
}

export async function bulkInsertMandateCandidatesAction(mappedCandidates: any[], mandateId: number, currentUser: { name: string }) {
  if (!mappedCandidates || !Array.isArray(mappedCandidates) || mappedCandidates.length === 0) throw new Error("No candidates provided");
  if (!mandateId) throw new Error("Mandate ID required");

  let insertedCount = 0;
  let failedRows: string[] = [];
  const dbSchema = await import("@/db/schema");
  const { or, eq, and } = await import("drizzle-orm");

  for (let i = 0; i < mappedCandidates.length; i++) {
    const c = mappedCandidates[i];
    if (!c.name) continue; // Name is required

    try {
      // 1. Try to find if candidate exists in master DB
      // Duplicate heuristic: Email OR LinkedIn OR Phone OR (Name AND Company)
      const orConditions = [];
      if (c.email) orConditions.push(eq(dbSchema.candidates.email, c.email));
      if (c.linkedin) orConditions.push(eq(dbSchema.candidates.linkedin, c.linkedin));
      if (c.mobile) orConditions.push(eq(dbSchema.candidates.mobile, c.mobile));
      if (c.name && c.company) orConditions.push(and(eq(dbSchema.candidates.name, c.name), eq(dbSchema.candidates.company, c.company)));
      
      let masterCandidateId = null;
      let initials = c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
      
      if (orConditions.length > 0) {
        const existing = await db.select().from(dbSchema.candidates).where(or(...orConditions));
        if (existing.length > 0) {
          masterCandidateId = existing[0].id;
          initials = existing[0].initials || initials;
        }
      }

      // 2. Create in master DB if not found
      if (!masterCandidateId) {
        masterCandidateId = `CAND-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        await db.insert(dbSchema.candidates).values({
          id: masterCandidateId,
          name: c.name,
          email: c.email || null,
          mobile: c.mobile || null,
          linkedin: c.linkedin || null,
          company: c.company || null,
          designation: c.designation || null,
          location: c.location || null,
          initials: initials,
          status: "Active",
        });
      }

      // 3. Attach to Mandate Candidates (check if already attached)
      const existingAttachment = await db.select().from(dbSchema.mandateCandidates)
        .where(and(eq(dbSchema.mandateCandidates.mandateId, mandateId), eq(dbSchema.mandateCandidates.externalId, masterCandidateId)));
      
      if (existingAttachment.length === 0) {
        await db.insert(dbSchema.mandateCandidates).values({
          externalId: masterCandidateId,
          mandateId: mandateId,
          name: c.name,
          company: c.company || null,
          role: c.designation || null,
          stage: "universe",
          initials: initials,
          addedBy: currentUser.name,
          createdAt: new Date(),
        });
        insertedCount++;
      } else {
        // Already attached, skip
        failedRows.push(`${c.name} (Already attached)`);
      }
    } catch (err) {
      console.error("Failed to insert candidate row:", c, err);
      failedRows.push(c.name);
    }
  }

  revalidatePath(`/dashboard/mandates/${mandateId}`, "layout");
  return { success: true, insertedCount, failedCount: failedRows.length, failedRows };
}
