import { requireRole } from "@/lib/auth";
import { getPayrollRunsAction } from "@/actions/payroll";
import { PayrollDashboard } from "@/components/payroll/PayrollDashboard";

export const metadata = { title: "Payroll | Mauna Kea" };

export default async function PayrollPage() {
  await requireRole(["admin", "finance"]);

  const result = await getPayrollRunsAction();
  const runs = result.success ? result.runs : [];

  return <PayrollDashboard runs={runs} />;
}
