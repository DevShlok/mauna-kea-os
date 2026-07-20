import { requireRole } from "@/lib/auth";
import { getCandidateById, getMandates, getUserByEmail } from "@/db/queries";
import { db } from "@/db";
import { clientRemarks, clients } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import FlCandidateClient from "@/features/candidates/components/FlCandidateClient";
import { redirect } from "next/navigation";

export default async function FlCandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { platformUser: pUser, email } = await requireRole(["admin", "consultant"]);
  const { id } = await params;
  
  let userRole = "consultant";
  let readOnly = false;
  
  if (email) {
    if (pUser) {
      userRole = pUser.role || "consultant";
      if (userRole === "candidate") {
        readOnly = true;
        if (pUser.linkedCandidateId !== id) {
          redirect(`/dashboard/candidates/${pUser.linkedCandidateId}`);
        }
      }
    }
  }

  const candidate = await getCandidateById(id);
  const mandates = await getMandates();
  const remarks = await db.select().from(clientRemarks).where(eq(clientRemarks.candId, id)).orderBy(asc(clientRemarks.createdAt));
  const allClientsList = await db.select().from(clients).orderBy(asc(clients.name));

  if (!candidate) {
    return <div className="p-10 text-center text-gray-400">Candidate not found.</div>;
  }

  return <FlCandidateClient candidate={candidate} mandates={mandates} userRole={userRole} readOnly={readOnly} clientRemarks={remarks} allClients={allClientsList} />;
}