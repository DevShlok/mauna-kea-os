import { getMandates } from "@/db/queries";
import CreateFrameworkClient from "@/features/frameworks/components/CreateFrameworkClient";

export default async function CreateFrameworkPage() {
  const mandates = await getMandates();
  return <CreateFrameworkClient mandates={mandates} />;
}
