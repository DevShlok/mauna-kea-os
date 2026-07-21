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

export async function bulkInsertMandatesAction(mappedMandates: any[], clientId: string, clientName: string) {
  if (!mappedMandates || !Array.isArray(mappedMandates) || mappedMandates.length === 0) {
    throw new Error("No mandates provided");
  }

  let insertedCount = 0;
  let failedRows: string[] = [];

  for (let i = 0; i < mappedMandates.length; i++) {
    const m = mappedMandates[i];
    
    try {
      // We enforce that they belong to the specified client
      const companyName = clientName || m.company || "Unknown Company";
      
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
      await db.insert(floatsModule.floats).values({
        candidateName: f.name,
        company: f.company || "",
        role: f.role || "",
        geography: f.geography || "",
        status: f.status || "Needs Contact",
        ctc: f.ctc || "",
        addedBy: "System Import",
        metadata: f.metadata || {},
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
