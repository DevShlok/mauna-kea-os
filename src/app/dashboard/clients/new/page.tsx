import { requireRole } from "@/lib/auth";
import NewClientClient from "@/features/clients/components/NewClientClient";
import { db } from "@/db";
import { masterIndustries } from "@/db/schema";
import { asc } from "drizzle-orm";

export const metadata = {
  title: "Add Client | Mauna Kea OS",
};

export default async function NewClientPage() {
  await requireRole(["admin", "consultant"]);

  const industries = await db.select().from(masterIndustries).orderBy(asc(masterIndustries.id));

  return <NewClientClient industries={industries} />;
}
