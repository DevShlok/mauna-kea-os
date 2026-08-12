'use server';

import { db } from '@/db';
import {
  employeeCtcMaster,
  payrollRuns,
  payrollLineItems,
  payrollLeaveSummary,
  payrollAuditLog,
  platformUsers,
  leaveRequests,
} from '@/db/schema';
import { eq, and, lte, gte, desc, sql, inArray } from 'drizzle-orm';
import { requireRole } from '@/lib/auth';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWorkingDays(month: string): number {
  const [year, mo] = month.split('-').map(Number);
  const daysInMonth = new Date(year, mo, 0).getDate();
  let working = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, mo - 1, d).getDay();
    if (day !== 0 && day !== 6) working++;
  }
  return working;
}

function computeNetPay(
  ctc: typeof employeeCtcMaster.$inferSelect,
  lopDays: number,
  workingDays: number
) {
  const monthlyCtc = ctc.annualCtc / 12;
  const basic = monthlyCtc * (ctc.basicPct / 100);
  const hra = monthlyCtc * (ctc.hraPct / 100);
  const specialAllowance = monthlyCtc * (ctc.specialAllowancePct / 100);
  const otherAllowancesTotal = (ctc.otherAllowances ?? []).reduce(
    (s: number, a: { label: string; amount: number }) => s + a.amount,
    0
  );
  const grossFullMonth = basic + hra + specialAllowance + otherAllowancesTotal;
  const paidDays = Math.max(workingDays - lopDays, 0);
  const grossEarnings = (grossFullMonth / workingDays) * paidDays;

  // PF capped at ₹15,000 basic
  const pfBase = Math.min(basic, 15000);
  const pfEmployee = ctc.pfApplicable ? pfBase * (ctc.pfEmployeePct / 100) : 0;
  const pfEmployer = ctc.pfApplicable ? pfBase * (ctc.pfEmployerPct / 100) : 0;
  const professionalTax = ctc.professionalTaxMonthly;
  const tds = ctc.tdsMonthly;
  const otherDeductionsTotal = (ctc.otherDeductions ?? []).reduce(
    (s: number, d: { label: string; amount: number }) => s + d.amount,
    0
  );
  const grossDeductions = pfEmployee + professionalTax + tds + otherDeductionsTotal;
  const netPay = grossEarnings - grossDeductions;

  return { basic, hra, specialAllowance, paidDays, grossEarnings, pfEmployee, pfEmployer, professionalTax, tds, grossDeductions, netPay };
}

// ─── 1. Get or Create Payroll Run ─────────────────────────────────────────────

export async function getOrCreatePayrollRunAction(month: string) {
  await requireRole(['admin', 'finance']);

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return { success: false as const, error: 'Invalid month format. Use YYYY-MM.' };
  }

  const existing = await db.select().from(payrollRuns).where(eq(payrollRuns.month, month)).limit(1);
  if (existing.length > 0) return { success: true as const, run: existing[0] };

  const [newRun] = await db.insert(payrollRuns).values({ month }).returning();
  return { success: true as const, run: newRun };
}

// ─── 2. Generate Leave & LOP Report ───────────────────────────────────────────

