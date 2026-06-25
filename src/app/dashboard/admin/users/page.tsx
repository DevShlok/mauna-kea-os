import { getPlatformUsers } from "@/db/queries";
import { db } from "@/db";
import { clients } from "@/db/schema";
import UsersClient from "./UsersClient";



export default async function AdminUsersPage() {
  const users = await getPlatformUsers();
  const allClients = await db.select().from(clients);
  
  return <UsersClient initialUsers={users} clients={allClients} />;
}
