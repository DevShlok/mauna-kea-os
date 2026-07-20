import React from 'react';
import { db } from "@/db";
import { callingListItems, candidates, platformUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import CallsClient from "@/features/calls/components/CallsClient";

export const metadata = {
  title: 'My Call List',
};

export default async function CallsPage() {
  const { email } = await requireRole(["admin", "consultant"]);
  if (!email) return null;

  const dbUser = await db.select().from(platformUsers).where(eq(platformUsers.email, email));
  if (dbUser.length === 0) return null;
  const userId = dbUser[0].id;

  // Fetch calling list items for this user joined with candidates
  const listItems = await db
    .select({
      id: callingListItems.id,
      status: callingListItems.status,
      nextFollowUp: callingListItems.nextFollowUp,
      notes: callingListItems.notes,
      createdAt: callingListItems.createdAt,
      candId: candidates.id,
      candName: candidates.name,
      candCompany: candidates.company,
      candRole: candidates.designation,
      candMobile: candidates.mobile,
      candEmail: candidates.email,
    })
    .from(callingListItems)
    .innerJoin(candidates, eq(callingListItems.candId, candidates.id))
    .where(eq(callingListItems.userId, userId));

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-[14px] text-gray-500 mb-1">Home / My Call List</div>
          <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">My Call List</h1>
        </div>
      </div>
      
      <CallsClient items={listItems} listType="Calling" />
    </div>
  );
}