export async function generateLeaveLopReportAction(runId: number) {
  const { platformUser } = await requireRole(['admin', 'finance']);

  const run = await db.select().from(payrollRuns).where(eq(payrollRuns.id, runId)).then(r => r[0]);
  if (!run) return { success: false as const, error: 'Payroll run not found.' };
  if (run.status !== 'Draft') return { success: false as const, error: 'Can only generate leave report for a Draft run.' };

  const [year, mo] = run.month.split('-').map(Number);
  const monthStart = `${year}-${String(mo).padStart(2, '0')}-01`;
  const monthEnd = new Date(year, mo, 0).toISOString().split('T')[0];

  const employees = await db
    .select()
    .from(platformUsers)
    .where(eq(platformUsers.isDeleted, false));

  const ANNUAL_QUOTA = 24;
  const summaries = [];

  for (const emp of employees) {
    const thisMonthLeaves = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(leaveRequests)
      .where(and(
        eq(leaveRequests.userId, emp.id),
        eq(leaveRequests.status, 'Approved'),
        gte(leaveRequests.startDate, monthStart),
        lte(leaveRequests.startDate, monthEnd),
      ));
    const takenThisMonth = thisMonthLeaves[0]?.count ?? 0;

    const ytdStart = `${year}-01-01`;
    const ytdLeaves = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(leaveRequests)
      .where(and(
        eq(leaveRequests.userId, emp.id),
        eq(leaveRequests.status, 'Approved'),
        gte(leaveRequests.startDate, ytdStart),
        lte(leaveRequests.startDate, monthEnd),
      ));
    const takenYtd = ytdLeaves[0]?.count ?? 0;

    const balanceRemaining = Math.max(ANNUAL_QUOTA - takenYtd, 0);
    const surplus = Math.max(takenYtd - ANNUAL_QUOTA, 0);
    const lopDays = Math.min(surplus, takenThisMonth);
    const flagged = takenYtd > ANNUAL_QUOTA;

    summaries.push({ runId, userId: emp.id, annualQuota: ANNUAL_QUOTA, leavesTakenYtd: takenYtd, leavesTakenThisMonth: takenThisMonth, balanceRemaining, lopDays, flagged });
  }

  await db.delete(payrollLeaveSummary).where(eq(payrollLeaveSummary.runId, runId));
  if (summaries.length > 0) await db.insert(payrollLeaveSummary).values(summaries);

  await db.insert(payrollAuditLog).values({
    runId, action: 'LEAVE_LOP_REPORT_GENERATED',
    actorName: platformUser?.name ?? platformUser?.email ?? "User", actorId: platformUser?.id ?? "unknown",
    notes: `Leave & LOP report generated for ${employees.length} employee(s).`,
  });

  return { success: true as const, count: summaries.length };
}

// ─── 3. Process Payroll Run ────────────────────────────────────────────────────

export async function processPayrollRunAction(runId: number) {
  const { platformUser } = await requireRole(['admin', 'finance']);

  const run = await db.select().from(payrollRuns).where(eq(payrollRuns.id, runId)).then(r => r[0]);
  if (!run) return { success: false as const, error: 'Payroll run not found.' };
  if (run.status !== 'Draft') return { success: false as const, error: 'Run has already been processed.' };

  const workingDays = getWorkingDays(run.month);

  const employees = await db
    .select()
    .from(platformUsers)
    .where(eq(platformUsers.isDeleted, false));

  const lineItems: typeof payrollLineItems.$inferInsert[] = [];
  let totalGross = 0;
  let totalNet = 0;

  for (const emp of employees) {
    const ctcRecord = await db
      .select()
      .from(employeeCtcMaster)
      .where(and(
        eq(employeeCtcMaster.userId, emp.id),
        lte(employeeCtcMaster.effectiveDate, `${run.month}-28`),
      ))
      .orderBy(desc(employeeCtcMaster.effectiveDate))
      .limit(1);

    if (ctcRecord.length === 0) continue;
    const ctc = ctcRecord[0];

    const lopSummary = await db
      .select()
      .from(payrollLeaveSummary)
      .where(and(eq(payrollLeaveSummary.runId, runId), eq(payrollLeaveSummary.userId, emp.id)))
      .limit(1);
    const lopDays = lopSummary[0]?.lopDays ?? 0;

    const computed = computeNetPay(ctc, lopDays, workingDays);
    totalGross += computed.grossEarnings;
    totalNet += computed.netPay;

    lineItems.push({
      runId, userId: emp.id,
      employeeName: emp.name,
      employeeCode: emp.employeeCode ?? null,
      designation: emp.designation ?? null,
      department: emp.department ?? null,
      dateOfJoining: emp.dateOfJoining ?? null,
      pan: emp.pan ?? null,
      bankAccount: emp.bankAccount ?? null,
      bankName: emp.bankName ?? null,
      ifsc: emp.ifsc ?? null,
      workingDaysInMonth: workingDays,
      paidDays: computed.paidDays,
      lopDays,
      basic: computed.basic,
      hra: computed.hra,
      specialAllowance: computed.specialAllowance,
      otherAllowances: ctc.otherAllowances ?? [],
      grossEarnings: computed.grossEarnings,
      pfEmployee: computed.pfEmployee,
      pfEmployer: computed.pfEmployer,
      professionalTax: computed.professionalTax,
      tds: computed.tds,
      otherDeductions: ctc.otherDeductions ?? [],
      grossDeductions: computed.grossDeductions,
      netPay: computed.netPay,
    });
  }

  await db.delete(payrollLineItems).where(eq(payrollLineItems.runId, runId));
  if (lineItems.length > 0) await db.insert(payrollLineItems).values(lineItems);

  await db.update(payrollRuns).set({
    status: 'Processed',
    totalGrossEarnings: totalGross,
    totalNetPay: totalNet,
    totalEmployees: lineItems.length,
    processedBy: platformUser?.name ?? platformUser?.email ?? "User",
    processedAt: new Date(),
  }).where(eq(payrollRuns.id, runId));

  await db.insert(payrollAuditLog).values({
    runId, action: 'PAYROLL_PROCESSED',
    actorName: platformUser?.name ?? platformUser?.email ?? "User", actorId: platformUser?.id ?? "unknown",
    notes: `Processed ${lineItems.length} employee(s). Total net: ₹${totalNet.toFixed(2)}.`,
  });

  return { success: true as const, count: lineItems.length, totalNet };
}

