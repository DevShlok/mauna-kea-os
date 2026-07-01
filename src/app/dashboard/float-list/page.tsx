import { requireRole } from "@/lib/auth";
import { getMandates, getFloats, getCandidates } from "@/db/queries";
import FloatListClient from "@/features/float-list/components/FloatListClient";

export default async function FloatListPage() {
  await requireRole(["admin", "consultant"]);

  const mandates = await getMandates();
  const floats = await getFloats();
  const allCands = await getCandidates();
  
  return <FloatListClient mandates={mandates} floats={floats} allCandidatesMaster={allCands} />;
}