import { getMandates, getFloats, getCandidates } from "@/db/queries";
import FloatListClient from "./FloatListClient";

export default async function FloatListPage() {
  const mandates = await getMandates();
  const floats = await getFloats();
  const allCands = await getCandidates();
  
  return <FloatListClient mandates={mandates} floats={floats} allCandidatesMaster={allCands} />;
}