// ─── 4. Override LOP ──────────────────────────────────────────────────────────

export async function overrideLopAction(runId: number, userId: string, lopDays: number, note: string) {
  const { platformUser } = await requireRole(['admin']);

  const run = await db.select().from(payrollRuns).where(eq(payrollRuns.id, runId)).then(r => r[0]);
  if (!run) return { success: false as const, error: 'Run not found.' };
  if (!['Draft', 'Processed'].includes(run.status)) {
    return { success: false as const, error: 'Can only override LOP on Draft or Processed runs.' };
  }

  await db.update(payrollLeaveSummary)
    .set({ lopDays })
    .where(and(eq(payrollLeaveSummary.runId, runId), eq(payrollLeaveSummary.userId, userId)));

  await db.update(payrollLineItems)
    .set({ lopOverride: lopDays, adjustmentNote: note })
    .where(and(eq(payrollLineItems.runId, runId), eq(payrollLineItems.userId, userId)));

  await db.insert(payrollAuditLog).values({
    runId, action: 'LOP_OVERRIDDEN',
    actorName: platformUser?.name ?? platformUser?.email ?? "User", actorId: platformUser?.id ?? "unknown",
    notes: `LOP override for user ${userId}: ${lopDays} day(s). Note: ${note}`,
  });

  return { success: true as const };
}

// ─── 5. Approve Payroll Run ────────────────────────────────────────────────────

export async function approvePayrollRunAction(runId: number, notes?: string) {
  const { platformUser } = await requireRole(['admin']);

  const run = await db.select().from(payrollRuns).where(eq(payrollRuns.id, runId)).then(r => r[0]);
  if (!run) return { success: false as const, error: 'Run not found.' };
  if (run.status !== 'Processed') return { success: false as const, error: 'Only Processed runs can be approved.' };

  await db.update(payrollRuns).set({
    status: 'Approved',
    approvedBy: platformUser?.name ?? platformUser?.email ?? "User",
    approvedAt: new Date(),
    notes: notes ?? run.notes,
  }).where(eq(payrollRuns.id, runId));

  await db.insert(payrollAuditLog).values({
    runId, action: 'PAYROLL_APPROVED',
    actorName: platformUser?.name ?? platformUser?.email ?? "User", actorId: platformUser?.id ?? "unknown",
    notes: notes ?? null,
  });

  return { success: true as const };
}

