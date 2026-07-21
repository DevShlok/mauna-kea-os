"use server";
import { db } from "@/db";
import { clients, mandates, candidates, platformUsers, floats } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function bulkDeleteClientsAction(ids: string[]) {
  await requireRole(["admin", "consultant"]);
  if (!ids.length) return { success: true };
  await db.delete(clients).where(inArray(clients.id, ids));
  revalidatePath("/dashboard/clients");
  return { success: true };
}

export async function bulkDeleteMandatesAction(ids: number[]) {
  await requireRole(["admin", "consultant"]);
  if (!ids.length) return { success: true };
  await db.delete(mandates).where(inArray(mandates.id, ids));
  revalidatePath("/dashboard/mandates");
  return { success: true };
}

export async function bulkDeleteCandidatesAction(ids: string[]) {
  await requireRole(["admin", "consultant"]);
  if (!ids.length) return { success: true };
  await db.delete(candidates).where(inArray(candidates.id, ids));
  revalidatePath("/dashboard/candidates");
  return { success: true };
}

export async function bulkDeleteUsersAction(ids: string[]) {
  await requireRole(["admin"]);
  if (!ids.length) return { success: true };
  await db.delete(platformUsers).where(inArray(platformUsers.id, ids));
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function bulkDeleteFloatsAction(ids: number[]) {
  await requireRole(["admin", "consultant"]);
  if (!ids.length) return { success: true };
  await db.delete(floats).where(inArray(floats.id, ids));
  revalidatePath("/dashboard/float-list");
  return { success: true };
}
