"use server";
import { requireRole } from "@/lib/auth";

import { db } from "@/db";
import { mandates, mandateCandidates, frameworks, frameworkCategories, frameworkCriteria, candidates, floats, floatFollowUps, platformUsers, floatReferences, floatActivities, candidateReports, candidateFiles, clients, clientNotifications, clientRemarks, consultantNotifications, engagementListItems } from "@/db/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  createMandateSchema,
  editMandateSchema,
  frameworkSchema,
  candidateUpsertSchema,
  addSubmissionSchema,
  addFollowUpSchema,
  addReferenceSchema,
  createClientSchema,
  updateClientSchema,
} from "@/lib/validations";

export async function getCurrentUserName(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const dbUser = await db.select().from(platformUsers).where(eq(platformUsers.email, user.email));
      if (dbUser.length > 0) return dbUser[0].name;
      return user.email;
    }
  } catch(e) {}
  return "Unknown";
}

export async function createMandateAction(data: unknown) {
  await requireRole(["admin", "consultant"]);
  const d = createMandateSchema.parse(data);
  revalidatePath("/dashboard", "layout");
  
  // Try to find the client by exact name match (case-insensitive)
  const existingClient = await db.select().from(clients).where(eq(sql`LOWER(${clients.name})`, (d.company || "").toLowerCase()));
  let clientId = existingClient.length > 0 ? existingClient[0].id : null;
  // Normalize company name if client exists
  let companyName = existingClient.length > 0 ? existingClient[0].name : d.company;

  // Auto-initialize client and portal user if not found
  if (!clientId && companyName) {
    clientId = "CLI-" + Date.now().toString();
    await db.insert(clients).values({
      id: clientId,
      name: companyName,
      owner: d.consultant || "System",
      status: "Active",
    });

    // Auto-grant portal access if POC email is provided
    if (d.pocEmail && d.clientPOC) {
      const initials = d.clientPOC.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
      await db.insert(platformUsers).values({
        id: "U-" + Math.floor(Math.random() * 10000).toString(),
        name: d.clientPOC,
        email: d.pocEmail,
        role: "client",
        status: "Active",
        initials,
        linkedClientId: clientId,
        lastActive: new Date(),
      });
    }
  }

  const result = await db.insert(mandates).values({
    company: companyName,
    role: d.role,
    ctc: d.ctc,
    exp: d.exp,
    workMode: d.workMode,
    diversity: d.diversity,
    clientPOC: d.clientPOC,
    pocEmail: d.pocEmail,
    pocPhone: d.pocPhone,
    pocCc: d.pocCc || [],
    sectors: d.sectors || [],
    targetCompanies: d.targetCompanies || [],
    geography: d.geography,
    consultant: d.consultant || "System",
    opened: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    status: "universe",
    internalStatus: "contractsent",
    jdUrl: d.jdUrl,
    interviewNotesUrl: d.interviewNotesUrl,
    additionalDocsUrl: d.additionalDocsUrl,
    jdText: d.jdText,
    interviewNotesText: d.interviewNotesText,
    additionalDocsText: d.additionalDocsText,
    searchNotes: d.searchNotes,
    openQuestions: d.openQuestions,
    frameworkId: d.frameworkId || null,
  }).returning({ insertId: mandates.id });
  revalidatePath("/dashboard/mandates");
  revalidatePath("/[clientSlug]", "layout");
  if (clientId) {
    revalidatePath("/dashboard/clients/" + clientId);
  }
  return result[0].insertId;
}

export async function editMandateAction(id: number, data: unknown) {
  await requireRole(["admin", "consultant"]);
  const d = editMandateSchema.parse(data);
  revalidatePath("/dashboard", "layout");
  
  const existing = await db.select().from(mandates).where(eq(mandates.id, id));
  if (existing.length > 0) {
    const auditLog = existing[0].auditLog || {};
    const updatedBy = await getCurrentUserName();
    const ts = new Date().toISOString();

    if (existing[0].company !== d.company) auditLog["company"] = { updatedBy, updatedAt: ts };
    if (existing[0].role !== d.role) auditLog["role"] = { updatedBy, updatedAt: ts };
    if (existing[0].ctc !== d.ctc) auditLog["ctc"] = { updatedBy, updatedAt: ts };
    if (existing[0].exp !== d.exp) auditLog["exp"] = { updatedBy, updatedAt: ts };
    if (existing[0].workMode !== d.workMode) auditLog["workMode"] = { updatedBy, updatedAt: ts };
    if (existing[0].clientPOC !== d.clientPOC) auditLog["clientPOC"] = { updatedBy, updatedAt: ts };
    if (existing[0].pocEmail !== d.pocEmail) auditLog["pocEmail"] = { updatedBy, updatedAt: ts };
    if (existing[0].pocPhone !== d.pocPhone) auditLog["pocPhone"] = { updatedBy, updatedAt: ts };
    if (existing[0].consultant !== d.consultant) auditLog["consultant"] = { updatedBy, updatedAt: ts };
    if (existing[0].target !== d.target) auditLog["target"] = { updatedBy, updatedAt: ts };
    if (existing[0].geography !== d.geography) auditLog["geography"] = { updatedBy, updatedAt: ts };
    d.auditLog = auditLog;
  }

  await db.update(mandates).set({
    company: d.company,
    role: d.role,
    ctc: d.ctc,
    exp: d.exp,
    workMode: d.workMode,
    clientPOC: d.clientPOC,
    pocEmail: d.pocEmail,
    pocPhone: d.pocPhone,
    consultant: d.consultant,
    target: d.target,
    geography: d.geography,
    auditLog: d.auditLog,
  }).where(eq(mandates.id, id));
  revalidatePath("/dashboard/mandates");
  revalidatePath(`/dashboard/mandates/${id}`);
}

