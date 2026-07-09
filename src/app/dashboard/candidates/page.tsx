import { requireRole } from "@/lib/auth";
import { getCandidates, getMandates, getUserByEmail } from "@/db/queries";
import CandidatesClient from "@/features/candidates/components/CandidatesClient";
import { redirect } from "next/navigation";

export default async function CandidatesPage() {
  const { platformUser: pUser, email } = await requireRole(["admin", "consultant"]);

  if (email) {
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
