"use server";

import { db } from "@/db";
import { mandates, mandateCandidates, frameworks, frameworkCategories, frameworkCriteria, flCandidates, flSubmissions, flFollowUps, platformUsers } from "@/db/schema";
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
    status: "Active",
    initials: data.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
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
