import { requireRole } from "@/lib/auth";
import { getFrameworks } from "@/db/queries";
import FrameworksClient from "@/features/frameworks/components/FrameworksClient";

export default async function FrameworksPage() {
  await requireRole(["admin", "consultant"]);

  const frameworks = await getFrameworks();
  return <FrameworksClient initialFrameworks={frameworks} />;
}