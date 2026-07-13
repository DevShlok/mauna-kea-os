"use server";

import { db } from "@/db";
import { mandates, mandateCandidates, frameworks, frameworkCategories, frameworkCriteria, candidates, floats, floatFollowUps, platformUsers, floatReferences, floatActivities, candidateReports, candidateFiles, clients, clientNotifications, clientRemarks, consultantNotifications } from "@/db/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createMandateAction(data: any) {
  revalidatePath("/dashboard", "layout");
  
  // Try to find the client by exact name match (case-insensitive)
  const existingClient = await db.select().from(clients).where(eq(sql`LOWER(${clients.name})`, (data.company || "").toLowerCase()));
  const clientId = existingClient.length > 0 ? existingClient[0].id : null;
  // Normalize company name if client exists
  const companyName = existingClient.length > 0 ? existingClient[0].name : data.company;

  const result = await db.insert(mandates).values({
    company: companyName,
    role: data.role,
    ctc: data.ctc,
    exp: data.exp,
    workMode: data.workMode,
    clientPOC: data.clientPOC,
    pocEmail: data.pocEmail,
    pocPhone: data.pocPhone,
    consultant: data.consultant || "System",
    opened: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    status: "universe",
    internalStatus: "contractsent",
  }).returning({ insertId: mandates.id });
  revalidatePath("/dashboard/mandates");
  return result[0].insertId;
}

export async function editMandateAction(id: number, data: any) {
  revalidatePath("/dashboard", "layout");
  await db.update(mandates).set({
    company: data.company,
    role: data.role,
    ctc: data.ctc,
    exp: data.exp,
    workMode: data.workMode,
    clientPOC: data.clientPOC,
    pocEmail: data.pocEmail,
    pocPhone: data.pocPhone,
    consultant: data.consultant,
    target: data.target,
    geography: data.geography,
  }).where(eq(mandates.id, id));
  revalidatePath("/dashboard/mandates");
  revalidatePath(`/dashboard/mandates/${id}`);
}

