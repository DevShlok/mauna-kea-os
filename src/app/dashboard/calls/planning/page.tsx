import React from 'react';
import { db } from "@/db";
import { callPlans, platformUsers, engagementListItems, candidates } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import PlanningClient from "@/features/calls/components/PlanningClient";

export const metadata = {
  title: 'Call Planning',
};

export default async function PlanningPage() {
  const { email, platformUser } = await requireRole(["admin", "consultant"]);
  if (!email || !platformUser) return null;

  const isAdmin = platformUser.role === 'admin';
  const userId = platformUser.id;

  // Fetch plans. If admin, fetch all plans. If consultant, fetch own plans.
  const plansQuery = db
    .select({
      id: callPlans.id,
      userId: callPlans.userId,
      userName: platformUsers.name,
      type: callPlans.type,
      date: callPlans.date,
      targetCandIds: callPlans.targetCandIds,
      targetClientIds: callPlans.targetClientIds,
      planText: callPlans.planText,
      isReviewed: callPlans.isReviewed,
    })
    .from(callPlans)
    .innerJoin(platformUsers, eq(callPlans.userId, platformUsers.id));
    
  if (!isAdmin) {
    plansQuery.where(eq(callPlans.userId, userId));
  }
  
  const allPlans = await plansQuery.orderBy(desc(callPlans.createdAt));

  // Fetch candidates from user's Engagement Lists
  const engagementListCandsRaw = await db.select({
    candId: candidates.id,
    name: candidates.name,
    designation: candidates.designation,
    company: candidates.company,
    status: engagementListItems.status,
    listType: engagementListItems.listType,
  }).from(engagementListItems)
  .innerJoin(candidates, eq(engagementListItems.candId, candidates.id))
  .where(eq(engagementListItems.userId, userId));

  const availableTargets = engagementListCandsRaw.map(c => ({ 
    ...c, 
    list: c.listType 
  }));

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-[14px] text-gray-500 mb-1">Home / Call Lists / Planning</div>
          <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">Weekly & Daily Planning</h1>
        </div>
      </div>
      
      <PlanningClient plans={allPlans} availableTargets={availableTargets} isAdmin={isAdmin} />
    </div>
  );
}
