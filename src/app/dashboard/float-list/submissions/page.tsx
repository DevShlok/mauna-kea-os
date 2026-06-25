import { getFloats } from "@/db/queries";
import SubmissionsClient from "@/features/float-list/components/SubmissionsClient";

export default async function SubmissionsPage() {
  const submissions = await getFloats();
  return <SubmissionsClient initialSubmissions={submissions} />;
}