export async function updateMandateFieldAction(id: number, field: string, value: string) {
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

export async function createFrameworkAction(data: any, mandateIds?: string[]) {
  revalidatePath("/dashboard", "layout");
  const id = "FW-" + Date.now();
  await db.insert(frameworks).values({
    id,
    name: data.name,
    industry: data.industry,
    lastModified: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
  });
  
  if (mandateIds && mandateIds.length > 0) {
    for (const mId of mandateIds) {
      await db.update(mandates).set({ frameworkId: id }).where(eq(mandates.id, parseInt(mId)));
    }
  }

  if (data.categories && data.categories.length > 0) {
    for (let i = 0; i < data.categories.length; i++) {
      const cat = data.categories[i];
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


export async function addFloatListEntryAction(data: any) {
  revalidatePath("/dashboard", "layout");
  const id = "CAND-" + Date.now();
  const candidateName = data.name || "Unknown Candidate";
  await db.insert(candidates).values({
    id,
    name: candidateName,
    company: data.company,
    designation: data.designation,
    email: data.email,
    mobile: data.mobile,
    location: data.location,
    exp: data.exp ? Number(data.exp) : null,
    tenure: data.tenure ? Number(data.tenure) : null,
    ctc: data.ctc ? Number(data.ctc) : null,
    fixedCtc: data.fixedCtc ? Number(data.fixedCtc) : null,
    variableCtc: data.variableCtc ? Number(data.variableCtc) : null,
    expected: data.expected ? Number(data.expected) : null,
    notice: data.notice ? Number(data.notice) : null,
    status: data.status || "Active",
    qual: data.qual || [],
    dreamRoles: data.dreamRoles || [],
    dreamCos: data.dreamCos || [],
    expTags: data.expTags || [],
    linkedin: data.linkedin || null,
    targetCompany: data.targetCompany || null,
    currency: data.currency || "INR",
    cvFileName: data.cvFileName || null,
    notes: data.notes || null,
    initials: candidateName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    cvText: data.cvText || null,
    profilePic: data.profilePic || null,
    esops: data.esops ? Number(data.esops) : null,
    esopVesting: data.esopVesting || null,
  });
  revalidatePath("/dashboard/float-list/database");
  return id;
}

export async function addSubmissionAction(data: any) {
  revalidatePath("/dashboard", "layout");
  let candId = data.candId;
  
  if (!candId) {
    candId = "CAND-" + Date.now();
    await db.insert(candidates).values({
      id: candId,
      name: data.candName,
      status: "Active",
      initials: data.candName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    });
  }

  const id = "SUB-" + Date.now();
  await db.insert(floats).values({
    id,
    candId,
    candName: data.candName,
    client: data.client,
    role: data.role,
    consultant: data.consultant || "System",
    dateShared: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    status: "Shared",
  });
  
  // Link to Mandate Pipeline if submitted to an active mandate
  if (data.mandateId) {
    // Check if they are already in the pipeline to prevent duplicates
    const existing = await db.select().from(mandateCandidates).where(
      sql`${mandateCandidates.externalId} = ${candId} AND ${mandateCandidates.mandateId} = ${data.mandateId}`
    );
    if (existing.length === 0) {
      await db.insert(mandateCandidates).values({
        externalId: candId,
        mandateId: Number(data.mandateId),
        name: data.candName,
        company: data.candCompany || "",
        role: data.role,
        stage: "universe",
        initials: data.candName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
      });
      revalidatePath(`/dashboard/mandates/${data.mandateId}`);
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
  revalidatePath("/dashboard", "layout");
  await db.update(floats).set(data).where(eq(floats.id, id));
  revalidatePath("/dashboard/float-list/submissions");
  revalidatePath("/dashboard/float-list/database");
}

export async function addFollowUpAction(data: any) {
  revalidatePath("/dashboard", "layout");
  let candId = data.candId;
  
  if (!candId) {
    candId = "CAND-" + Date.now();
    await db.insert(candidates).values({
      id: candId,
      name: data.candName,
      status: "Active",
      initials: data.candName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    });
  }

  const id = "FU-" + Date.now();
  await db.insert(floatFollowUps).values({
    id,
    candId,
    cand: data.candName,
    client: data.client,
    role: data.role,
    consultant: data.consultant || "System",
    dueDate: data.dueDate,
    status: "Pending",
    note: data.note,
  });
  revalidatePath("/dashboard/float-list/followups");
  revalidatePath("/dashboard/float-list/database");
  return { id, candId };
}

export async function addPlatformUserAction(data: { name: string; email: string; role: string; linkedClientId?: string; linkedCandidateId?: string; reportingManagerId?: string }) {
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
  revalidatePath("/dashboard", "layout");
  await db.delete(platformUsers).where(eq(platformUsers.id, id));
  revalidatePath("/dashboard/admin/users");
}


export async function addReferenceAction(data: any) {
  revalidatePath("/dashboard", "layout");
  await db.insert(floatReferences).values({
    candId: data.candId,
    type: data.type,
    name: data.name,
    org: data.org,
    rel: data.rel,
    text: data.text,
  });
  revalidatePath("/dashboard/float-list/" + data.candId);
}


export async function updateMandateCandidateStageAction(candId: number, stage: string, mandateId: number) {
  revalidatePath("/dashboard", "layout");
  await db.update(mandateCandidates).set({ stage }).where(eq(mandateCandidates.id, candId));
  revalidatePath("/dashboard/candidates");
  revalidatePath(`/dashboard/mandates/${mandateId}`);
}

export async function updateMandateSearchNotesAction(id: number, text: string) {
  revalidatePath("/dashboard", "layout");
  await db.update(mandates).set({ searchNotes: text }).where(eq(mandates.id, id));
  revalidatePath(`/dashboard/mandates/${id}`);
}

export async function editFrameworkAction(id: string, data: any, mandateIds?: string[]) {
  revalidatePath('/dashboard', 'layout');
  await db.update(frameworks).set({
    name: data.name,
    industry: data.industry,
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

  if (data.categories && data.categories.length > 0) {
    for (let i = 0; i < data.categories.length; i++) {
      const cat = data.categories[i];
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
  revalidatePath('/dashboard', 'layout');
  
  // Need to cascade delete
  const oldCats = await db.select().from(frameworkCategories).where(eq(frameworkCategories.frameworkId, id));
  for (const cat of oldCats) {
    await db.delete(frameworkCriteria).where(eq(frameworkCriteria.categoryId, cat.id));
  }
  await db.delete(frameworkCategories).where(eq(frameworkCategories.frameworkId, id));
  await db.delete(candidateReports).where(eq(candidateReports.frameworkId, id));
  await db.update(mandates).set({ frameworkId: null }).where(eq(mandates.frameworkId, id));
  await db.delete(frameworks).where(eq(frameworks.id, id));
  revalidatePath('/dashboard/frameworks');
}

export async function deleteMandateAction(id: number) {
  revalidatePath('/dashboard', 'layout');
  await db.delete(mandateCandidates).where(eq(mandateCandidates.mandateId, id));
  await db.delete(mandates).where(eq(mandates.id, id));
  revalidatePath('/dashboard/mandates');
}



// ─── CLIENTS ACTIONS ────────────────────────────────────────

export async function createClientAction(data: any) {
  revalidatePath("/dashboard/clients");
  await db.insert(clients).values({
    id: data.id || Date.now().toString(),
    name: data.name,
    accountId: data.accountId,
    vertical: data.vertical,
    owner: data.owner,
    status: data.status || "Active",
  });
  return true;
}

export async function updateClientAction(id: string, data: any) {
  revalidatePath("/dashboard/clients");
  await db.update(clients).set(data).where(eq(clients.id, id));
  return true;
}

export async function deleteClientAction(id: string) {
  revalidatePath("/dashboard/clients");
  await db.delete(clients).where(eq(clients.id, id));
  return true;
}

export async function deleteSubmissionAction(id: string) {
  revalidatePath('/dashboard', 'layout');
  await db.delete(floats).where(eq(floats.id, id));
  revalidatePath('/dashboard/float-list');
  revalidatePath('/dashboard/float-list/submissions');
}

export async function deleteFloatListEntryAction(id: string) {
  revalidatePath("/dashboard", "layout");
  await db.delete(mandateCandidates).where(eq(mandateCandidates.externalId, id));
  await db.delete(floats).where(eq(floats.candId, id));
  await db.delete(floatFollowUps).where(eq(floatFollowUps.candId, id));
  await db.delete(floatActivities).where(eq(floatActivities.candId, id));
  await db.delete(floatReferences).where(eq(floatReferences.candId, id));
  await db.delete(candidateReports).where(eq(candidateReports.candidateId, id));
  await db.delete(candidateFiles).where(eq(candidateFiles.candId, id));
  await db.delete(candidates).where(eq(candidates.id, id));
  revalidatePath("/dashboard/float-list/database");
  revalidatePath("/dashboard/mandates");
  revalidatePath("/dashboard/float-list/submissions");
  revalidatePath("/dashboard/candidates");
}

export async function deleteMultipleCandidatesAction(ids: string[]) {
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

export async function editFloatListEntryAction(id: string, data: any) {
  revalidatePath("/dashboard", "layout");
  const candidateName = data.name || "Unknown Candidate";
  await db.update(candidates).set({
    name: candidateName,
    company: data.company,
    designation: data.designation,
    email: data.email,
    mobile: data.mobile,
    location: data.location,
    exp: data.exp ? Number(data.exp) : null,
    tenure: data.tenure ? Number(data.tenure) : null,
    ctc: data.ctc ? Number(data.ctc) : null,
    fixedCtc: data.fixedCtc ? Number(data.fixedCtc) : null,
    variableCtc: data.variableCtc ? Number(data.variableCtc) : null,
    expected: data.expected ? Number(data.expected) : null,
    notice: data.notice ? Number(data.notice) : null,
    status: data.status || "Active",
    qual: data.qual || [],
    dreamRoles: data.dreamRoles || [],
    dreamCos: data.dreamCos || [],
    expTags: data.expTags || [],
    linkedin: data.linkedin || null,
    targetCompany: data.targetCompany || null,
    currency: data.currency || "INR",
    cvFileName: data.cvFileName || null,
    notes: data.notes || null,
    initials: candidateName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    profilePic: data.profilePic || null,
    esops: data.esops ? Number(data.esops) : null,
    esopVesting: data.esopVesting || null,
  }).where(eq(candidates.id, id));
  revalidatePath("/dashboard/float-list/database");
  revalidatePath("/dashboard/float-list/" + id);
  return id;
}

export async function updateCandidateStatusAction(id: string, status: string) {
  revalidatePath("/dashboard", "layout");
  await db.update(candidates).set({ status }).where(eq(candidates.id, id));
  revalidatePath("/dashboard/float-list/database");
}

export async function bulkAssignToMandateAction(data: { mandateId: number; candIds: string[]; role: string }) {
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
  revalidatePath("/dashboard", "layout");
  const existing = await db.select().from(candidateReports).where(eq(candidateReports.id, reportId));
  if (existing.length > 0) {
    const currentData = (existing[0].reportData || {}) as Record<string, any>;
    const updatedData = { ...currentData, [`_${formatName}`]: formatData };
    await db.update(candidateReports).set({ reportData: updatedData }).where(eq(candidateReports.id, reportId));
  }
}

export async function saveReportDraftAction(reportId: string, updatedData: any) {
  revalidatePath("/dashboard", "layout");
  await db.update(candidateReports).set({ reportData: updatedData }).where(eq(candidateReports.id, reportId));
}

export async function toggleActivityPinAction(id: number, isPinned: boolean) {
  await db.update(floatActivities).set({ isPinned }).where(eq(floatActivities.id, id));
  revalidatePath("/dashboard", "layout");
}

export async function sendCandidatesToClientAction(mandateId: number, candidateIds: number[]) {
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

  revalidatePath("/client/candidates", "layout");
}

export async function resolveClientRemarkAction(remarkId: number, status: string, message: string) {
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