export async function updateMandateFieldAction(id: number, field: string, value: string) {
  await requireRole(["admin", "consultant"]);
  if (field === "status") {
    await db.update(mandates).set({ status: value }).where(eq(mandates.id, id));
    // Also bulk-update all candidates in this mandate
    await db.update(mandateCandidates).set({ stage: value }).where(eq(mandateCandidates.mandateId, id));
    revalidatePath("/dashboard/candidates");
    revalidatePath("/dashboard/float-list");
    revalidatePath(`/dashboard/mandates/${id}`);
  } else if (field === "internalStatus") {
    await db.update(mandates).set({ internalStatus: value }).where(eq(mandates.id, id));
  }
}

export async function createFrameworkAction(data: unknown, mandateIds?: string[]) {
  await requireRole(["admin", "consultant"]);
  const d = frameworkSchema.parse(data);
  revalidatePath("/dashboard", "layout");
  const id = "FW-" + Date.now();
  await db.insert(frameworks).values({
    id,
    name: d.name,
    industry: d.industry,
    lastModified: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
  });
  
  if (mandateIds && mandateIds.length > 0) {
    for (const mId of mandateIds) {
      await db.update(mandates).set({ frameworkId: id }).where(eq(mandates.id, parseInt(mId)));
    }
  }

  if (d.categories && d.categories.length > 0) {
    for (let i = 0; i < d.categories.length; i++) {
      const cat = d.categories[i];
      const res = await db.insert(frameworkCategories).values({
        frameworkId: id,
        name: cat.name,
        weight: cat.weight || 100,
        sortOrder: i,
      }).returning({ insertId: frameworkCategories.id });
      const catId = res[0].insertId;
      
      if (cat.criteria && cat.criteria.length > 0) {
        for (let j = 0; j < cat.criteria.length; j++) {
          await db.insert(frameworkCriteria).values({
            categoryId: catId,
            name: cat.criteria[j].name,
            weight: cat.criteria[j].weight || 10,
            sortOrder: j,
          });
        }
      }
    }
  }
  revalidatePath("/dashboard/frameworks");
  return id;
}


export async function addFloatListEntryAction(data: unknown) {
  await requireRole(["admin", "consultant"]);
  const d = candidateUpsertSchema.parse(data);
  revalidatePath("/dashboard", "layout");
  const id = "CAND-" + Date.now();
  const candidateName = d.name || "Unknown Candidate";
  await db.insert(candidates).values({
    id,
    name: candidateName,
    company: d.company,
    designation: d.designation,
    email: d.email,
    mobile: d.mobile,
    location: d.location,
    exp: d.exp ? Number(d.exp) : null,
    tenure: d.tenure ? Number(d.tenure) : null,
    ctc: d.ctc ? Number(d.ctc) : null,
    fixedCtc: d.fixedCtc ? Number(d.fixedCtc) : null,
    variableCtc: d.variableCtc ? Number(d.variableCtc) : null,
    expected: d.expected ? Number(d.expected) : null,
    notice: d.notice ? Number(d.notice) : null,
    status: d.status || "Active",
    qual: d.qual || [],
    dreamRoles: d.dreamRoles || [],
    dreamCos: d.dreamCos || [],
    expTags: d.expTags || [],
    linkedin: d.linkedin || null,
    targetCompany: d.targetCompany || null,
    currency: d.currency || "INR",
    cvFileName: d.cvFileName || null,
    notes: d.notes || null,
    initials: candidateName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    cvText: d.cvText || null,
    profilePic: d.profilePic || null,
    esops: d.esops ? Number(d.esops) : null,
    esopVesting: d.esopVesting || null,
    dob: d.dob || null,
    hometown: d.hometown || null,
    stability: d.stability || null,
    relocationStatus: d.relocationStatus || null,
    relocationPrefs: d.relocationPrefs || null,
  });
  revalidatePath("/dashboard/float-list/database");
  return id;
}

