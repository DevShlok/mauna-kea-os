import { requireRole } from "@/lib/auth";
import { getCandidateById } from "@/db/queries";
import NewCandidateClient from "@/features/candidates/components/NewCandidateClient";
import { notFound } from "next/navigation";

export default async function EditCandidatePage({ params  }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "consultant"]);;
  const { id } = await params;
  const candidate = await getCandidateById(id);

  if (!candidate) {
    notFound();
  }

  return <NewCandidateClient initialData={candidate} />;
}
