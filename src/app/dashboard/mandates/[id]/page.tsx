import { getMandateById } from "@/db/queries";
import MandateDetailClient from "@/app/dashboard/mandates/[id]/MandateDetailClient";

export default async function MandateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const mandate = await getMandateById(Number(resolvedParams.id));
  if (!mandate) return <div className="p-10 text-center text-gray-400">Mandate not found.</div>;
  return <MandateDetailClient initialMandate={mandate} />;
}