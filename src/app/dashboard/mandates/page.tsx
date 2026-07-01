import { requireRole } from "@/lib/auth";
import { getMandates, getUserByEmail } from "@/db/queries";
import MandatesClient from "@/features/mandates/components/MandatesClient";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function MandatesPage() {
  await requireRole(["admin", "consultant"]);

  const user = await currentUser();
  let filteredMandates = await getMandates();

  if (user?.primaryEmailAddress?.emailAddress) {
    const pUser = await getUserByEmail(user.primaryEmailAddress.emailAddress);
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