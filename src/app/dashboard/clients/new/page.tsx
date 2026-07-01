import { requireRole } from "@/lib/auth";
import NewClientClient from "@/features/clients/components/NewClientClient";

export const metadata = {
  title: "Add Client | Mauna Kea OS",
};

export default async function NewClientPage() {
  await requireRole(["admin", "consultant"]);

  return <NewClientClient />;
}
