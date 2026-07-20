import React from 'react';
import { db } from "@/db";
import { bdListItems, candidates, platformUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import CallsClient from "@/features/calls/components/CallsClient";

export const metadata = {
  title: 'My BD List',
};

export default async function BDListPage() {
  const { email } = await requireRole(["admin", "consultant"]);
  if (!email) return null;

  const dbUser = await db.select().from(platformUsers).where(eq(platformUsers.email, email));
  if (dbUser.length === 0) return null;
  const userId = dbUser[0].id;

  // Fetch BD list items for this user joined with candidates
  const listItems = await db
    .select({
      id: bdListItems.id,
      status: bdListItems.status,
      notes: bdListItems.notes,
      createdAt: bdListItems.createdAt,
      candId: candidates.id,
      candName: candidates.name,
      candCompany: candidates.company,
      candRole: candidates.designation,
      candMobile: candidates.mobile,
      candEmail: candidates.email,
    })
    .from(bdListItems)
    .innerJoin(candidates, eq(bdListItems.candId, candidates.id))
    .where(eq(bdListItems.userId, userId));

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-[14px] text-gray-500 mb-1">Home / My BD List</div>
          <h1 className="text-3xl font-serif font-bold text-[#133255] tracking-tight">My BD List</h1>
        </div>
      </div>
      
      <CallsClient items={listItems} listType="BD" />
    </div>
  );
}
