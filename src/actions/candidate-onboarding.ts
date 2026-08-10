"use server";

import { db } from "@/db";
import { candidates, candidateNotifications, candidateBadges, candidateCareerTimeline, candidateFiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveConversationalAnswersAction(candId: string, answers: Record<string, string>) {
  try {
    // Map conversational answers to profile fields
    const mapped: any = {};
    if (answers.name) mapped.name = answers.name;
    if (answers.designation) mapped.designation = answers.designation;
    if (answers.company) mapped.company = answers.company;
    if (answers.ctc) mapped.ctc = parseInt(answers.ctc.replace(/\D/g, ""), 10) || null;
    if (answers.expected) mapped.expected = parseInt(answers.expected.replace(/\D/g, ""), 10) || null;
    if (answers.notice) mapped.notice = parseInt(answers.notice.replace(/\D/g, ""), 10) || null;
    if (answers.location) mapped.location = answers.location;

    if (answers.experienceSummary || answers.achievements) {
      mapped.notes = [answers.experienceSummary, answers.achievements].filter(Boolean).join("\n\nKey Achievements:\n");
    }
    if (answers.dreamRoles) {
      mapped.dreamRoles = [answers.dreamRoles];
    }
    
    // We only update what was provided via chat
    if (Object.keys(mapped).length > 0) {
      await db.update(candidates).set(mapped).where(eq(candidates.id, candId));
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to save conversational answers:", error);
    return { success: false, error: "Failed to save answers" };
  }
}

export async function completeOnboardingAction(candId: string, finalProfileData: any, onboardingSource: string) {
  try {
    const { careerTimeline, ...profileFields } = finalProfileData;
    
    // 1. Update candidate profile fields
    await db.update(candidates).set({
      ...profileFields,
      profileCompletedAt: new Date(),
      onboardingSource,
    }).where(eq(candidates.id, candId));

    // 2. Insert career timeline if available
    if (careerTimeline && Array.isArray(careerTimeline) && careerTimeline.length > 0) {
      const timelineInserts = careerTimeline.map((ct: any, index: number) => ({
        candId,
        roleTitle: ct.roleTitle,
        companyName: ct.companyName,
        startDate: ct.startDate ? new Date(ct.startDate).toISOString() : new Date().toISOString(),
        endDate: ct.endDate ? new Date(ct.endDate).toISOString() : null,
        description: ct.description || null,
        isCurrent: ct.isCurrent || false,
        sortOrder: index,
      }));
      await db.insert(candidateCareerTimeline).values(timelineInserts).onConflictDoNothing();
    }

    // 3. Award 'profile_complete' badge
    await db.insert(candidateBadges).values({
      candId,
      badgeType: "profile_complete",
      earnedAt: new Date(),
    }).onConflictDoUpdate({
      target: [candidateBadges.candId, candidateBadges.badgeType],
      set: { earnedAt: new Date() },
    });

    // 4. Send Welcome Notification
    await db.insert(candidateNotifications).values({
      candId,
      type: "status_update",
      message: "Welcome to Mauna Kea! Your candidate profile is now complete.",
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to complete onboarding:", error);
    return { success: false, error: "Failed to complete onboarding" };
  }
}

export async function awardBadgeAction(candId: string, badgeType: string, metadata?: any) {
  try {
    await db.insert(candidateBadges).values({
      candId,
      badgeType,
      earnedAt: new Date(),
      metadata: metadata || null,
    }).onConflictDoNothing();
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to award badge ${badgeType}:`, error);
    return { success: false, error: "Failed to award badge" };
  }
}