export async function addSubmissionAction(data: unknown) {
  await requireRole(["admin", "consultant"]);
  const d = addSubmissionSchema.parse(data);
  revalidatePath("/dashboard", "layout");
  let candId = d.candId;
  
  if (!candId) {
    candId = "CAND-" + Date.now();
    await db.insert(candidates).values({
      id: candId,
      name: d.candName,
      status: "Active",
      initials: d.candName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    });
  }

  const id = "SUB-" + Date.now();
  await db.insert(floats).values({
    id,
    candId,
    candName: d.candName,
    client: d.client,
    role: d.role,
    consultant: d.consultant || "System",
    dateShared: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    status: "Shared",
  });
  
  // Link to Mandate Pipeline if submitted to an active mandate
  if (d.mandateId) {
    // Check if they are already in the pipeline to prevent duplicates
    const existing = await db.select().from(mandateCandidates).where(
      sql`${mandateCandidates.externalId} = ${candId} AND ${mandateCandidates.mandateId} = ${d.mandateId}`
    );
    if (existing.length === 0) {
      await db.insert(mandateCandidates).values({
        externalId: candId,
        mandateId: Number(d.mandateId),
        name: d.candName,
        company: d.candCompany || "",
        addedBy: await getCurrentUserName(),
        role: d.role,
        stage: "universe",
        initials: d.candName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
        isSentToClient: true,
      });
      revalidatePath(`/dashboard/mandates/${d.mandateId}`);
      revalidatePath(`/dashboard/mandates`);
      revalidatePath(`/dashboard/candidates`);
    }
  }

  revalidatePath("/dashboard/float-list/submissions");
  revalidatePath("/dashboard/float-list/database");
  revalidatePath("/dashboard/float-list/" + candId);
  return { id, candId };
}


export async function removeCandidateFromMandateAction(data: { id: number; externalId: string; company: string; role: string; mandateId: number }) {
  await requireRole(["admin", "consultant"]);
  revalidatePath("/dashboard", "layout");
  // Delete from mandateCandidates
  await db.delete(mandateCandidates).where(eq(mandateCandidates.id, data.id));

  // Delete from floats where candidate, company and role match
  await db.delete(floats).where(
    sql`${floats.candId} = ${data.externalId} AND ${floats.client} = ${data.company} AND ${floats.role} = ${data.role}`
  );

  revalidatePath(`/dashboard/mandates/${data.mandateId}`);
  revalidatePath("/dashboard/mandates");
  revalidatePath("/dashboard/candidates");
  revalidatePath("/dashboard/float-list/submissions");
}

export async function updateSubmissionAction(id: string, data: { via?: string[]; followUp?: string; response?: string; status?: string; candName?: string; client?: string; role?: string; consultant?: string; }) {
  await requireRole(["admin", "consultant"]);
  revalidatePath("/dashboard", "layout");
  await db.update(floats).set(data).where(eq(floats.id, id));
  revalidatePath("/dashboard/float-list/submissions");
  revalidatePath("/dashboard/float-list/database");
}

export async function addFollowUpAction(data: unknown) {
  await requireRole(["admin", "consultant"]);
  const d = addFollowUpSchema.parse(data);
  revalidatePath("/dashboard", "layout");
  let candId = d.candId;
  
  if (!candId) {
    candId = "CAND-" + Date.now();
    await db.insert(candidates).values({
      id: candId,
      name: d.candName,
      status: "Active",
      initials: d.candName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    });
  }

  const id = "FU-" + Date.now();
  await db.insert(floatFollowUps).values({
    id,
    candId,
    cand: d.candName,
    client: d.client,
    role: d.role,
    consultant: d.consultant || "System",
    dueDate: d.dueDate,
    status: "Pending",
    note: d.note,
  });
  revalidatePath("/dashboard/float-list/followups");
  revalidatePath("/dashboard/float-list/database");
  return { id, candId };
}

export async function addPlatformUserAction(data: { name: string; email: string; role: string; linkedClientId?: string; linkedCandidateId?: string; reportingManagerId?: string }) {
  await requireRole(["admin", "consultant"]);
  revalidatePath("/dashboard", "layout");
  const id = "U-" + Math.floor(Math.random() * 10000);
  await db.insert(platformUsers).values({
    id,
    name: data.name,
    email: data.email,
    role: data.role,
    status: "Active",
    initials: data.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    linkedClientId: data.linkedClientId || null,
    linkedCandidateId: data.linkedCandidateId || null,
    reportingManagerId: data.reportingManagerId || null,
    lastActive: new Date(),
  });
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/users");
  return id;
}

export async function updatePlatformUserAction(id: string, data: { name: string; email: string; role: string; linkedClientId?: string; linkedCandidateId?: string; reportingManagerId?: string }) {
  await requireRole(["admin", "consultant"]);
  revalidatePath("/dashboard", "layout");
  await db.update(platformUsers).set({
    name: data.name,
    email: data.email,
    role: data.role,
    initials: data.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    linkedClientId: data.linkedClientId || null,
    linkedCandidateId: data.linkedCandidateId || null,
    reportingManagerId: data.reportingManagerId || null,
  }).where(eq(platformUsers.id, id));
  revalidatePath("/dashboard/admin/users");
}

export async function deletePlatformUserAction(id: string) {
  await requireRole(["admin", "consultant"]);
  revalidatePath("/dashboard", "layout");
  const deletedBy = await getCurrentUserName();
  await db.update(platformUsers).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(platformUsers.id, id));
  revalidatePath("/dashboard/admin/users");
}


export async function addReferenceAction(data: unknown) {
  await requireRole(["admin", "consultant"]);
  const d = addReferenceSchema.parse(data);
  revalidatePath("/dashboard", "layout");
  await db.insert(floatReferences).values({
    candId: d.candId,
    type: d.type,
    name: d.name,
    org: d.org,
    rel: d.rel,
    text: d.text,
  });
  revalidatePath("/dashboard/float-list/" + d.candId);
}


