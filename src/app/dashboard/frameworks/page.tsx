import { getFrameworks } from "@/db/queries";
import FrameworksClient from "@/features/frameworks/components/FrameworksClient";

export default async function FrameworksPage() {
  const frameworks = await getFrameworks();
  return <FrameworksClient initialFrameworks={frameworks} />;
}