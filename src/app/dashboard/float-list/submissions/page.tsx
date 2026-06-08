import { getSubmissions } from "@/db/queries";
import SubmissionsClient from "./SubmissionsClient";

export default async function SubmissionsPage() {
  const submissions = await getSubmissions();
  return <SubmissionsClient initialSubmissions={submissions} />;
}