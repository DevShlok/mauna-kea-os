import { requireRole } from "@/lib/auth";
import { getMandateById, getConsultants } from "@/db/queries";
import MandateDetailClient from "@/features/mandates/components/MandateDetailClient";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function MandateDetailPage({ params  }: { params: Promise<{ id: string }> }) {
  const { platformUser: pUser, email } = await requireRole(["admin", "consultant"]);
  const resolvedParams = await params;
  const mandate = await getMandateById(Number(resolvedParams.id));
  if (!mandate) return <div className="p-10 text-center text-gray-400">Mandate not found.</div>;

  if (email) {
    if (pUser?.role === "client" && pUser.linkedClientId) {
      const [client] = await db.select().from(clients).where(eq(clients.id, pUser.linkedClientId));
      if (!client || mandate.company !== client.name) {
        redirect("/dashboard/mandates");
      }
    }
  }

  const consultants = await getConsultants();
  const currentUser = pUser?.name || "System";

  return <MandateDetailClient initialMandate={mandate} consultants={consultants} currentUser={currentUser} />;
}