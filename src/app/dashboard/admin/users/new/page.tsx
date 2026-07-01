import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import NewUserClient from "@/features/admin/components/NewUserClient";

export const metadata = {
  title: "Add User | Admin | Mauna Kea OS",
};

export default async function NewUserPage() {
  await requireRole(["admin"]);

  const allClients = await db.select().from(clients);
  return <NewUserClient clients={allClients} />;
}
