"use server";

import { db } from "@/db";
import { candidateCareerTimeline } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCareerTimelineAction(candId: string) {
  try {
    const timeline = await db
      .select()
      .from(candidateCareerTimeline)
      .where(eq(candidateCareerTimeline.candId, candId))
      .orderBy(desc(candidateCareerTimeline.startDate));
    return { success: true, timeline };
  } catch (error: any) {
    console.error("Failed to fetch career timeline:", error);
    return { success: false, error: "Failed to fetch career timeline" };
  }
}

export async function upsertCareerEntryAction(candId: string, entryId: number | null, entryData: any) {
  try {
    if (entryId) {
      await db.update(candidateCareerTimeline)
        .set(entryData)
        .where(and(eq(candidateCareerTimeline.id, entryId), eq(candidateCareerTimeline.candId, candId)));
    } else {
      await db.insert(candidateCareerTimeline).values({
        ...entryData,
        candId,
      });
    }
    
    // Sync to priorExperiences
    await syncCareerTimelineToPriorExperiences(candId);
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to upsert career entry:", error);
    return { success: false, error: "Failed to save career entry" };
  }
}

export async function deleteCareerEntryAction(candId: string, entryId: number) {
  try {
    await db.delete(candidateCareerTimeline)
      .where(and(eq(candidateCareerTimeline.id, entryId), eq(candidateCareerTimeline.candId, candId)));
      
    // Sync to priorExperiences
    await syncCareerTimelineToPriorExperiences(candId);
      
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete career entry:", error);
    return { success: false, error: "Failed to delete entry" };
  }
}

async function syncCareerTimelineToPriorExperiences(candId: string) {
  const { candidates } = await import("@/db/schema");
  const timeline = await db
    .select()
    .from(candidateCareerTimeline)
    .where(eq(candidateCareerTimeline.candId, candId))
    .orderBy(desc(candidateCareerTimeline.startDate));
    
  const priorExperiences = timeline.map(t => ({
    position: t.roleTitle,
    companyName: t.companyName,
    duration: `${t.startDate ? new Date(t.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''} - ${t.isCurrent || !t.endDate ? 'Present' : new Date(t.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`,
    description: t.description
  }));
  
  await db.update(candidates).set({ priorExperiences }).where(eq(candidates.id, candId));
}
