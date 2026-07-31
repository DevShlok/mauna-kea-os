"use server";

import { generateObjectWithFallback } from "@/lib/gemini-fallback";
import { z } from "zod";
import { db } from "@/db";
import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { platformUsers } from "@/db/schema";
import { candidates, candidateFiles, clients } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { inngest } from "@/lib/inngest/client";
import crypto from "crypto";



import { evaluateCandidateMatch } from "@/utils/fuzzy-match";
import { eq } from "drizzle-orm";

async function getCurrentUserName(): Promise<string> {
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




export async function convertToClientContactAction(candId: string, clientId: string, contactData: { name: string, designation: string, number: string, email: string }) {
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (!client) throw new Error("Client not found");

  const currentContacts = Array.isArray(client.contacts) ? client.contacts : [];
  
  if (currentContacts.some((c: any) => c.linkedCandidateId === candId)) {
    throw new Error("Candidate is already a contact for this client");
  }

  const newContact = {
    ...contactData,
    linkedCandidateId: candId
  };

  await db.update(clients).set({
    contacts: [...currentContacts, newContact]
  }).where(eq(clients.id, clientId));

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/candidates/${candId}`);
  return { success: true };
}

export async function uploadAndDispatchDirectEvent(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    // Determine the file's MIME type. Fall back to extension sniffing if browser didn't set it.
    let fileType = file.type || "";
    const nameLower = file.name.toLowerCase();
    if (!fileType) {
      if (nameLower.endsWith(".pdf")) fileType = "application/pdf";
      else if (nameLower.endsWith(".docx")) fileType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else if (nameLower.endsWith(".doc")) fileType = "application/msword";
      else if (nameLower.endsWith(".jpg") || nameLower.endsWith(".jpeg")) fileType = "image/jpeg";
      else if (nameLower.endsWith(".png")) fileType = "image/png";
      else if (nameLower.endsWith(".webp")) fileType = "image/webp";
      else if (nameLower.endsWith(".tiff") || nameLower.endsWith(".tif")) fileType = "image/tiff";
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueName = `${Date.now()}-${safeName}`;

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: uploadError } = await supabase.storage
      .from("candidate-cvs")
      .upload(uniqueName, buffer, {
        contentType: fileType || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("candidate-cvs")
      .getPublicUrl(uniqueName);

    await inngest.send({
      name: "cv.process_direct_upload",
      data: {
        publicUrl: publicUrlData.publicUrl,
        fileName: file.name,
        fileType,
      },
    });

    return { success: true };
  } catch (err: any) {
    throw new Error(`Upload failed: ${err.message}`);
  }
}

export async function updatePastCompaniesAction(candId: string, pastCompanies: string[]) {
  await db.update(candidates).set({ pastCompanies }).where(eq(candidates.id, candId));
  revalidatePath(`/dashboard/candidates/${candId}`);
  return { success: true };
}

/**
 * Update the list of target companies for a candidate.
 * Also appends to the list when submitting to a new client (called from addSubmissionAction).
 */
export async function updateCandidateTargetCompaniesAction(candId: string, targetCompanies: string[]) {
  const updatedBy = await getCurrentUserName();
  const now = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  
  const [cand] = await db.select({ auditLog: candidates.auditLog }).from(candidates).where(eq(candidates.id, candId));
  const existingAudit = (cand?.auditLog as Record<string, any>) || {};

  await db.update(candidates).set({
    targetCompanies,
    auditLog: { ...existingAudit, targetCompanies: { updatedBy, updatedAt: now } }
  }).where(eq(candidates.id, candId));

  revalidatePath(`/dashboard/candidates/${candId}`);
  return { success: true };
}

/**
 * Append a single client company to the candidate's targetCompanies list (called on submission).
 */
export async function appendTargetCompanyOnSubmissionAction(candId: string, clientCompany: string) {
  const [cand] = await db.select({ targetCompanies: candidates.targetCompanies }).from(candidates).where(eq(candidates.id, candId));
  const existing: string[] = (cand?.targetCompanies as string[]) || [];
  if (!existing.includes(clientCompany)) {
    await updateCandidateTargetCompaniesAction(candId, [...existing, clientCompany]);
  }
}
