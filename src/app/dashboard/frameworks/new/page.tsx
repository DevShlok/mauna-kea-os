import { requireRole } from "@/lib/auth";
import { getMandates } from "@/db/queries";
import CreateFrameworkClient from "@/features/frameworks/components/CreateFrameworkClient";

export default async function CreateFrameworkPage() {
  await requireRole(["admin", "consultant"]);

  const mandates = await getMandates();
  return <CreateFrameworkClient mandates={mandates} />;
}
