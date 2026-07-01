import { requireRole } from "@/lib/auth";
import { getFrameworkById, getMandates } from "@/db/queries";
import CreateFrameworkClient from "@/features/frameworks/components/CreateFrameworkClient";
import { notFound } from "next/navigation";

export default async function EditFrameworkPage({ params  }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "consultant"]);;
  const { id } = await params;
  const framework = await getFrameworkById(id);
  const mandates = await getMandates();

  if (!framework) {
    notFound();
  }

  return <CreateFrameworkClient mandates={mandates} initialData={framework} />;
}