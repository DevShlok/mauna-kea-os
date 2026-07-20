import React from 'react';
import { db } from "@/db";
import { engagementListItems, candidates, platformUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import CallsClient from "@/features/calls/components/CallsClient";

export const metadata = {
  title: 'Engagement Lists',
};

export default async function CallsPage() {
  const { email } = await requireRole(["admin", "consultant"]);
  if (!email) return null;

  const dbUser = await db.select().from(platformUsers).where(eq(platformUsers.email, email));
  if (dbUser.length === 0) return null;
  const userId = dbUser[0].id;

  // Fetch engagement list items for this user joined with candidates
  const listItems = await db
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
    .innerJoin(candidates, eq(engagementListItems.candId, candidates.id))
    .where(eq(engagementListItems.userId, userId));

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-[14px] text-gray-500 mb-1">Home / Engagement Lists</div>
          <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">Engagement Lists</h1>
        </div>
      </div>
      
      <CallsClient items={listItems} />
    </div>
  );
}
