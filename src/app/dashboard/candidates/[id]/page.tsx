import { requireRole } from "@/lib/auth";
import { getCandidateById, getMandates, getUserByEmail } from "@/db/queries";
import { db } from "@/db";
import { clientRemarks, clients, engagementListItems } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";
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

  const [candidate, mandates, remarks, allClientsList, userLists] = await Promise.all([
    getCandidateById(id),
    getMandates(),
    db.select().from(clientRemarks).where(eq(clientRemarks.candId, id)).orderBy(asc(clientRemarks.createdAt)),
    db.select().from(clients).orderBy(asc(clients.name)),
    pUser ? db.select().from(engagementListItems).where(
      and(
        eq(engagementListItems.candId, id),
        eq(engagementListItems.userId, pUser.id)
      )
    ) : Promise.resolve([])
  ]);

  if (!candidate) {
    return <div className="p-10 text-center text-gray-400">Candidate not found.</div>;
  }

  const initialEngagementLists = userLists.map((l: any) => l.listType);

  return <FlCandidateClient candidate={candidate} mandates={mandates} userRole={userRole} readOnly={readOnly} clientRemarks={remarks} allClients={allClientsList} initialEngagementLists={initialEngagementLists} />;
}
// Triggering HMR rebuild