export async function updateMandateCandidateStageAction(candId: number, stage: string, mandateId: number) {
  await requireRole(["admin", "consultant"]);
  revalidatePath("/dashboard", "layout");
  await db.update(mandateCandidates).set({ stage }).where(eq(mandateCandidates.id, candId));
  revalidatePath("/dashboard/candidates");
  revalidatePath(`/dashboard/mandates/${mandateId}`);
}

export async function updateMandateSearchNotesAction(id: number, text: string) {
  await requireRole(["admin", "consultant"]);
  revalidatePath("/dashboard", "layout");
  
  const existing = await db.select().from(mandates).where(eq(mandates.id, id));
  if (existing.length > 0) {
    const auditLog = existing[0].auditLog || {};
    auditLog["Search Notes"] = { updatedBy: await getCurrentUserName(), updatedAt: new Date().toISOString() };
    await db.update(mandates).set({ searchNotes: text, auditLog }).where(eq(mandates.id, id));
  } else {
    await db.update(mandates).set({ searchNotes: text }).where(eq(mandates.id, id));
  }
  
  revalidatePath(`/dashboard/mandates/${id}`);
}

export async function editFrameworkAction(id: string, data: unknown, mandateIds?: string[]) {
  await requireRole(["admin", "consultant"]);
  const d = frameworkSchema.parse(data);
  revalidatePath('/dashboard', 'layout');
  await db.update(frameworks).set({
    name: d.name,
    industry: d.industry,
    lastModified: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
  }).where(eq(frameworks.id, id));

  await db.update(mandates).set({ frameworkId: null }).where(eq(mandates.frameworkId, id));
  if (mandateIds && mandateIds.length > 0) {
    for (const mId of mandateIds) {
      await db.update(mandates).set({ frameworkId: id }).where(eq(mandates.id, parseInt(mId)));
    }
  }

  const oldCats = await db.select().from(frameworkCategories).where(eq(frameworkCategories.frameworkId, id));
  for (const cat of oldCats) {
    await db.delete(frameworkCriteria).where(eq(frameworkCriteria.categoryId, cat.id));
  }
  await db.delete(frameworkCategories).where(eq(frameworkCategories.frameworkId, id));

  if (d.categories && d.categories.length > 0) {
    for (let i = 0; i < d.categories.length; i++) {
      const cat = d.categories[i];
      const res = await db.insert(frameworkCategories).values({
        frameworkId: id,
        name: cat.name,
        weight: cat.weight || 100,
        sortOrder: i,
      }).returning({ insertId: frameworkCategories.id });
      const catId = res[0].insertId;
      
      if (cat.criteria && cat.criteria.length > 0) {
        for (let j = 0; j < cat.criteria.length; j++) {
          await db.insert(frameworkCriteria).values({
            categoryId: catId,
            name: cat.criteria[j].name,
            weight: cat.criteria[j].weight || 10,
            sortOrder: j,
          });
        }
      }
    }
  }
  revalidatePath('/dashboard/frameworks');
  return id;
}

export async function deleteFrameworkAction(id: string) {
  await requireRole(["admin", "consultant"]);
  revalidatePath('/dashboard', 'layout');
  const deletedBy = await getCurrentUserName();
  await db.update(frameworks).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(frameworks.id, id));
  revalidatePath('/dashboard/frameworks');
}

export async function deleteMandateAction(id: number) {
  await requireRole(["admin", "consultant"]);
  const deletedBy = await getCurrentUserName();
  await db.update(mandates).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(mandates.id, id));
  revalidatePath("/dashboard/mandates");
}

export async function deleteMultipleMandatesAction(ids: number[]) {
  await requireRole(["admin", "consultant"]);
  if (!ids || ids.length === 0) return;
  const deletedBy = await getCurrentUserName();
  await db.update(mandates).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(inArray(mandates.id, ids));
  revalidatePath("/dashboard/mandates");
}



// ─── CLIENTS ACTIONS ────────────────────────────────────────

export async function createClientAction(data: unknown) {
  await requireRole(["admin", "consultant"]);
  const d = createClientSchema.parse(data);
  revalidatePath("/dashboard/clients");
  
  let baseSlug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  let slug = baseSlug || `client-${Date.now()}`;
  let counter = 1;
  while(true) {
    const existing = await db.query.clients.findFirst({ where: (c, { eq }) => eq(c.slug, slug) });
    if (!existing) break;
    slug = `${baseSlug}-${counter++}`;
  }

  await db.insert(clients).values({
    id: d.id || Date.now().toString(),
    slug,
    name: d.name,
    accountId: d.accountId,
    vertical: d.vertical,
    owner: d.owner,
    status: d.status || "Active",
    legalEntityName: d.legalEntityName || null,
    contacts: d.contacts || [],
  });
  return true;
}

export async function updateClientAction(id: string, data: unknown) {
  await requireRole(["admin", "consultant"]);
  const d = updateClientSchema.parse(data);
  revalidatePath("/dashboard/clients");
  await db.update(clients).set({
    name: d.name,
    accountId: d.accountId,
    vertical: d.vertical,
    owner: d.owner,
    status: d.status || "Active",
    legalEntityName: d.legalEntityName || null,
    contacts: d.contacts || [],
  }).where(eq(clients.id, id));
  return true;
}

