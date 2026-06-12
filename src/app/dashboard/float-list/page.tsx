import { getMandates } from "@/db/queries";
import FloatListClient from "./FloatListClient";

export default async function FloatListPage() {
  const mandates = await getMandates();
  
  return <FloatListClient mandates={mandates} />;
}