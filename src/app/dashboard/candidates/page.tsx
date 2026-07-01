import { requireRole } from "@/lib/auth";
import { getCandidates, getMandates, getUserByEmail } from "@/db/queries";
import CandidatesClient from "@/features/candidates/components/CandidatesClient";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function CandidatesPage() {
  await requireRole(["admin", "consultant"]);

  const user = await currentUser();
  if (user?.primaryEmailAddress?.emailAddress) {
    const pUser = await getUserByEmail(user.primaryEmailAddress.emailAddress);
    if (pUser?.role === "candidate" && pUser.linkedCandidateId) {
      redirect(`/dashboard/candidates/${pUser.linkedCandidateId}`);
    }
  }

  const [candidates, mandates] = await Promise.all([
    getCandidates(),
    getMandates()
  ]);
  
  return <CandidatesClient candidates={candidates} mandates={mandates} />;
}