export async function deleteClientAction(id: string) {
  await requireRole(["admin", "consultant"]);
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  const deletedBy = await getCurrentUserName();
  if (client) {
    await db.update(mandates).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(mandates.company, client.name));
  }
  await db.update(clients).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(clients.id, id));
  return true;
}

export async function deleteSubmissionAction(id: string) {
  await requireRole(["admin", "consultant"]);
  revalidatePath('/dashboard', 'layout');
  const deletedBy = await getCurrentUserName();
  await db.update(floats).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(floats.id, id));
  revalidatePath('/dashboard/float-list');
  revalidatePath('/dashboard/float-list/submissions');
}

export async function deleteFloatListEntryAction(id: string) {
  await requireRole(["admin", "consultant"]);
  revalidatePath("/dashboard", "layout");
  const deletedBy = await getCurrentUserName();
  await db.update(candidates).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(candidates.id, id));
  revalidatePath("/dashboard/float-list/database");
  revalidatePath("/dashboard/mandates");
  revalidatePath("/dashboard/float-list/submissions");
  revalidatePath("/dashboard/candidates");
}

export async function deleteMultipleCandidatesAction(ids: string[]) {
  await requireRole(["admin", "consultant"]);
  if (!ids || ids.length === 0) return;
  revalidatePath("/dashboard", "layout");
  await db.delete(mandateCandidates).where(inArray(mandateCandidates.externalId, ids));
  await db.delete(floats).where(inArray(floats.candId, ids));
  await db.delete(floatFollowUps).where(inArray(floatFollowUps.candId, ids));
  await db.delete(floatActivities).where(inArray(floatActivities.candId, ids));
  await db.delete(floatReferences).where(inArray(floatReferences.candId, ids));
  await db.delete(candidateReports).where(inArray(candidateReports.candidateId, ids));
  await db.delete(candidateFiles).where(inArray(candidateFiles.candId, ids));
  await db.delete(candidates).where(inArray(candidates.id, ids));
  revalidatePath("/dashboard/float-list/database");
  revalidatePath("/dashboard/mandates");
  revalidatePath("/dashboard/float-list/submissions");
  revalidatePath("/dashboard/candidates");
}

export async function editFloatListEntryAction(id: string, data: unknown) {
  await requireRole(["admin", "consultant"]);
  const d = candidateUpsertSchema.parse(data);
  revalidatePath("/dashboard", "layout");
  const candidateName = d.name || "Unknown Candidate";

  const existing = await db.select().from(candidates).where(eq(candidates.id, id));
  if (existing.length > 0) {
    const auditLog = existing[0].auditLog || {};
    const updatedBy = await getCurrentUserName();
    const ts = new Date().toISOString();

    if (existing[0].company !== d.company) auditLog["company"] = { updatedBy, updatedAt: ts };
    if (existing[0].designation !== d.designation) auditLog["designation"] = { updatedBy, updatedAt: ts };
    if (existing[0].exp !== (d.exp ? Number(d.exp) : null)) auditLog["exp"] = { updatedBy, updatedAt: ts };
    if (existing[0].ctc !== (d.ctc ? Number(d.ctc) : null)) auditLog["ctc"] = { updatedBy, updatedAt: ts };
    if (existing[0].fixedCtc !== (d.fixedCtc ? Number(d.fixedCtc) : null)) auditLog["fixedCtc"] = { updatedBy, updatedAt: ts };
    if (existing[0].variableCtc !== (d.variableCtc ? Number(d.variableCtc) : null)) auditLog["variableCtc"] = { updatedBy, updatedAt: ts };
    if (existing[0].expected !== (d.expected ? Number(d.expected) : null)) auditLog["expected"] = { updatedBy, updatedAt: ts };
    if (existing[0].esops !== (d.esops ? Number(d.esops) : null)) auditLog["esops"] = { updatedBy, updatedAt: ts };
    if (existing[0].notice !== (d.notice ? Number(d.notice) : null)) auditLog["notice"] = { updatedBy, updatedAt: ts };
    if (JSON.stringify(existing[0].stability) !== JSON.stringify(d.stability || null)) auditLog["stability"] = { updatedBy, updatedAt: ts };
    if (existing[0].status !== (d.status || "Active")) auditLog["status"] = { updatedBy, updatedAt: ts };
    if (existing[0].cvFileName !== (d.cvFileName || null)) auditLog["cvFileName"] = { updatedBy, updatedAt: ts };
    if (existing[0].notes !== (d.notes || null)) auditLog["notes"] = { updatedBy, updatedAt: ts };

    delete auditLog["Professional Details"];
    delete auditLog["Compensation"];

    d.auditLog = auditLog;
  }

  await db.update(candidates).set({
    name: candidateName,
    auditLog: d.auditLog,
    company: d.company,
    designation: d.designation,
    email: d.email,
    mobile: d.mobile,
    location: d.location,
    exp: d.exp ? Number(d.exp) : null,
    tenure: d.tenure ? Number(d.tenure) : null,
    ctc: d.ctc ? Number(d.ctc) : null,
    fixedCtc: d.fixedCtc ? Number(d.fixedCtc) : null,
    variableCtc: d.variableCtc ? Number(d.variableCtc) : null,
    expected: d.expected ? Number(d.expected) : null,
    notice: d.notice ? Number(d.notice) : null,
    status: d.status || "Active",
    qual: d.qual || [],
    dreamRoles: d.dreamRoles || [],
    dreamCos: d.dreamCos || [],
    expTags: d.expTags || [],
    linkedin: d.linkedin || null,
    targetCompany: d.targetCompany || null,
    currency: d.currency || "INR",
    cvFileName: d.cvFileName || null,
    notes: d.notes || null,
    initials: candidateName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    profilePic: d.profilePic || null,
    esops: d.esops ? Number(d.esops) : null,
    esopVesting: d.esopVesting || null,
    dob: d.dob || null,
    hometown: d.hometown || null,
    stability: d.stability || null,
    relocationStatus: d.relocationStatus || null,
    relocationPrefs: d.relocationPrefs || null,
  }).where(eq(candidates.id, id));
  revalidatePath("/dashboard/float-list/database");
  revalidatePath("/dashboard/float-list/" + id);
  return id;
}

