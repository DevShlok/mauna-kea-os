import { requireRole } from "@/lib/auth";
import { getCandidateById, getMandates, getUserByEmail } from "@/db/queries";
import { db } from "@/db";
import { clientRemarks } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import FlCandidateClient from "@/features/candidates/components/FlCandidateClient";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function FlCandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "consultant"]);
  const { id } = await params;
  
  const user = await currentUser();
  let userRole = "consultant";
  let readOnly = false;
  
  if (user?.primaryEmailAddress?.emailAddress) {
    const pUser = await getUserByEmail(user.primaryEmailAddress.emailAddress);
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

  if (!candidate) {
    return <div className="p-10 text-center text-gray-400">Candidate not found.</div>;
  }

  return <FlCandidateClient candidate={candidate} mandates={mandates} userRole={userRole} readOnly={readOnly} clientRemarks={remarks} />;
}