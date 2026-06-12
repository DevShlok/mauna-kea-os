"use server";

import { db } from "@/db";
import { mandates, mandateCandidates, frameworks, frameworkCategories, frameworkCriteria, candidates, floats, floatFollowUps, platformUsers, floatReferences, floatActivities, candidateReports } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createMandateAction(data: any) {
  revalidatePath("/dashboard", "layout");
  const result = await db.insert(mandates).values({
    company: data.company,
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
  });
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
        sortOrder: i,
      });
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

export async function addCandidateToMandateAction(data: any) {
  revalidatePath("/dashboard", "layout");
  await db.insert(mandateCandidates).values({
    externalId: data.externalId,
    mandateId: data.mandateId,
    name: data.name,
    company: data.company,
    role: data.role,
    stage: "universe",
    initials: data.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
  });
  revalidatePath(`/dashboard/mandates/${data.mandateId}`);
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

export async function bulkAddSubmissionAction(data: { mandateId: number; candidates: any[]; client: string; role: string; consultant: string }) {
  revalidatePath("/dashboard", "layout");
  for (const c of data.candidates) {
    const candId = c.id;
    const candName = c.name;
    
    // 1. Create submission
    const subId = "S-" + Date.now().toString() + "-" + Math.floor(Math.random() * 1000);
    await db.insert(floats).values({
      id: subId,
      candId,
      candName,
      client: data.client,
      role: data.role,
      consultant: data.consultant || "System",
      dateShared: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      status: "Shared",
    });

    // 2. Add to Mandate Pipeline
    const existing = await db.select().from(mandateCandidates).where(
      sql`${mandateCandidates.externalId} = ${candId} AND ${mandateCandidates.mandateId} = ${data.mandateId}`
    );
    if (existing.length === 0) {
      await db.insert(mandateCandidates).values({
        externalId: candId,
        mandateId: Number(data.mandateId),
        name: candName,
        company: c.company || "",
        role: data.role,
        stage: "universe",
        initials: candName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
        score: c.score || null,
        hasReport: !!c.score, // if they had a float list score, assume they have a report
      });
    }
  }

  revalidatePath(`/dashboard/mandates/${data.mandateId}`);
  revalidatePath("/dashboard/mandates");
  revalidatePath("/dashboard/candidates");
  revalidatePath("/dashboard/float-list/submissions");
  revalidatePath("/dashboard/float-list/database");
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

export async function addPlatformUserAction(data: { name: string; email: string; role: string }) {
  revalidatePath("/dashboard", "layout");
  const id = "U-" + Math.floor(Math.random() * 10000);
  await db.insert(platformUsers).values({
    id,
    name: data.name,
    email: data.email,
    role: data.role,
    status: "Active",
    initials: data.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
  });
  revalidatePath("/dashboard/settings");
  return id;
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

export async function deleteFloatListEntryAction(id: string) {
  revalidatePath("/dashboard", "layout");
  await db.delete(floats).where(eq(floats.candId, id));
  await db.delete(floatFollowUps).where(eq(floatFollowUps.candId, id));
  await db.delete(floatActivities).where(eq(floatActivities.candId, id));
  await db.delete(floatReferences).where(eq(floatReferences.candId, id));
  await db.delete(candidateReports).where(eq(candidateReports.candidateId, id));
  await db.delete(candidates).where(eq(candidates.id, id));
  revalidatePath("/dashboard/float-list/database");
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
    ctc: data.ctc ? Number(data.ctc) : null,
    fixedCtc: data.fixedCtc ? Number(data.fixedCtc) : null,
    variableCtc: data.variableCtc ? Number(data.variableCtc) : null,
    expected: data.expected ? Number(data.expected) : null,
    notice: data.notice ? Number(data.notice) : null,
    status: data.status || "Active",
    qual: data.qual || [],
    expTags: data.expTags || [],
    linkedin: data.linkedin || null,
    targetCompany: data.targetCompany || null,
    currency: data.currency || "INR",
    cvFileName: data.cvFileName || null,
    notes: data.notes || null,
    initials: candidateName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    profilePic: data.profilePic || null,
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
        sortOrder: i,
      });
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

export async function deleteSubmissionAction(id: string) {
  revalidatePath('/dashboard', 'layout');
  await db.delete(floats).where(eq(floats.id, id));
  revalidatePath('/dashboard/float-list');
  revalidatePath('/dashboard/float-list/submissions');
}
