import { requireRole } from "@/lib/auth";
import { NewPayrollRunForm } from "@/components/payroll/NewPayrollRunForm";

export const metadata = { title: "New Payroll Run | Mauna Kea" };

export default async function NewPayrollRunPage() {
  await requireRole(["admin", "finance"]);
  return <NewPayrollRunForm />;
}
