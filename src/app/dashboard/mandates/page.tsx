import { requireRole } from "@/lib/auth";
import { getMandates, getUserByEmail } from "@/db/queries";
import MandatesClient from "@/features/mandates/components/MandatesClient";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function MandatesPage() {
  const { platformUser: pUser, email } = await requireRole(["admin", "consultant"]);

  let filteredMandates = await getMandates();

  if (email) {
    if (pUser?.role === "client" && pUser.linkedClientId) {
      const [client] = await db.select().from(clients).where(eq(clients.id, pUser.linkedClientId));
      if (client) {
        filteredMandates = filteredMandates.filter(m => m.company === client.name);
      } else {
        filteredMandates = [];
      }
    }
  }

  return <MandatesClient initialMandates={filteredMandates} />;
}