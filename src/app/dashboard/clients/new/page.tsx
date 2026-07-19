import { requireRole } from "@/lib/auth";
import NewClientClient from "@/features/clients/components/NewClientClient";
import { db } from "@/db";
import { masterIndustries } from "@/db/schema";
import { asc } from "drizzle-orm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Client | Mauna Kea",
  description: "Add a new client to the Mauna Kea platform",
};

export default async function NewClientPage() {
  await requireRole(["admin", "consultant"]);

  const industries = await db.select().from(masterIndustries).orderBy(asc(masterIndustries.id));

  return <NewClientClient industries={industries} />;
}
