import { requireRole } from "@/lib/auth";
import { getPayrollRunDetailAction } from "@/actions/payroll";
import { PayrollRunDetail } from "@/components/payroll/PayrollRunDetail";
import { notFound } from "next/navigation";

export const metadata = { title: "Payroll Run | Mauna Kea" };

export default async function PayrollRunPage({ params }: { params: Promise<{ runId: string }> }) {
  await requireRole(["admin", "finance"]);

  const { runId } = await params;
  const id = parseInt(runId, 10);
  if (isNaN(id)) notFound();

  const result = await getPayrollRunDetailAction(id);
  if (!result.success) notFound();

  return (
    <PayrollRunDetail
      run={result.run}
      lineItems={result.lineItems}
      leaveSummary={result.leaveSummary}
      auditLog={result.auditLog}
    />
  );
}
