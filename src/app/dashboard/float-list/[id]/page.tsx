import { requireRole } from "@/lib/auth";
import { getMandates } from "@/db/queries";
import CandidateProfileClient from "@/features/float-list/components/CandidateProfileClient";

export default async function CandidateProfilePage() {
  await requireRole(["admin", "consultant"]);

  const mandates = await getMandates();
  return <CandidateProfileClient mandates={mandates} />;
}