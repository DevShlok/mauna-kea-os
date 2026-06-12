import { getFrameworks } from "@/db/queries";
import CreateMandateClient from "./CreateMandateClient";

export default async function CreateMandatePage() {
  const frameworks = await getFrameworks();
  return <CreateMandateClient frameworks={frameworks} />;
}
