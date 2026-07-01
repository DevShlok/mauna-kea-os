import { requireRole } from "@/lib/auth";
import { getCandidateById } from "@/db/queries";
import NewCandidateClient from "@/features/candidates/components/NewCandidateClient";

export default async function EditFlCandidatePage({ params  }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "consultant"]);;
  const { id } = await params;
  const candidate = await getCandidateById(id);

  if (!candidate) {
    return <div className="p-10 text-center text-gray-400">Candidate not found.</div>;
  }

  return <NewCandidateClient initialData={candidate} />;
}
