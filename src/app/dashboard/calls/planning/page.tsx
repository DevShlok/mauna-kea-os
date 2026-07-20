import React from 'react';
import { db } from "@/db";
import { callPlans, platformUsers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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
      targetCalls: callPlans.targetCalls,
      completedCalls: callPlans.completedCalls,
      pendingReason: callPlans.pendingReason,
      carryForwardCount: callPlans.carryForwardCount,
      planText: callPlans.planText,
      isReviewed: callPlans.isReviewed,
    })
    .from(callPlans)
    .innerJoin(platformUsers, eq(callPlans.userId, platformUsers.id));
    
  if (!isAdmin) {
    plansQuery.where(eq(callPlans.userId, userId));
  }
  
  const allPlans = await plansQuery.orderBy(desc(callPlans.createdAt));

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-[14px] text-gray-500 mb-1">Home / Call Lists / Planning</div>
          <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">Weekly & Daily Planning</h1>
        </div>
      </div>
      
      <PlanningClient plans={allPlans} isAdmin={isAdmin} />
    </div>
  );
}