// ─── 6. Finalize and Send Payslips ────────────────────────────────────────────

export async function finalizeAndSendPayslipsAction(runId: number) {
  const { platformUser } = await requireRole(['admin']);

  const run = await db.select().from(payrollRuns).where(eq(payrollRuns.id, runId)).then(r => r[0]);
  if (!run) return { success: false as const, error: 'Run not found.' };
  if (run.status !== 'Approved') return { success: false as const, error: 'Only Approved runs can be finalized.' };

  const items = await db.select().from(payrollLineItems).where(eq(payrollLineItems.runId, runId));
  const userIds = items.map(li => li.userId);

  const employees = await db
    .select({ id: platformUsers.id, email: platformUsers.email })
    .from(platformUsers)
    .where(inArray(platformUsers.id, userIds));

  const emailMap = Object.fromEntries(employees.map(e => [e.id, e.email]));

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const [year, mo] = run.month.split('-');
  const monthLabel = new Date(Number(year), Number(mo) - 1, 1)
    .toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  let sent = 0;
  for (const li of items) {
    const toEmail = emailMap[li.userId];
    if (!toEmail) continue;
    try {
      await resend.emails.send({
        from: 'Payroll <payroll@maunakea.co.in>',
        to: toEmail,
        subject: `Your Payslip for ${monthLabel} — Mauna Kea`,
        html: await buildPayslipHtml(li, monthLabel),
      });
      await db.update(payrollLineItems)
        .set({ payslipSent: true, payslipSentAt: new Date() })
        .where(eq(payrollLineItems.id, li.id));
      sent++;
    } catch (err) {
      console.error(`Payslip send failed for ${toEmail}:`, err);
    }
  }

  await db.update(payrollRuns).set({
    status: 'Finalized',
    finalizedBy: platformUser?.name ?? platformUser?.email ?? "User",
    finalizedAt: new Date(),
  }).where(eq(payrollRuns.id, runId));

  await db.insert(payrollAuditLog).values({
    runId, action: 'PAYROLL_FINALIZED',
    actorName: platformUser?.name ?? platformUser?.email ?? "User", actorId: platformUser?.id ?? "unknown",
    notes: `Finalized. Payslips sent: ${sent}/${items.length}.`,
  });

  return { success: true as const, sent, total: items.length };
}

// ─── 7. Get All Payroll Runs ───────────────────────────────────────────────────

export async function getPayrollRunsAction() {
  await requireRole(['admin', 'finance']);
  const runs = await db.select().from(payrollRuns).orderBy(desc(payrollRuns.month));
  return { success: true as const, runs };
}

// ─── 8. Get Payroll Run Detail ─────────────────────────────────────────────────

export async function getPayrollRunDetailAction(runId: number) {
  await requireRole(['admin', 'finance']);

  const run = await db.select().from(payrollRuns).where(eq(payrollRuns.id, runId)).then(r => r[0]);
  if (!run) return { success: false as const, error: 'Run not found.' };

  const [items, leaveSummary, auditLog] = await Promise.all([
    db.select().from(payrollLineItems).where(eq(payrollLineItems.runId, runId)).orderBy(payrollLineItems.employeeName),
    db.select().from(payrollLeaveSummary).where(eq(payrollLeaveSummary.runId, runId)),
    db.select().from(payrollAuditLog).where(eq(payrollAuditLog.runId, runId)).orderBy(desc(payrollAuditLog.performedAt)),
  ]);

  return { success: true as const, run, lineItems: items, leaveSummary, auditLog };
}

// ─── 9. Upsert Employee CTC ────────────────────────────────────────────────────

