import { db } from "@/db";
import { clients } from "@/db/schema";
import NewUserClient from "./NewUserClient";

export const metadata = {
  title: "Add User | Admin | Mauna Kea OS",
};

export default async function NewUserPage() {
  const allClients = await db.select().from(clients);
  return <NewUserClient clients={allClients} />;
}
