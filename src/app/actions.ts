"use server";

import { db } from "@/db";
import { mandates, mandateCandidates, frameworks, frameworkCategories, frameworkCriteria, flCandidates, flSubmissions, flFollowUps, platformUsers, flReferences, flActivities, candidateReports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createMandateAction(data: any) {
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

export async function createFrameworkAction(data: any) {
  const id = "FW-" + Date.now();
  await db.insert(frameworks).values({
    id,
    name: data.name,
    industry: data.industry,
    lastModified: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
  });
  
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
  const id = "CAND-" + Date.now();
  await db.insert(flCandidates).values({
    id,
    name: data.name,
    company: data.company,
    designation: data.designation,
    email: data.email,
    mobile: data.mobile,
    location: data.location,
    exp: data.exp ? Number(data.exp) : null,
    ctc: data.ctc ? Number(data.ctc) : null,
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
    initials: data.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    cvText: data.cvText || null,
  });
  revalidatePath("/dashboard/float-list/database");
  return id;
}

export async function addSubmissionAction(data: any) {
  let candId = data.candId;
  
  if (!candId) {
    candId = "CAND-" + Date.now();
    await db.insert(flCandidates).values({
      id: candId,
      name: data.candName,
      status: "Active",
      initials: data.candName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    });
  }

  const id = "SUB-" + Date.now();
  await db.insert(flSubmissions).values({
    id,
    candId,
    candName: data.candName,
    client: data.client,
    role: data.role,
    consultant: data.consultant || "System",
    dateShared: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    status: "Shared",
  });
  revalidatePath("/dashboard/float-list/submissions");
  revalidatePath("/dashboard/float-list/database");
  revalidatePath("/dashboard/float-list/" + candId);
  return { id, candId };
}

export async function addFollowUpAction(data: any) {
  let candId = data.candId;
  
  if (!candId) {
    candId = "CAND-" + Date.now();
    await db.insert(flCandidates).values({
      id: candId,
      name: data.candName,
      status: "Active",
      initials: data.candName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    });
  }

  const id = "FU-" + Date.now();
  await db.insert(flFollowUps).values({
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
  await db.insert(flReferences).values({
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
  await db.delete(flSubmissions).where(eq(flSubmissions.candId, id));
  await db.delete(flFollowUps).where(eq(flFollowUps.candId, id));
  await db.delete(flActivities).where(eq(flActivities.candId, id));
  await db.delete(flReferences).where(eq(flReferences.candId, id));
  await db.delete(candidateReports).where(eq(candidateReports.candidateId, id));
  await db.delete(flCandidates).where(eq(flCandidates.id, id));
  revalidatePath("/dashboard/float-list/database");
}
export async function editFloatListEntryAction(id: string, data: any) {
  await db.update(flCandidates).set({
    name: data.name,
    company: data.company,
    designation: data.designation,
    email: data.email,
    mobile: data.mobile,
    location: data.location,
    exp: data.exp ? Number(data.exp) : null,
    ctc: data.ctc ? Number(data.ctc) : null,
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
    initials: data.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
  }).where(eq(flCandidates.id, id));
  revalidatePath("/dashboard/float-list/database");
  revalidatePath("/dashboard/float-list/" + id);
  return id;
}
export async function updateCandidateStatusAction(id: string, status: string) {
  await db.update(flCandidates).set({ status }).where(eq(flCandidates.id, id));
  revalidatePath("/dashboard/float-list/database");
}
