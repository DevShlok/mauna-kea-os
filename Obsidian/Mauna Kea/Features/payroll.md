# Payroll & HR Foundation

**Route:** `/dashboard/payroll`, `/dashboard/payroll/[runId]`, `/dashboard/payroll/ctc-master`
**Access:** `requireRole(['admin', 'finance'])`
**Tables:** [[Database/employee_ctc_master]], [[Database/payroll_runs]], [[Database/payroll_line_items]], [[Database/payroll_leave_summary]], [[Database/payroll_audit_log]], [[Database/platform_users]]

## What It Is
An automated monthly payroll processing pipeline that calculates payable days, earnings, PF, Professional Tax, TDS, and Net Pay, and dispatches server-rendered HTML payslips via Resend email integration.

## Core Process Flow
1. **Leave & LOP Generation**: Pulls approved leave requests for the month against annual quota (24 days), identifies over-quota leaves, and computes Loss-of-Pay (LOP) days.
2. **Payroll Processing**: Fetches active employees and latest CTC Master records effective as of the run month. Computes:
   - Monthly CTC = Annual CTC / 12
   - Basic = 40% of CTC
   - HRA = 20% of CTC
   - Special Allowance = 40% of CTC
   - Gross Earnings = (Full Month Gross / Working Days) × Paid Days
   - PF Employee = 12% on basic capped at ₹15,000 wage ceiling (max ₹1,800/mo)
   - Professional Tax = ₹200/mo
   - Net Pay = Gross Earnings - Gross Deductions
3. **LOP Override**: Admin override control allowing custom LOP days and adjustment notes per employee before approval.
4. **Payslip Generation & Email Dispatch**: Finalization generates server HTML payslips and emails each employee via Resend (`payroll@maunakea.co.in`).
5. **Audit Trail**: Every processing, approval, override, and finalization action is logged in `payroll_audit_log`.