export async function updateCandidateStatusAction(id: string, status: string) {
  await requireRole(["admin", "consultant"]);
  revalidatePath("/dashboard", "layout");
  await db.update(candidates).set({ status }).where(eq(candidates.id, id));
  revalidatePath("/dashboard/float-list/database");
}

export async function bulkAssignToMandateAction(data: { mandateId: number; candIds: string[]; role: string }) {
  await requireRole(["admin", "consultant"]);
  revalidatePath("/dashboard", "layout");
  const cands = await db.select().from(candidates).where(inArray(candidates.id, data.candIds));
  
  for (const c of cands) {
    const existing = await db.select().from(mandateCandidates).where(
      sql`${mandateCandidates.externalId} = ${c.id} AND ${mandateCandidates.mandateId} = ${data.mandateId}`
    );
    if (existing.length === 0) {
      await db.insert(mandateCandidates).values({
        externalId: c.id,
        mandateId: Number(data.mandateId),
        name: c.name,
        company: c.company || "",
        role: data.role,
        stage: "universe",
        initials: c.initials || c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
        score: c.score || null,
        hasReport: !!c.score,
        isSentToClient: true, // Make visible by default
      });

      const mandateRows = await db.select().from(mandates).where(eq(mandates.id, data.mandateId));
      const mandate = mandateRows[0];
      if (mandate) {
        const subId = "SUB-" + Date.now() + Math.floor(Math.random() * 1000);
        await db.insert(floats).values({
          id: subId,
          candId: c.id,
          candName: c.name,
          client: mandate.company,
          role: mandate.role,
          consultant: mandate.consultant || "System",
          dateShared: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
          status: "Shared",
        });
      }
    }
  }

  revalidatePath(`/dashboard/mandates/${data.mandateId}`);
  revalidatePath("/dashboard/mandates");
  revalidatePath("/dashboard/candidates");
  revalidatePath("/dashboard/float-list/submissions");
}

export async function bulkAddSubmissionAction(data: { candIds: string[]; client: string; role: string; consultant: string; status?: string }) {
  await requireRole(["admin", "consultant"]);
  revalidatePath("/dashboard", "layout");
  const cands = await db.select().from(candidates).where(inArray(candidates.id, data.candIds));

  for (const c of cands) {
    const subId = "S-" + Date.now().toString() + "-" + Math.floor(Math.random() * 1000);
    await db.insert(floats).values({
      id: subId,
      candId: c.id,
      candName: c.name,
      client: data.client,
      role: data.role,
      consultant: data.consultant || "System",
      dateShared: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      status: data.status || "Shared",
    });
  }

  revalidatePath("/dashboard/float-list");
  revalidatePath("/dashboard/float-list/submissions");
  revalidatePath("/dashboard/candidates");
}

export async function logCandidateActivityAction(data: {
  candId: string;
  type: string;
  note: string;
  consultant?: string;
  date?: string;
  time?: string;
}) {
  await requireRole(["admin", "consultant"]);
  revalidatePath("/dashboard", "layout");
  
  const now = new Date();
  const dateStr = data.date || now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = data.time || now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  await db.insert(floatActivities).values({
    candId: data.candId,
    type: data.type,
    note: data.note,
    consultant: data.consultant || "System",
    date: dateStr,
    time: timeStr,
  });

  revalidatePath(`/dashboard/candidates/${data.candId}`);
}

export async function saveReportFormatAction(reportId: string, formatName: string, formatData: any) {
  await requireRole(["admin", "consultant"]);
  revalidatePath("/dashboard", "layout");
  const existing = await db.select().from(candidateReports).where(eq(candidateReports.id, reportId));
  if (existing.length > 0) {
    const currentData = (existing[0].reportData || {}) as Record<string, any>;
    const updatedData = { ...currentData, [`_${formatName}`]: formatData };
    await db.update(candidateReports).set({ reportData: updatedData }).where(eq(candidateReports.id, reportId));
  }
}

