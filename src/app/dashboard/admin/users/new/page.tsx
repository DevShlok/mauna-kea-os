import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients, platformUsers } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import NewUserClient from "@/features/admin/components/NewUserClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add User | Admin | Mauna Kea",
  description: "Add a new platform user",
};

export default async function NewUserPage() {
  await requireRole(["admin"]);

  const allClients = await db.select().from(clients).where(eq(clients.isDeleted, false));
  const managers = await db.select().from(platformUsers).where(inArray(platformUsers.role, ['admin', 'consultant']));
  
  return <NewUserClient clients={allClients} managers={managers} />;
}
