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

function normalizeClientName(name: string) {
  if (!name) return "";
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(pvt|ltd|limited|inc|llc|corp|corporation)$/, "");
}

export async function checkClientDuplicatesAction(mappedClients: any[]) {
  const allClients = await db.select().from(clients);
  const duplicates = [];
  const newClients = [];

  for (const c of mappedClients) {
    if (!c.name) continue;
    const normalized = normalizeClientName(c.name);
    const existing = allClients.find(dbC => normalizeClientName(dbC.name) === normalized);
    
    if (existing) {
      duplicates.push({
        incomingRecord: c,
        existingRecord: existing,
        reason: `Name Match: ${c.name} ≈ ${existing.name}`
      });
    } else {
      newClients.push(c);
    }
  }

  return { duplicates, newClients };
}

export async function finalizeClientsImportAction(newClients: any[], resolvedUpdates: any[]) {
  let insertedCount = 0;
  let updatedCount = 0;
  let failedRows: string[] = [];

  // Insert truly new clients
  for (let i = 0; i < newClients.length; i++) {
    const c = newClients[i];
    try {
      const clientId = ("CLI-" + Date.now().toString() + "-" + i).substring(0, 50);
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

  // Handle updates / overwrites
  for (const update of resolvedUpdates) {
    try {
      if (update.action === 'replace') {
        const c = update.data;
        await db.update(clients).set({
          name: c.name,
          vertical: c.vertical || update.existing.vertical,
          owner: c.owner || update.existing.owner,
          metadata: { ...update.existing.metadata, ...c.metadata }
        }).where(eq(clients.id, update.id));
        updatedCount++;
      } else if (update.action === 'update') {
        const c = update.data;
        const toUpdate: any = {};
        if (c.name) toUpdate.name = c.name;
        if (c.vertical) toUpdate.vertical = c.vertical;
        if (c.owner) toUpdate.owner = c.owner;
        if (c.metadata) toUpdate.metadata = { ...update.existing.metadata, ...c.metadata };
        
        await db.update(clients).set(toUpdate).where(eq(clients.id, update.id));
        updatedCount++;
      }
    } catch (err) {
      console.error("Failed to update client row:", update.id, err);
      failedRows.push(update.data.name || update.id);
    }
  }

  revalidatePath("/dashboard", "layout");
  return { success: true, insertedCount, updatedCount, failedCount: failedRows.length, failedRows };
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

// Helper to extract numbers from a string (e.g., "15-20 yrs" -> [15, 20], "15" -> [15])
function extractNumbers(str: string | null | undefined): number[] {
  if (!str) return [];
  const matches = str.match(/\d+(\.\d+)?/g);
  return matches ? matches.map(Number) : [];
}

// Helper to check if two ranges/numbers overlap or are close
function isFuzzyMatch(val1: string | null | undefined, val2: string | null | undefined, thresholdRatio: number): boolean {
  if (!val1 && !val2) return true;
  if (!val1 || !val2) return false; // One has it, one doesn't -> assume not duplicate to be safe
  
  const nums1 = extractNumbers(val1);
  const nums2 = extractNumbers(val2);
  
  if (nums1.length === 0 || nums2.length === 0) return true; // Could not parse numbers, fallback to duplicate
  
  const min1 = Math.min(...nums1);
  const max1 = Math.max(...nums1);
  const min2 = Math.min(...nums2);
  const max2 = Math.max(...nums2);
  
  // Check overlap
  if (min1 <= max2 && min2 <= max1) return true;
  
  // If no overlap, check how close they are based on threshold ratio
  // e.g. for CTC, if max1 is 100, thresholdRatio 0.3, distance should be <= 30
  const avg = (max1 + max2) / 2;
  const distance = Math.min(Math.abs(min1 - max2), Math.abs(min2 - max1));
  
  return (distance / avg) <= thresholdRatio;
}

export async function checkMandateDuplicatesAction(mappedMandates: any[], clientId?: string, clientName?: string) {
  const allMandates = await db.select().from(mandates);
  const duplicates = [];
  const newMandates = [];

  for (const m of mappedMandates) {
    if (!m.role) continue;
    
    let companyName = clientName || m.company;
    if (!companyName) continue; // Skip invalid rows without company

    // normalize strings for comparison
    const normRole = m.role.trim().toLowerCase();
    const normCompany = companyName.trim().toLowerCase();

    // Primary match: role and company
    const matchingRoles = allMandates.filter(dbM => 
      dbM.role.trim().toLowerCase() === normRole && 
      dbM.company.trim().toLowerCase() === normCompany
    );

    let isDuplicate = false;
    let matchedRecord = null;

    for (const dbM of matchingRoles) {
      // Fuzzy match on CTC (allow ~30% difference) and Experience (allow ~30% difference)
      const ctcMatch = isFuzzyMatch(m.ctc, dbM.ctc, 0.3);
      const expMatch = isFuzzyMatch(m.exp, dbM.exp, 0.3);
      
      if (ctcMatch && expMatch) {
        isDuplicate = true;
        matchedRecord = dbM;
        break;
      }
    }

    if (isDuplicate && matchedRecord) {
      duplicates.push({
        incomingRecord: { ...m, company: companyName }, // ensure company is set
        existingRecord: matchedRecord,
        reason: `Role & Company Match with similar CTC/Exp: ${m.role} at ${companyName}`
      });
    } else {
      newMandates.push({ ...m, company: companyName });
    }
  }

  return { duplicates, newMandates };
}

export async function finalizeMandatesImportAction(newMandates: any[], resolvedUpdates: any[], currentUserName: string, clientId?: string, clientName?: string) {
  let insertedCount = 0;
  let updatedCount = 0;
  let failedRows: string[] = [];

  // Insert truly new mandates
  for (let i = 0; i < newMandates.length; i++) {
    const m = newMandates[i];
    try {
      let companyName = m.company;
      
      if (!clientId) {
        // Look for the client by name (case-insensitive) to auto-create if missing
        const [existing] = await db.select().from(clients).where(sql`LOWER(${clients.name}) = LOWER(${companyName})`).limit(1);
        if (!existing) {
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

  // Handle updates / overwrites
  for (const update of resolvedUpdates) {
    try {
      if (update.action === 'replace') {
        const m = update.data;
        await db.update(mandates).set({
          role: m.role,
          ctc: m.ctc || update.existing.ctc,
          exp: m.exp || update.existing.exp,
          geography: m.geography || update.existing.geography,
          clientPOC: m.pocName || update.existing.clientPOC,
          pocEmail: m.pocEmail || update.existing.pocEmail,
          pocPhone: m.pocPhone || update.existing.pocPhone,
          metadata: { ...update.existing.metadata, ...m.metadata }
        }).where(eq(mandates.id, update.id));
        updatedCount++;
      } else if (update.action === 'update') {
        const m = update.data;
        const toUpdate: any = {};
        if (m.role) toUpdate.role = m.role;
        if (m.ctc) toUpdate.ctc = m.ctc;
        if (m.exp) toUpdate.exp = m.exp;
        if (m.geography) toUpdate.geography = m.geography;
        if (m.pocName) toUpdate.clientPOC = m.pocName;
        if (m.pocEmail) toUpdate.pocEmail = m.pocEmail;
        if (m.pocPhone) toUpdate.pocPhone = m.pocPhone;
        if (m.metadata) toUpdate.metadata = { ...update.existing.metadata, ...m.metadata };
        
        await db.update(mandates).set(toUpdate).where(eq(mandates.id, update.id));
        updatedCount++;
      }
    } catch (err) {
      console.error("Failed to update mandate row:", update.id, err);
      failedRows.push(update.data.role || update.id);
    }
  }

  revalidatePath("/dashboard", "layout");
  return { success: true, insertedCount, updatedCount, failedCount: failedRows.length, failedRows };
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

export async function checkUserDuplicatesAction(mappedUsers: any[]) {
  const duplicates = [];
  const newUsers = [];

  for (const u of mappedUsers) {
    if (!u.email || !u.name) continue;

    // Duplicate logic: strictly by email
    const existing = await db.select().from(platformUsers).where(eq(platformUsers.email, u.email));
    if (existing.length > 0) {
      duplicates.push({
        incomingRecord: u,
        existingRecord: existing[0],
        reason: `A user with email "${u.email}" already exists in the system.`
      });
    } else {
      newUsers.push(u);
    }
  }

  return { duplicates, newUsers };
}

export async function finalizeUserImportAction(newUsers: any[], resolvedUpdates: any[]) {
  let insertedCount = 0;
  let failedRows: string[] = [];

  // 1. Process Resolved Updates (Overwrite existing user details)
  for (const update of resolvedUpdates) {
    try {
      if (update.action === 'replace' || update.action === 'update') {
        const payload = update.data;
        const updates: any = {};
        if (payload.name) updates.name = payload.name;
        if (payload.role) updates.role = payload.role;
        if (payload.status) updates.status = payload.status;
        if (payload.name) updates.initials = payload.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

        if (Object.keys(updates).length > 0) {
          await db.update(platformUsers).set(updates).where(eq(platformUsers.id, update.id));
        }
        insertedCount++;
      }
    } catch (err) {
      failedRows.push(update.existing?.email || 'Unknown User (Resolved)');
    }
  }

  // 2. Insert truly new users
  for (const u of newUsers) {
    try {
      const uId = "U-" + Math.floor(Math.random() * 9999999).toString().padStart(7, '0');
      const initials = u.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

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

export async function checkFloatDuplicatesAction(mappedFloats: any[]) {
  const dbSchema = await import("@/db/schema");
  const { or, eq, and } = await import("drizzle-orm");
  const duplicates = [];
  const newFloats = [];

  const allExistingFloats = await db.select().from(dbSchema.floats);

  for (const f of mappedFloats) {
    if (!f.name) continue;

    const orConditions = [];
    if (f.email) orConditions.push(eq(dbSchema.candidates.email, f.email));
    if (f.linkedin) orConditions.push(eq(dbSchema.candidates.linkedin, f.linkedin));
    if (f.mobile) orConditions.push(eq(dbSchema.candidates.mobile, f.mobile));
    if (f.name && f.company) orConditions.push(and(eq(dbSchema.candidates.name, f.name), eq(dbSchema.candidates.company, f.company)));

    let matchedCandidate = null;
    if (orConditions.length > 0) {
      const existing = await db.select().from(dbSchema.candidates).where(or(...orConditions));
      if (existing.length > 0) {
        matchedCandidate = existing[0];
      }
    }

    if (matchedCandidate) {
      const isAssigned = allExistingFloats.some(fl => fl.candId === matchedCandidate.id);
      duplicates.push({
        incomingRecord: f,
        existingRecord: matchedCandidate,
        reason: isAssigned ? `Candidate already exists and is ASSIGNED to the Float List.` : `Candidate already exists in database.`
      });
    } else {
      newFloats.push(f);
    }
  }

  return { duplicates, newFloats };
}

export async function finalizeFloatImportAction(newFloats: any[], resolvedUpdates: any[], currentUser: { name: string }) {
  let insertedCount = 0;
  let failedRows: string[] = [];
  const dbSchema = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const allExistingFloats = await db.select().from(dbSchema.floats);

  async function linkToFloat(candId: string, f: any) {
    if (!allExistingFloats.some(fl => fl.candId === candId)) {
      await db.insert(dbSchema.floats).values({
        id: `float-${Math.random().toString(36).substring(2, 9)}`,
        candId: candId,
        client: f.company || "General",
        role: f.role || "",
        status: f.status || "Pending",
        consultant: currentUser.name || "System Import"
      });
      allExistingFloats.push({ candId } as any);
    }
  }

  // 1. Process Resolved Updates
  for (const update of resolvedUpdates) {
    try {
      if (update.action === 'replace' || update.action === 'update') {
        const payload = update.data;
        const updates: any = {};
        if (payload.linkedin) updates.linkedin = payload.linkedin;
        if (payload.qualification) updates.qual = [payload.qualification];
        if (payload.mobile) updates.mobile = payload.mobile;
        if (payload.location) updates.location = payload.location;
        if (payload.email) updates.email = payload.email;
        if (payload.name) updates.name = payload.name;
        if (payload.company) updates.company = payload.company;
        if (payload.role || payload.designation) updates.designation = payload.designation || payload.role;

        if (Object.keys(updates).length > 0) {
          await db.update(dbSchema.candidates).set(updates).where(eq(dbSchema.candidates.id, update.id));
        }
        await linkToFloat(update.id, payload);
        insertedCount++;
      }
    } catch (err) {
      failedRows.push(update.existing?.name || 'Unknown (Resolved)');
    }
  }

  // 2. Process Truly New Floats (creating candidates first)
  for (const f of newFloats) {
    try {
      const masterCandidateId = `CAND-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      let initials = f.name ? f.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "FL";

      await db.insert(dbSchema.candidates).values({
        id: masterCandidateId,
        name: f.name,
        email: f.email || "",
        mobile: f.mobile || "",
        designation: f.role || f.designation || "", // mapping float role to designation
        company: f.company || "",
        location: f.location || "",
        linkedin: f.linkedin || "",
        initials,
        qual: f.qualification ? [f.qualification] : [],
        exp: f.yearsOfExp || f.exp || 0,
        updatedBy: currentUser.name || "System",
        metadata: f.metadata || { source: "Import" },
      });

      await linkToFloat(masterCandidateId, f);
      insertedCount++;
    } catch (err) {
      console.error("Failed to insert float row:", f, err);
      failedRows.push(f.name || "Unknown");
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
      qualification: z.string().nullable().describe("Header matching Qualification or Education"),
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

export async function checkPipelineDuplicatesAction(mappedCandidates: any[], mandateId: number) {
  const dbSchema = await import("@/db/schema");
  const { or, eq, and } = await import("drizzle-orm");
  const duplicates = [];
  const newCandidates = [];

  const existingMandateCandidates = await db.select().from(dbSchema.mandateCandidates).where(eq(dbSchema.mandateCandidates.mandateId, mandateId));

  for (const c of mappedCandidates) {
    if (!c.name) continue;

    const orConditions = [];
    if (c.email) orConditions.push(eq(dbSchema.candidates.email, c.email));
    if (c.linkedin) orConditions.push(eq(dbSchema.candidates.linkedin, c.linkedin));
    if (c.mobile) orConditions.push(eq(dbSchema.candidates.mobile, c.mobile));
    if (c.name && c.company) orConditions.push(and(eq(dbSchema.candidates.name, c.name), eq(dbSchema.candidates.company, c.company)));
    
    let matchedCandidate = null;
    if (orConditions.length > 0) {
      const existing = await db.select().from(dbSchema.candidates).where(or(...orConditions));
      if (existing.length > 0) {
        matchedCandidate = existing[0];
      }
    }

    if (matchedCandidate) {
      // Check if already assigned
      const isAssigned = existingMandateCandidates.some(mc => mc.candId === matchedCandidate.id);
      
      duplicates.push({
        incomingRecord: c,
        existingRecord: matchedCandidate,
        reason: isAssigned ? `Candidate already exists and is ASSIGNED to this mandate.` : `Candidate already exists in database.`
      });
    } else {
      newCandidates.push(c);
    }
  }

  return { duplicates, newCandidates };
}

export async function finalizePipelineImportAction(newCandidates: any[], resolvedUpdates: any[], mandateId: number, currentUser: { name: string }) {
  let insertedCount = 0;
  let failedRows: string[] = [];
  const dbSchema = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const existingMandateCandidates = await db.select().from(dbSchema.mandateCandidates).where(eq(dbSchema.mandateCandidates.mandateId, mandateId));

  async function linkToMandate(candId: string, candObj?: any) {
    if (!existingMandateCandidates.some(mc => mc.candId === candId)) {
      await db.insert(dbSchema.mandateCandidates).values({
        mandateId,
        candId: candId,
        stage: "longlist",
        addedBy: currentUser.name || "System",
      });
      existingMandateCandidates.push({ mandateId, candId: candId } as any); // local cache
    }
  }

  // 1. Process Resolved Updates (Merge/Overwrite)
  for (const update of resolvedUpdates) {
    try {
      if (update.action === 'replace' || update.action === 'update') {
        const payload = update.data;
        const updates: any = {};
        if (payload.linkedin) updates.linkedin = payload.linkedin;
        if (payload.qualification) updates.qual = [payload.qualification];
        if (payload.mobile) updates.mobile = payload.mobile;
        if (payload.location) updates.location = payload.location;
        if (payload.email) updates.email = payload.email;
        if (payload.name) updates.name = payload.name;
        if (payload.company) updates.company = payload.company;
        if (payload.title || payload.designation) updates.designation = payload.designation || payload.title;

        if (Object.keys(updates).length > 0) {
          await db.update(dbSchema.candidates).set(updates).where(eq(dbSchema.candidates.id, update.id));
        }
        await linkToMandate(update.id, payload);
        insertedCount++;
      }
    } catch (err) {
      failedRows.push(update.existing?.name || 'Unknown Candidate (Resolved)');
    }
  }

  // 2. Process Truly New Candidates
  for (const c of newCandidates) {
    try {
      const masterCandidateId = `CAND-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      let initials = c.name ? c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "CN";

      await db.insert(dbSchema.candidates).values({
        id: masterCandidateId,
        name: c.name,
        email: c.email || "",
        mobile: c.mobile || "",
        designation: c.designation || c.title || "",
        company: c.company || "",
        location: c.location || "",
        linkedin: c.linkedin || "",
        initials,
        qual: c.qualification ? [c.qualification] : [],
        exp: c.yearsOfExp || c.exp || 0,
        updatedBy: currentUser.name || "System",
        metadata: c.metadata || { source: "Import" },
      });

      await linkToMandate(masterCandidateId, c);
      insertedCount++;
    } catch (err) {
      console.error("Failed to insert candidate row:", c, err);
      failedRows.push(c.name || "Unknown");
    }
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/dashboard/mandates/${mandateId}`, "layout");
  return { success: true, insertedCount, failedCount: failedRows.length, failedRows };
}

