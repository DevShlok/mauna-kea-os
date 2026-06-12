import { getCandidateById, getMandates } from "@/db/queries";
import FlCandidateClient from "./FlCandidateClient";

export default async function FlCandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidate = await getCandidateById(id);
  const mandates = await getMandates();

  if (!candidate) {
    return <div className="p-10 text-center text-gray-400">Candidate not found.</div>;
  }

  return <FlCandidateClient candidate={candidate} mandates={mandates} />;
}