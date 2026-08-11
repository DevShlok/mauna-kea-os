import { requireRole } from "@/lib/auth";
import { getComplianceStats } from "@/db/queries";
import ComplianceClient from "@/features/legal-finance/compliance/components/ComplianceClient";

export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  await requireRole(["admin", "finance"]);

  const stats = await getComplianceStats();

  return <ComplianceClient stats={JSON.parse(JSON.stringify(stats))} />;
}