export async function saveReportDraftAction(reportId: string, updatedData: any) {
  await requireRole(["admin", "consultant"]);
  revalidatePath("/dashboard", "layout");
  await db.update(candidateReports).set({ reportData: updatedData }).where(eq(candidateReports.id, reportId));
}

export async function toggleActivityPinAction(id: number, isPinned: boolean) {
  await requireRole(["admin", "consultant"]);
  await db.update(floatActivities).set({ isPinned }).where(eq(floatActivities.id, id));
  revalidatePath("/dashboard", "layout");
}

export async function sendCandidatesToClientAction(mandateId: number, candidateIds: number[]) {
  await requireRole(["admin", "consultant"]);
  if (candidateIds.length === 0) return;
  await db.update(mandateCandidates).set({ isSentToClient: true }).where(inArray(mandateCandidates.id, candidateIds));

  // Find mandate and client to notify
  const [mandate] = await db.select().from(mandates).where(eq(mandates.id, mandateId));
  if (mandate) {
    const existingClient = await db.select().from(clients).where(eq(sql`LOWER(${clients.name})`, mandate.company.toLowerCase()));
    if (existingClient.length > 0) {
      const clientId = existingClient[0].id;
      const message = `You have received ${candidateIds.length} new profile(s) for the ${mandate.role} position.`;
      await db.insert(clientNotifications).values({
        clientId,
        mandateId,
        message
      });
    }
  }

  revalidatePath("/dashboard", "layout");
}

export async function getClientNotificationsAction() {
  const { platformUser } = await import("@/lib/auth").then(m => m.requireRole(["client"]));
  if (!platformUser?.linkedClientId) return [];
  
  const notifs = await db.execute(sql`
    SELECT id, client_id as clientId, mandate_id as mandateId, message, link, is_read as isRead, created_at as createdAt 
    FROM client_notifications 
    WHERE client_id = ${platformUser.linkedClientId} 
    ORDER BY created_at DESC 
    LIMIT 10
  `);
  
  return JSON.parse(JSON.stringify(notifs));
}

export async function markClientNotificationsAsReadAction() {
  const { platformUser } = await import("@/lib/auth").then(m => m.requireRole(["client"]));
  if (!platformUser?.linkedClientId) return;
  await db.update(clientNotifications).set({ isRead: true }).where(eq(clientNotifications.clientId, platformUser.linkedClientId));
  revalidatePath("/client", "layout");
}


export async function submitClientRemarkAction(mandateId: number, candId: string, remarkText: string) {
  const { platformUser } = await import("@/lib/auth").then(m => m.requireRole(["client"]));
  if (!platformUser?.linkedClientId) return;

  await db.insert(clientRemarks).values({
    clientId: platformUser.linkedClientId,
    mandateId,
    candId,
    remarkText,
    status: 'Pending'
  });

  const [mandate] = await db.select().from(mandates).where(eq(mandates.id, mandateId));
  const [client] = await db.select().from(clients).where(eq(clients.id, platformUser.linkedClientId));
  
  if (mandate && client) {
    const message = `New remark from ${client.name} for ${mandate.role}`;
    await db.insert(consultantNotifications).values({
      message,
      link: `/dashboard/candidates/${candId}?mandateId=${mandateId}`
    });
  }

  revalidatePath("/[clientSlug]/candidates", "layout");
  return { success: true };
}

