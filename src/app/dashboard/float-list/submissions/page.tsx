import { requireRole } from "@/lib/auth";
import { getFloats } from "@/db/queries";
import SubmissionsClient from "@/features/float-list/components/SubmissionsClient";

export default async function SubmissionsPage() {
  await requireRole(["admin", "consultant"]);

  const submissions = await getFloats();
  return <SubmissionsClient initialSubmissions={submissions} />;
}