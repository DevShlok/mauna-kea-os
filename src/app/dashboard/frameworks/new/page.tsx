import { getMandates } from "@/db/queries";
import CreateFrameworkClient from "./CreateFrameworkClient";

export default async function CreateFrameworkPage() {
  const mandates = await getMandates();
  return <CreateFrameworkClient mandates={mandates} />;
}
