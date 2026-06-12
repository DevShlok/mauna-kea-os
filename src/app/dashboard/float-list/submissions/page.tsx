import { getFloats } from "@/db/queries";
import SubmissionsClient from "./SubmissionsClient";

export default async function SubmissionsPage() {
  const submissions = await getFloats();
  return <SubmissionsClient initialSubmissions={submissions} />;
}