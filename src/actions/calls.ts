"use server";

import { db } from "@/db";
import { floatActivities, platformUsers, callingListItems, bdListItems, callPlans } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function logCallActivityAction(data: {
  candId: string;
  listType: "BD" | "Calling";
  status: string;
  nextFollowUp: string;
  note: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Unauthorized");
  
  const dbUser = await db.select().from(platformUsers).where(eq(platformUsers.email, user.email));
  if (dbUser.length === 0) throw new Error("User not found");
  const consultantName = dbUser[0].name;
  const userId = dbUser[0].id;

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

  // 1. Insert into floatActivities (so it shows in Candidate Database)
  await db.insert(floatActivities).values({
    candId: data.candId,
    date: dateStr,
    time: timeStr,
    consultant: consultantName,
    note: data.note,
    type: data.listType === "BD" ? "BD Call" : "Delivery Call",
  });

  // 2. Update status and nextFollowUp in the respective list
  if (data.listType === "BD") {
    await db.update(bdListItems)
      .set({
        status: data.status,
        notes: data.note,
      })
      .where(and(eq(bdListItems.candId, data.candId), eq(bdListItems.userId, userId)));
  } else {
    await db.update(callingListItems)
      .set({
        status: data.status,
        nextFollowUp: data.nextFollowUp || null,
        notes: data.note,
      })
      .where(and(eq(callingListItems.candId, data.candId), eq(callingListItems.userId, userId)));
  }
}

export async function createPlanAction(data: {
  type: "Weekly" | "Daily";
  date: string;
  targetCalls: number;
  planText?: string;
  pendingReason?: string;
  carryForwardCount?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Unauthorized");
  
  const dbUser = await db.select().from(platformUsers).where(eq(platformUsers.email, user.email));
  if (dbUser.length === 0) throw new Error("User not found");
  const userId = dbUser[0].id;

  // Check if a plan already exists for this date and type
  const existing = await db.select().from(callPlans).where(
    and(
      eq(callPlans.userId, userId), 
      eq(callPlans.date, data.date),
      eq(callPlans.type, data.type)
    )
  );

  if (existing.length > 0) {
    await db.update(callPlans).set({
      targetCalls: data.targetCalls,
      planText: data.planText,
      pendingReason: data.pendingReason,
      carryForwardCount: data.carryForwardCount,
    }).where(eq(callPlans.id, existing[0].id));
  } else {
    await db.insert(callPlans).values({
      userId,
      type: data.type,
      date: data.date,
      targetCalls: data.targetCalls,
      planText: data.planText,
      pendingReason: data.pendingReason,
      carryForwardCount: data.carryForwardCount,
    });
  }
}

export async function reviewPlanAction(planId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Unauthorized");
  
  const dbUser = await db.select().from(platformUsers).where(eq(platformUsers.email, user.email));
  if (dbUser.length === 0) throw new Error("User not found");
  
  if (dbUser[0].role !== 'admin') {
    throw new Error("Only admins can review plans");
  }

  await db.update(callPlans).set({
    isReviewed: true,
    reviewedBy: dbUser[0].id
  }).where(eq(callPlans.id, planId));
}