export async function upsertEmployeeCtcAction(data: {
  userId: string;
  effectiveDate: string;
  annualCtc: number;
  basicPct: number;
  hraPct: number;
  specialAllowancePct: number;
  pfApplicable: boolean;
  pfEmployeePct: number;
  pfEmployerPct: number;
  professionalTaxMonthly: number;
  tdsMonthly: number;
  otherAllowances?: { label: string; amount: number }[];
  otherDeductions?: { label: string; amount: number }[];
}) {
  const { platformUser } = await requireRole(['admin', 'finance']);

  const pctSum = data.basicPct + data.hraPct + data.specialAllowancePct;
  if (Math.abs(pctSum - 100) > 0.01) {
    return { success: false as const, error: `Component percentages must sum to 100. Currently: ${pctSum.toFixed(1)}%.` };
  }

  await db.insert(employeeCtcMaster).values({
    ...data,
    otherAllowances: data.otherAllowances ?? [],
    otherDeductions: data.otherDeductions ?? [],
    createdBy: platformUser?.name ?? platformUser?.email ?? "User",
  }).onConflictDoUpdate({
    target: [employeeCtcMaster.userId, employeeCtcMaster.effectiveDate],
    set: {
      annualCtc: data.annualCtc,
      basicPct: data.basicPct,
      hraPct: data.hraPct,
      specialAllowancePct: data.specialAllowancePct,
      pfApplicable: data.pfApplicable,
      pfEmployeePct: data.pfEmployeePct,
      pfEmployerPct: data.pfEmployerPct,
      professionalTaxMonthly: data.professionalTaxMonthly,
      tdsMonthly: data.tdsMonthly,
      otherAllowances: data.otherAllowances ?? [],
      otherDeductions: data.otherDeductions ?? [],
      createdBy: platformUser?.name ?? platformUser?.email ?? "User",
    },
  });

  return { success: true as const };
}

// ─── 10. Get All Employee CTC (latest per employee) ───────────────────────────

export async function getAllEmployeeCtcAction() {
  await requireRole(['admin', 'finance']);

  const records = await db
    .select({
      ctc: employeeCtcMaster,
      user: {
        id: platformUsers.id,
        name: platformUsers.name,
        email: platformUsers.email,
        designation: platformUsers.designation,
        department: platformUsers.department,
        employeeCode: platformUsers.employeeCode,
      },
    })
    .from(employeeCtcMaster)
    .innerJoin(platformUsers, eq(employeeCtcMaster.userId, platformUsers.id))
    .where(
      sql`${employeeCtcMaster.effectiveDate} = (
        SELECT MAX(e2.effective_date)
        FROM employee_ctc_master e2
        WHERE e2.user_id = ${employeeCtcMaster.userId}
      )`
    )
    .orderBy(platformUsers.name);

  return { success: true as const, records };
}

// ─── 11. Update Employee HR Profile ───────────────────────────────────────────

export async function updateEmployeeHrProfileAction(userId: string, data: {
  employeeCode?: string;
  designation?: string;
  department?: string;
  dateOfJoining?: string;
  pan?: string;
  bankAccount?: string;
  bankName?: string;
  ifsc?: string;
}) {
  await requireRole(['admin', 'finance']);

  await db.update(platformUsers).set({
    employeeCode: data.employeeCode,
    designation: data.designation,
    department: data.department,
    dateOfJoining: data.dateOfJoining ?? null,
    pan: data.pan,
    bankAccount: data.bankAccount,
    bankName: data.bankName,
    ifsc: data.ifsc,
  }).where(eq(platformUsers.id, userId));

  return { success: true as const };
}

// ─── 12. Get all employees for payroll (active team members) ──────────────────

export async function getPayrollEmployeesAction() {
  await requireRole(['admin', 'finance']);

  const employees = await db
    .select()
    .from(platformUsers)
    .where(and(
      eq(platformUsers.isDeleted, false),
      // Exclude client/candidate roles from payroll
      sql`${platformUsers.role} IN ('admin', 'consultant', 'finance')`
    ))
    .orderBy(platformUsers.name);

  return { success: true as const, employees };
}

// ─── Payslip HTML Builder ──────────────────────────────────────────────────────

function formatCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function numToWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (n === 0) return 'Zero';
  const amount = Math.floor(n);

  function inWords(num: number): string {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num / 10)] + ' ' + ones[num % 10] + ' ';
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred ' + inWords(num % 100);
    if (num < 100000) return inWords(Math.floor(num / 1000)) + 'Thousand ' + inWords(num % 1000);
    if (num < 10000000) return inWords(Math.floor(num / 100000)) + 'Lakh ' + inWords(num % 100000);
    return inWords(Math.floor(num / 10000000)) + 'Crore ' + inWords(num % 10000000);
  }

  return inWords(amount).trim() + ' Rupees Only';
}

export async function buildPayslipHtml(
  li: typeof payrollLineItems.$inferSelect,
  monthLabel: string
): Promise<string> {
  const otherAllowancesRows = (li.otherAllowances ?? [])
    .map((a: { label: string; amount: number }) =>
      `<tr><td>${a.label}</td><td style="text-align:right">${formatCurrency(a.amount)}</td></tr>`)
    .join('');

  const otherDeductionsRows = (li.otherDeductions ?? [])
    .map((d: { label: string; amount: number }) =>
      `<tr><td>${d.label}</td><td style="text-align:right">${formatCurrency(d.amount)}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #f4f6f9; margin: 0; padding: 20px; }
  .payslip { max-width: 800px; margin: 0 auto; background: #fff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
  .header { background: #133255; color: #fff; padding: 20px 28px; }
  .header h1 { margin: 0 0 4px; font-size: 22px; }
  .header p { margin: 0; font-size: 13px; opacity: 0.8; }
  .month-badge { background: #D8B15B; color: #133255; padding: 4px 14px; border-radius: 4px; font-weight: 700; font-size: 13px; display: inline-block; margin-top: 10px; }
  .employee-section { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .emp-col { padding: 18px 28px; border-bottom: 1px solid #eee; }
  .emp-col:first-child { border-right: 1px solid #eee; }
  .field { margin-bottom: 8px; }
  .field label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: block; }
  .field span { font-weight: 600; font-size: 13px; }
  .attendance { padding: 14px 28px; background: #f9fafb; border-bottom: 1px solid #eee; display: flex; gap: 40px; }
  .att-item label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: block; }
  .att-item span { font-weight: 700; font-size: 16px; color: #133255; }
  table { width: 100%; border-collapse: collapse; }
  .tables-section { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .table-col { padding: 18px 28px; }
  .table-col:first-child { border-right: 1px solid #eee; }
  .table-col h3 { margin: 0 0 10px; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }
  table th { background: #f3f4f6; padding: 8px 10px; font-size: 11px; text-align: left; text-transform: uppercase; color: #374151; }
  table td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; }
  table tr:last-child td { border-bottom: none; }
  .totals-row td { font-weight: 700; background: #f9fafb; }
  .net-section { background: #133255; color: #fff; padding: 18px 28px; }
  .net-amount { font-size: 26px; font-weight: 700; color: #D8B15B; }
  .net-words { font-size: 12px; opacity: 0.8; margin-top: 4px; }
  .footer { padding: 16px 28px; border-top: 1px solid #eee; font-size: 11px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
<div class="payslip">
  <div class="header">
    <h1>Mauna Kea Executive Search</h1>
    <p>Payslip — Confidential</p>
    <div class="month-badge">${monthLabel}</div>
  </div>
  <div class="employee-section">
    <div class="emp-col">
      <div class="field"><label>Employee Name</label><span>${li.employeeName ?? '—'}</span></div>
      <div class="field"><label>Employee Code</label><span>${li.employeeCode ?? '—'}</span></div>
      <div class="field"><label>Designation</label><span>${li.designation ?? '—'}</span></div>
      <div class="field"><label>Department</label><span>${li.department ?? '—'}</span></div>
      <div class="field"><label>Date of Joining</label><span>${li.dateOfJoining ?? '—'}</span></div>
    </div>
    <div class="emp-col">
      <div class="field"><label>PAN</label><span>${li.pan ?? '—'}</span></div>
      <div class="field"><label>Bank Account</label><span>${li.bankAccount ?? '—'}</span></div>
      <div class="field"><label>Bank Name</label><span>${li.bankName ?? '—'}</span></div>
      <div class="field"><label>IFSC Code</label><span>${li.ifsc ?? '—'}</span></div>
    </div>
  </div>
  <div class="attendance">
    <div class="att-item"><label>Working Days</label><span>${li.workingDaysInMonth}</span></div>
    <div class="att-item"><label>Paid Days</label><span>${li.paidDays ?? '—'}</span></div>
    <div class="att-item"><label>LOP Days</label><span>${li.lopDays ?? 0}</span></div>
  </div>
  <div class="tables-section">
    <div class="table-col">
      <h3>Earnings</h3>
      <table>
        <tr><th>Component</th><th style="text-align:right">Amount</th></tr>
        <tr><td>Basic</td><td style="text-align:right">${formatCurrency(li.basic)}</td></tr>
        <tr><td>HRA</td><td style="text-align:right">${formatCurrency(li.hra)}</td></tr>
        <tr><td>Special Allowance</td><td style="text-align:right">${formatCurrency(li.specialAllowance)}</td></tr>
        ${otherAllowancesRows}
        <tr class="totals-row"><td>Gross Earnings</td><td style="text-align:right">${formatCurrency(li.grossEarnings)}</td></tr>
      </table>
    </div>
    <div class="table-col">
      <h3>Deductions</h3>
      <table>
        <tr><th>Component</th><th style="text-align:right">Amount</th></tr>
        <tr><td>Provident Fund (Employee)</td><td style="text-align:right">${formatCurrency(li.pfEmployee)}</td></tr>
        <tr><td>Professional Tax</td><td style="text-align:right">${formatCurrency(li.professionalTax)}</td></tr>
        <tr><td>TDS</td><td style="text-align:right">${formatCurrency(li.tds)}</td></tr>
        ${otherDeductionsRows}
        <tr class="totals-row"><td>Gross Deductions</td><td style="text-align:right">${formatCurrency(li.grossDeductions)}</td></tr>
      </table>
    </div>
  </div>
  <div class="net-section">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:12px;opacity:0.7;margin-bottom:4px;">NET PAY</div>
        <div class="net-amount">${formatCurrency(li.netPay)}</div>
        <div class="net-words">${numToWords(li.netPay ?? 0)}</div>
      </div>
      <div style="text-align:right;opacity:0.7;font-size:11px;">
        <div>Authorized Signatory</div>
        <div style="margin-top:20px;border-top:1px solid rgba(255,255,255,0.3);padding-top:6px;">Mauna Kea Executive Search</div>
      </div>
    </div>
  </div>
  <div class="footer">This is a system-generated payslip. For queries, contact hr@maunakea.co.in</div>
</div>
</body>
</html>`;
}

export async function updatePayrollEmployeeProfileAction(
  userId: string,
  data: {
    designation?: string;
    department?: string;
    employeeCode?: string;
    pan?: string;
    bankName?: string;
    bankAccountNumber?: string;
    ifscCode?: string;
    annualQuota?: number;
  }
) {
  try {
    await requireRole(['admin', 'finance']);

    const updateData: Record<string, any> = {};
    if (data.designation !== undefined) updateData.designation = data.designation;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.employeeCode !== undefined) updateData.employeeCode = data.employeeCode;
    if (data.pan !== undefined) updateData.pan = data.pan;
    if (data.bankName !== undefined) updateData.bankName = data.bankName;
    if (data.bankAccountNumber !== undefined) updateData.bankAccount = data.bankAccountNumber;
    if (data.ifscCode !== undefined) updateData.ifsc = data.ifscCode;
    if (data.annualQuota !== undefined) updateData.maxLeaves = data.annualQuota;

    await db
      .update(platformUsers)
      .set(updateData)
      .where(eq(platformUsers.id, userId));

    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, error: err.message ?? "Failed to update employee profile." };
  }
}

