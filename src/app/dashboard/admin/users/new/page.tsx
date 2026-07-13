import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients, platformUsers } from "@/db/schema";
import { inArray } from "drizzle-orm";
import NewUserClient from "@/features/admin/components/NewUserClient";

export const metadata = {
  title: "Add User | Admin | Mauna Kea OS",
};

export default async function NewUserPage() {
  await requireRole(["admin"]);

  const allClients = await db.select().from(clients);
  const managers = await db.select().from(platformUsers).where(inArray(platformUsers.role, ['admin', 'consultant']));
  
  return <NewUserClient clients={allClients} managers={managers} />;
}
