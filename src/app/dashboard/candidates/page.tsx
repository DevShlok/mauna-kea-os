import { getCandidates, getMandates } from "@/db/queries";
import CandidatesClient from "./CandidatesClient";

export default async function CandidatesPage() {
  const candidates = await getCandidates();
  const mandates = await getMandates();
  
  return <CandidatesClient candidates={candidates} mandates={mandates} />;
}
