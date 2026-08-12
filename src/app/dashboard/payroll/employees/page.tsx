import { requireRole } from "@/lib/auth";
import { getPayrollEmployeesAction } from "@/actions/payroll";
import { EmployeeProfilesPage } from "@/components/payroll/EmployeeProfilesPage";

export const metadata = { title: "Employee Profiles | Mauna Kea Payroll" };

export default async function EmployeeProfilesRoute() {
  await requireRole(["admin", "finance"]);

  const result = await getPayrollEmployeesAction();
  const employees = result.success ? result.employees : [];

  return <EmployeeProfilesPage employees={employees} />;
}
