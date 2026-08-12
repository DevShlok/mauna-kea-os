import { requireRole } from "@/lib/auth";
import { getAllEmployeeCtcAction, getPayrollEmployeesAction } from "@/actions/payroll";
import { CtcMasterPage } from "@/components/payroll/CtcMasterPage";

export const metadata = { title: "CTC Master | Mauna Kea Payroll" };

export default async function CtcMasterRoute() {
  await requireRole(["admin", "finance"]);

  const [ctcResult, empResult] = await Promise.all([
    getAllEmployeeCtcAction(),
    getPayrollEmployeesAction(),
  ]);

  const ctcRecords = ctcResult.success ? ctcResult.records : [];
  const employees = empResult.success ? empResult.employees : [];

  return <CtcMasterPage ctcRecords={ctcRecords} employees={employees} />;
}
