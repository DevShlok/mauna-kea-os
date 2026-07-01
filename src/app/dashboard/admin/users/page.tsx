import { requireRole } from "@/lib/auth";
import { getPlatformUsers } from "@/db/queries";
import { db } from "@/db";
import { clients } from "@/db/schema";
import UsersClient from "@/features/admin/components/UsersClient";



export default async function AdminUsersPage() {
  await requireRole(["admin"]);

  const users = await getPlatformUsers();
  const allClients = await db.select().from(clients);
  
  return <UsersClient initialUsers={users} clients={allClients} />;
}
