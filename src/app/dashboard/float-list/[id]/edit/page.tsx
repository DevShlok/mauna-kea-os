import { getFlCandidateById } from "@/db/queries";
import NewCandidateClient from "../../database/new/NewCandidateClient";

export default async function EditFlCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidate = await getFlCandidateById(id);

  if (!candidate) {
    return <div className="p-10 text-center text-gray-400">Candidate not found.</div>;
  }

  return <NewCandidateClient initialData={candidate} />;
}
