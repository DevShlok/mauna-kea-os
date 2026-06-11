import { getMandates } from "@/db/queries";
import CandidatesClient from "./CandidatesClient";

export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  const mandates = await getMandates();
  
  return <CandidatesClient mandates={mandates} />;
}
