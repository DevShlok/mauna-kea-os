import { requireRole } from "@/lib/auth";
import { getMandateById, getUserByEmail } from "@/db/queries";
import MandateDetailClient from "@/features/mandates/components/MandateDetailClient";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function MandateDetailPage({ params  }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "consultant"]);;
  const resolvedParams = await params;
  const mandate = await getMandateById(Number(resolvedParams.id));
  if (!mandate) return <div className="p-10 text-center text-gray-400">Mandate not found.</div>;

  const user = await currentUser();
  if (user?.primaryEmailAddress?.emailAddress) {
    const pUser = await getUserByEmail(user.primaryEmailAddress.emailAddress);
    if (pUser?.role === "client" && pUser.linkedClientId) {
      const [client] = await db.select().from(clients).where(eq(clients.id, pUser.linkedClientId));
      if (!client || mandate.company !== client.name) {
        redirect("/dashboard/mandates");
      }
    }
  }

  return <MandateDetailClient initialMandate={mandate} />;
}