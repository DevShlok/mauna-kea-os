"use server";

import { db } from "@/db";
import { contractTemplates } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getContractTemplatesAction() {
  await requireRole(["admin", "consultant", "finance"]);
  const templates = await db
    .select()
    .from(contractTemplates)
    .orderBy(desc(contractTemplates.createdAt));
  return templates;
}

export async function saveContractTemplateAction(data: {
  id?: number;
  name: string;
  code: string;
  description?: string;
  structureType?: string;
  defaultSuccessFeePct?: number;
  defaultMinFee?: number;
  defaultMaxFee?: number;
  defaultRetainerAmount?: number;
  defaultReplacementPeriodDays?: number;
  defaultGuaranteePeriodDays?: number;
  defaultPaymentTerms?: string;
  defaultCurrency?: string;
  defaultLatePaymentClause?: string;
  defaultTravelExpensesClause?: string;
  defaultExclusivity?: boolean;
  defaultNonPoachingMonths?: number;
  defaultConfidentiality?: boolean;
  isActive?: boolean;
}) {
  const { platformUser } = await requireRole(["admin", "finance"]);
  const actorName = platformUser?.name || "Admin";

  if (!data.name?.trim()) throw new Error("Template name is required.");
  if (!data.code?.trim()) throw new Error("Template code is required.");

  if (data.id) {
    // Update existing template
    await db
      .update(contractTemplates)
      .set({
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description || null,
        structureType: data.structureType || "SuccessFee",
        defaultSuccessFeePct: data.defaultSuccessFeePct || null,
        defaultMinFee: data.defaultMinFee || null,
        defaultMaxFee: data.defaultMaxFee || null,
        defaultRetainerAmount: data.defaultRetainerAmount || null,
        defaultReplacementPeriodDays: data.defaultReplacementPeriodDays ?? 90,
        defaultGuaranteePeriodDays: data.defaultGuaranteePeriodDays ?? 90,
        defaultPaymentTerms: data.defaultPaymentTerms || "30 Days",
        defaultCurrency: data.defaultCurrency || "INR",
        defaultLatePaymentClause: data.defaultLatePaymentClause || null,
        defaultTravelExpensesClause: data.defaultTravelExpensesClause || null,
        defaultExclusivity: data.defaultExclusivity ?? true,
        defaultNonPoachingMonths: data.defaultNonPoachingMonths ?? 12,
        defaultConfidentiality: data.defaultConfidentiality ?? true,
        isActive: data.isActive ?? true,
        updatedAt: new Date(),
      })
      .where(eq(contractTemplates.id, data.id));
  } else {
    // Create new template
    await db.insert(contractTemplates).values({
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      description: data.description || null,
      structureType: data.structureType || "SuccessFee",
      defaultSuccessFeePct: data.defaultSuccessFeePct || null,
      defaultMinFee: data.defaultMinFee || null,
      defaultMaxFee: data.defaultMaxFee || null,
      defaultRetainerAmount: data.defaultRetainerAmount || null,
      defaultReplacementPeriodDays: data.defaultReplacementPeriodDays ?? 90,
      defaultGuaranteePeriodDays: data.defaultGuaranteePeriodDays ?? 90,
      defaultPaymentTerms: data.defaultPaymentTerms || "30 Days",
      defaultCurrency: data.defaultCurrency || "INR",
      defaultLatePaymentClause: data.defaultLatePaymentClause || null,
      defaultTravelExpensesClause: data.defaultTravelExpensesClause || null,
      defaultExclusivity: data.defaultExclusivity ?? true,
      defaultNonPoachingMonths: data.defaultNonPoachingMonths ?? 12,
      defaultConfidentiality: data.defaultConfidentiality ?? true,
      isActive: data.isActive ?? true,
      createdBy: actorName,
    });
  }

  revalidatePath("/dashboard/legal-finance/contracts/templates");
  return { success: true };
}

export async function deleteContractTemplateAction(id: number) {
  await requireRole(["admin", "finance"]);
  await db.delete(contractTemplates).where(eq(contractTemplates.id, id));
  revalidatePath("/dashboard/legal-finance/contracts/templates");
  return { success: true };
}
