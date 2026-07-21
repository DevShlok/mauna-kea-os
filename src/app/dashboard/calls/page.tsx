import React from 'react';
import { db } from "@/db";
import { engagementListItems, candidates, platformUsers, callPlans } from "@/db/schema";
import { eq, and, or, inArray, isNull } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import CallsClient from "@/features/calls/components/CallsClient";

export const metadata = {
  title: 'Engagement Lists',
};

export default async function CallsPage(props: { searchParams: Promise<{ date?: string }> }) {
  const { email } = await requireRole(["admin", "consultant"]);
  if (!email) return null;
  const searchParams = await props.searchParams;

  const dbUser = await db.select().from(platformUsers).where(eq(platformUsers.email, email));
  if (dbUser.length === 0) return null;
  const userId = dbUser[0].id;

  const todayStr = new Date().toISOString().split('T')[0];
  const isAllTime = searchParams?.date === "all";
  const targetDate = isAllTime ? "all" : (searchParams?.date || todayStr);
  const isToday = targetDate === todayStr;

  // 1. Fetch any explicit Call Plans for this user & date (only if not 'all')
  const plans = isAllTime ? [] : await db.select().from(callPlans).where(
    and(
      eq(callPlans.userId, userId),
      eq(callPlans.date, targetDate)
    )
  );
  
  const plannedCandIds = plans.flatMap(p => p.targetCandIds || []);

  // 2. Build Condition
  let condition;
  if (isAllTime) {
    condition = undefined; // No filter, get all
  } else if (plannedCandIds.length > 0) {
    condition = isToday 
      ? or(
          eq(engagementListItems.nextFollowUp, targetDate),
          isNull(engagementListItems.nextFollowUp),
          inArray(engagementListItems.candId, plannedCandIds)
        )
      : or(
          eq(engagementListItems.nextFollowUp, targetDate),
          inArray(engagementListItems.candId, plannedCandIds)
        );
  } else {
    condition = isToday
      ? or(
          eq(engagementListItems.nextFollowUp, targetDate),
          isNull(engagementListItems.nextFollowUp)
        )
      : eq(engagementListItems.nextFollowUp, targetDate);
  }

  // Fetch engagement list items for this user joined with candidates
  const listItemsQuery = db
    .select({
      id: engagementListItems.id,
      listType: engagementListItems.listType,
      status: engagementListItems.status,
      nextFollowUp: engagementListItems.nextFollowUp,
      notes: engagementListItems.notes,
      createdAt: engagementListItems.createdAt,
      candId: candidates.id,
      candName: candidates.name,
      candCompany: candidates.company,
      candRole: candidates.designation,
      candMobile: candidates.mobile,
      candEmail: candidates.email,
    })
    .from(engagementListItems)
    .innerJoin(candidates, eq(engagementListItems.candId, candidates.id));
    
  const listItems = condition 
    ? await listItemsQuery.where(and(eq(engagementListItems.userId, userId), condition))
    : await listItemsQuery.where(eq(engagementListItems.userId, userId));

  // Find which planned candidates are missing from listItems
  const foundCandIds = listItems.map(i => i.candId);
  const missingCandIds = plannedCandIds.filter(id => !foundCandIds.includes(id));

  let combinedItems = [...listItems];

  if (missingCandIds.length > 0) {
    const missingCandidates = await db.select().from(candidates).where(inArray(candidates.id, missingCandIds));
    const missingMapped = missingCandidates.map(c => ({
      id: 0, // Mock ID for non-existent engagement list item
      listType: "Calling" as const,
      status: "To Call",
      nextFollowUp: targetDate,
      notes: "",
      createdAt: new Date(),
      candId: c.id,
      candName: c.name,
      candCompany: c.company,
      candRole: c.designation,
      candMobile: c.mobile,
      candEmail: c.email,
    }));
    combinedItems = [...combinedItems, ...missingMapped];
  }

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-[14px] text-gray-500 mb-1">Home / Engagement Lists</div>
          <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">Daily Calling Plan</h1>
        </div>
      </div>
      
      <CallsClient items={combinedItems} currentDate={targetDate} />
    </div>
  );
}
