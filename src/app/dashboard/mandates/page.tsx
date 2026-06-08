import { getMandates } from "@/db/queries";
import MandatesClient from "./MandatesClient";
export default async function MandatesPage() {
  const mandates = await getMandates();
  return <MandatesClient initialMandates={mandates} />;
}