export async function resolveClientRemarkAction(remarkId: number, status: string, message: string) {
  await requireRole(["admin", "consultant"]);
  const [remark] = await db.select().from(clientRemarks).where(eq(clientRemarks.id, remarkId));
  if (!remark) return;

  await db.update(clientRemarks).set({ status }).where(eq(clientRemarks.id, remarkId));

  await db.insert(clientNotifications).values({
    clientId: remark.clientId,
    mandateId: remark.mandateId,
    message: message,
    link: `/client/candidates/${remark.candId}?mandateId=${remark.mandateId}`
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/client", "layout");
}

export async function getConsultantNotificationsAction() {
  await requireRole(["admin", "consultant"]);
  const { createClient } = await import("@/utils/supabase/server");
  const { getUserByEmail } = await import("@/db/queries");
  const { or, and, isNull, eq } = await import("drizzle-orm");
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email;
  if (!email) return [];
  const platformUser = await getUserByEmail(email);
  if (!platformUser) return [];

  return await db.select()
    .from(consultantNotifications)
    .where(
      or(
        eq(consultantNotifications.userId, platformUser.id),
        eq(consultantNotifications.targetRole, platformUser.role || ''),
        and(isNull(consultantNotifications.userId), isNull(consultantNotifications.targetRole))
      )
    )
    .orderBy(sql`${consultantNotifications.createdAt} DESC`)
    .limit(10);
}

export async function markConsultantNotificationsAsReadAction() {
  await requireRole(["admin", "consultant"]);
  const { createClient } = await import("@/utils/supabase/server");
  const { getUserByEmail } = await import("@/db/queries");
  const { or, and, isNull, eq } = await import("drizzle-orm");
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email;
  if (!email) return;
  const platformUser = await getUserByEmail(email);
  if (!platformUser) return;

  await db.update(consultantNotifications)
    .set({ isRead: true })
    .where(
      or(
        eq(consultantNotifications.userId, platformUser.id),
        eq(consultantNotifications.targetRole, platformUser.role || ''),
        and(isNull(consultantNotifications.userId), isNull(consultantNotifications.targetRole))
      )
    );
  revalidatePath("/dashboard", "layout");
}
export async function deleteMultipleClientsAction(ids: string[]) {
  await requireRole(["admin", "consultant"]);
  if (!ids || ids.length === 0) return;
  const deletedBy = await getCurrentUserName();
  const clientsData = await db.select().from(clients).where(inArray(clients.id, ids));
  const clientNames = clientsData.map(c => c.name);
  if (clientNames.length > 0) {
    await db.update(mandates).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(inArray(mandates.company, clientNames));
  }
  await db.update(clients).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(inArray(clients.id, ids));
  revalidatePath("/dashboard/clients");
}
export async function deleteMultiplePlatformUsersAction(ids: string[]) {
  await requireRole(["admin", "consultant"]);
  if (!ids || ids.length === 0) return;
  const deletedBy = await getCurrentUserName();
  await db.update(platformUsers).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(inArray(platformUsers.id, ids));
  revalidatePath("/dashboard/admin/users");
}


export async function deleteMultipleFrameworksAction(ids: string[]) {
  await requireRole(["admin", "consultant"]);
  if (!ids || ids.length === 0) return;
  const deletedBy = await getCurrentUserName();
  await db.update(frameworks).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(inArray(frameworks.id, ids));
  revalidatePath('/dashboard/frameworks');
}

export async function restoreEntityAction(entityType: string, ids: (string|number)[]) {
  revalidatePath('/dashboard', 'layout');
  if (ids.length === 0) return;
  
  if (entityType === 'clients') {
    const clientsData = await db.select().from(clients).where(inArray(clients.id, ids as string[]));
    const clientNames = clientsData.map(c => c.name);
    if (clientNames.length > 0) {
      await db.update(mandates).set({ isDeleted: false, deletedAt: null }).where(inArray(mandates.company, clientNames));
    }
    await db.update(clients).set({ isDeleted: false, deletedAt: null }).where(inArray(clients.id, ids as string[]));
  } else if (entityType === 'mandates') {
    await db.update(mandates).set({ isDeleted: false, deletedAt: null }).where(inArray(mandates.id, ids as number[]));
  } else if (entityType === 'candidates') {
    await db.update(candidates).set({ isDeleted: false, deletedAt: null }).where(inArray(candidates.id, ids as string[]));
  } else if (entityType === 'floats') {
    await db.update(floats).set({ isDeleted: false, deletedAt: null }).where(inArray(floats.id, ids as string[]));
  } else if (entityType === 'users') {
    await db.update(platformUsers).set({ isDeleted: false, deletedAt: null }).where(inArray(platformUsers.id, ids as string[]));
  } else if (entityType === 'frameworks') {
    await db.update(frameworks).set({ isDeleted: false, deletedAt: null }).where(inArray(frameworks.id, ids as string[]));
  }
}

export async function hardDeleteEntityAction(entityType: string, ids: (string|number)[]) {
  revalidatePath('/dashboard', 'layout');
  if (ids.length === 0) return;
  
  if (entityType === 'clients') {
    await db.delete(clients).where(inArray(clients.id, ids as string[]));
  } else if (entityType === 'mandates') {
    await db.delete(mandates).where(inArray(mandates.id, ids as number[]));
  } else if (entityType === 'candidates') {
    await db.delete(candidates).where(inArray(candidates.id, ids as string[]));
  } else if (entityType === 'floats') {
    await db.delete(floats).where(inArray(floats.id, ids as string[]));
  } else if (entityType === 'users') {
    await db.delete(platformUsers).where(inArray(platformUsers.id, ids as string[]));
  } else if (entityType === 'frameworks') {
    await db.delete(frameworks).where(inArray(frameworks.id, ids as string[]));
  }
}

export async function bulkAddToEngagementListAction(candIds: string[], listType: "Calling" | "BD") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Unauthorized");
  
  const dbUser = await db.select().from(platformUsers).where(eq(platformUsers.email, user.email));
  if (dbUser.length === 0) throw new Error("User not found");
  const userId = dbUser[0].id;

  let addedCount = 0;
  let duplicateCount = 0;

  for (const candId of candIds) {
    // Check if already in list
    const existing = await db.select().from(engagementListItems).where(
      sql`${engagementListItems.userId} = ${userId} AND ${engagementListItems.candId} = ${candId} AND ${engagementListItems.listType} = ${listType}`
    );
    if (existing.length === 0) {
      await db.insert(engagementListItems).values({
        userId,
        candId,
        listType,
      });
      addedCount++;
    } else {
      // If already in list, move them back to Today's view by resetting nextFollowUp and status
      await db.update(engagementListItems)
        .set({ nextFollowUp: null, status: 'Pending' })
        .where(eq(engagementListItems.id, existing[0].id));
      duplicateCount++;
    }
  }
  revalidatePath('/dashboard/calls');
  return { success: true, addedCount, duplicateCount };
}
