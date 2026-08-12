"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateLeaveLopReportAction,
  processPayrollRunAction,
  approvePayrollRunAction,
  finalizeAndSendPayslipsAction,
  overrideLopAction,
} from "@/actions/payroll";
import type { PayrollRun, PayrollLineItem, PayrollLeaveSummary, PayrollAuditLog } from "@/db/schema";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fc(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function ml(month: string) {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}

const STATUS_STEPS = ["Draft", "Processed", "Approved", "Finalized"];
const STATUS_COLOR: Record<string, string> = {
  Draft: "#64748b",
  Processed: "#d97706",
  Approved: "#0284c7",
  Finalized: "#16a34a",
};

type Props = {
  run: PayrollRun;
  lineItems: PayrollLineItem[];
  leaveSummary: PayrollLeaveSummary[];
  auditLog: PayrollAuditLog[];
};

// ─── Payroll Run Detail ────────────────────────────────────────────────────────

export function PayrollRunDetail({ run: initialRun, lineItems: initialItems, leaveSummary: initialLeave, auditLog: initialLog }: Props) {
  const router = useRouter();
  const [run, setRun] = useState(initialRun);
  const [lineItems, setLineItems] = useState(initialItems);
  const [leaveSummary, setLeaveSummary] = useState(initialLeave);
  const [auditLog, setAuditLog] = useState(initialLog);
  const [activeTab, setActiveTab] = useState<"overview" | "lines" | "leave" | "log">("overview");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [lopModal, setLopModal] = useState<{ userId: string; name: string; current: number } | null>(null);
  const [lopDays, setLopDays] = useState("");
  const [lopNote, setLopNote] = useState("");
  const [approvalModal, setApprovalModal] = useState(false);
  const [finalizeModal, setFinalizeModal] = useState(false);

  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function refreshFromServer() {
    const { getPayrollRunDetailAction } = await import("@/actions/payroll");
    const res = await getPayrollRunDetailAction(run.id);
    if (res.success) {
      setRun(res.run);
      setLineItems(res.lineItems);
      setLeaveSummary(res.leaveSummary);
      setAuditLog(res.auditLog);
    }
  }

  function handleGenerateLeave() {
    startTransition(async () => {
      const res = await generateLeaveLopReportAction(run.id);
      if (res.success) {
        showToast(`Leave & LOP report generated for ${res.count} employees.`);
        await refreshFromServer();
      } else {
        showToast(res.error ?? "Failed to generate leave report.", "err");
      }
    });
  }

  function handleProcess() {
    startTransition(async () => {
      const res = await processPayrollRunAction(run.id);
      if (res.success) {
        showToast(`Payroll processed for ${res.count} employees. Total net: ${fc(res.totalNet)}`);
        await refreshFromServer();
      } else {
        showToast(res.error ?? "Processing failed.", "err");
      }
    });
  }

  function handleApprove(notes: string) {
    startTransition(async () => {
      const res = await approvePayrollRunAction(run.id, notes);
      if (res.success) {
        showToast("Payroll run approved.");
        setApprovalModal(false);
        await refreshFromServer();
      } else {
        showToast(res.error ?? "Approval failed.", "err");
      }
    });
  }

  function handleFinalize() {
    startTransition(async () => {
      const res = await finalizeAndSendPayslipsAction(run.id);
      if (res.success) {
        showToast(`Finalized. Payslips sent: ${res.sent}/${res.total}.`);
        setFinalizeModal(false);
        await refreshFromServer();
      } else {
        showToast(res.error ?? "Finalization failed.", "err");
      }
    });
  }

  function handleLopOverride() {
    if (!lopModal) return;
    const days = parseInt(lopDays, 10);
    if (isNaN(days) || days < 0) { showToast("Invalid LOP days.", "err"); return; }
    startTransition(async () => {
      const res = await overrideLopAction(run.id, lopModal.userId, days, lopNote);
      if (res.success) {
        showToast("LOP override saved.");
        setLopModal(null); setLopDays(""); setLopNote("");
        await refreshFromServer();
      } else {
        showToast(res.error ?? "Override failed.", "err");
      }
    });
  }

  const statusIdx = STATUS_STEPS.indexOf(run.status ?? "Draft");

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", padding: "28px", maxWidth: 1280, margin: "0 auto" }}>
      {/* Back + Header */}
      <div style={{ marginBottom: 24 }}>
        <a href="/dashboard/payroll" style={{ color: "#64748b", fontSize: 13, textDecoration: "none" }}>← All Payroll Runs</a>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>{ml(run.month)}</h1>
            <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
              Run #{run.id} · Created {run.createdAt ? new Date(run.createdAt).toLocaleDateString("en-IN") : "—"}
            </p>
          </div>
          <span style={{
            background: STATUS_COLOR[run.status ?? "Draft"] + "1a",
            color: STATUS_COLOR[run.status ?? "Draft"],
            border: `1px solid ${STATUS_COLOR[run.status ?? "Draft"]}44`,
            borderRadius: 8, padding: "6px 16px", fontWeight: 700, fontSize: 13,
          }}>
            {run.status ?? "Draft"}
          </span>
        </div>
      </div>

      {/* Progress Stepper */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 28px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {STATUS_STEPS.map((step, i) => {
            const done = i < statusIdx;
            const active = i === statusIdx;
            const color = done ? "#16a34a" : active ? STATUS_COLOR[step] : "#cbd5e1";
            return (
              <div key={step} style={{ display: "flex", alignItems: "center", flex: i < STATUS_STEPS.length - 1 ? 1 : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: done ? "#16a34a" : active ? STATUS_COLOR[step] : "#f1f5f9",
                    color: done || active ? "#fff" : "#94a3b8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, border: `2px solid ${color}`,
                  }}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color, whiteSpace: "nowrap" }}>{step}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: done ? "#16a34a" : "#e2e8f0", margin: "0 8px", marginBottom: 22 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Employees", value: run.totalEmployees ?? lineItems.length },
          { label: "Gross Earnings", value: fc(run.totalGrossEarnings) },
          { label: "Net Pay", value: fc(run.totalNetPay), bold: true },
          { label: "Processed By", value: run.processedBy ?? "—" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: s.bold ? 700 : 600, color: s.bold ? "#133255" : "#334155" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {run.status === "Draft" && (
          <>
            <ActionButton onClick={handleGenerateLeave} disabled={isPending} color="#0284c7">
              📋 Generate Leave & LOP Report
            </ActionButton>
            <ActionButton onClick={handleProcess} disabled={isPending || leaveSummary.length === 0} color="#d97706">
              ⚙️ Process Payroll
            </ActionButton>
          </>
        )}
        {run.status === "Processed" && (
          <ActionButton onClick={() => setApprovalModal(true)} disabled={isPending} color="#16a34a">
            ✅ Approve Run
          </ActionButton>
        )}
        {run.status === "Approved" && (
          <ActionButton onClick={() => setFinalizeModal(true)} disabled={isPending} color="#133255">
            📧 Finalize & Send Payslips
          </ActionButton>
        )}
        {isPending && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}>
            <div style={{ width: 16, height: 16, border: "2px solid #94a3b8", borderTopColor: "#133255", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            Processing...
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "2px solid #f1f5f9", display: "flex", gap: 0, marginBottom: 24 }}>
        {(["overview", "lines", "leave", "log"] as const).map(tab => {
          const labels = { overview: "Overview", lines: `Line Items (${lineItems.length})`, leave: `Leave & LOP (${leaveSummary.length})`, log: `Audit Log (${auditLog.length})` };
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "10px 20px", fontSize: 13, fontWeight: 600, border: "none", background: "none",
              cursor: "pointer", borderBottom: activeTab === tab ? "2px solid #133255" : "2px solid transparent",
              color: activeTab === tab ? "#133255" : "#64748b", marginBottom: -2, transition: "all 0.15s",
            }}>
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 40px" }}>
            {[
              { label: "Month", value: ml(run.month) },
              { label: "Status", value: run.status },
              { label: "Total Employees", value: run.totalEmployees ?? "—" },
              { label: "Total Gross Earnings", value: fc(run.totalGrossEarnings) },
              { label: "Total Net Pay", value: fc(run.totalNetPay) },
              { label: "Processed By", value: run.processedBy ?? "—" },
              { label: "Processed At", value: run.processedAt ? new Date(run.processedAt).toLocaleString("en-IN") : "—" },
              { label: "Approved By", value: run.approvedBy ?? "—" },
              { label: "Approved At", value: run.approvedAt ? new Date(run.approvedAt).toLocaleString("en-IN") : "—" },
              { label: "Finalized By", value: run.finalizedBy ?? "—" },
              { label: "Notes", value: run.notes ?? "—" },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 500 }}>{f.value ?? "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "lines" && (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {lineItems.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
              No line items yet. Process the payroll run to generate them.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Employee", "Code", "Dept", "Paid Days", "LOP", "Basic", "HRA", "Gross", "PF+PT+TDS", "Net Pay", ""].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, i) => (
                    <tr key={li.id} style={{ borderTop: i > 0 ? "1px solid #f1f5f9" : "none" }}>
                      <td style={{ padding: "12px 12px" }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{li.employeeName}</div>
                        {li.designation && <div style={{ fontSize: 11, color: "#94a3b8" }}>{li.designation}</div>}
                      </td>
                      <td style={{ padding: "12px 12px", fontSize: 12, color: "#64748b" }}>{li.employeeCode ?? "—"}</td>
                      <td style={{ padding: "12px 12px", fontSize: 12, color: "#64748b" }}>{li.department ?? "—"}</td>
                      <td style={{ padding: "12px 12px", fontSize: 13, fontWeight: 500, color: "#334155" }}>{li.paidDays ?? "—"}/{li.workingDaysInMonth}</td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{ color: (li.lopDays ?? 0) > 0 ? "#dc2626" : "#94a3b8", fontWeight: (li.lopDays ?? 0) > 0 ? 700 : 400, fontSize: 13 }}>
                          {li.lopDays ?? 0}
                        </span>
                        {["Draft", "Processed"].includes(run.status ?? "") && (
                          <button
                            onClick={() => { setLopModal({ userId: li.userId, name: li.employeeName ?? "", current: li.lopDays ?? 0 }); setLopDays(String(li.lopDays ?? 0)); }}
                            style={{ marginLeft: 6, fontSize: 10, color: "#0284c7", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                          >edit</button>
                        )}
                      </td>
                      <td style={{ padding: "12px 12px", fontSize: 12, color: "#334155" }}>{fc(li.basic)}</td>
                      <td style={{ padding: "12px 12px", fontSize: 12, color: "#334155" }}>{fc(li.hra)}</td>
                      <td style={{ padding: "12px 12px", fontSize: 12, color: "#334155" }}>{fc(li.grossEarnings)}</td>
                      <td style={{ padding: "12px 12px", fontSize: 12, color: "#dc2626" }}>{fc((li.pfEmployee ?? 0) + (li.professionalTax ?? 0) + (li.tds ?? 0))}</td>
                      <td style={{ padding: "12px 12px", fontWeight: 700, fontSize: 13, color: "#133255" }}>{fc(li.netPay)}</td>
                      <td style={{ padding: "12px 12px" }}>
                        {li.adjustmentNote && (
                          <span title={li.adjustmentNote} style={{ fontSize: 10, background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "2px 6px" }}>override</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "leave" && (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {leaveSummary.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
              No leave data yet. Click "Generate Leave & LOP Report" first.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["User ID", "Annual Quota", "YTD Leaves", "This Month", "Balance", "LOP Days", "Flagged"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaveSummary.map((ls, i) => (
                  <tr key={ls.id} style={{ borderTop: i > 0 ? "1px solid #f1f5f9" : "none" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#334155" }}>{ls.userId}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{ls.annualQuota}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{ls.leavesTakenYtd}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{ls.leavesTakenThisMonth}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{ls.balanceRemaining}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: (ls.lopDays ?? 0) > 0 ? "#dc2626" : "#16a34a", fontWeight: 700, fontSize: 13 }}>
                        {ls.lopDays ?? 0}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {ls.flagged ? (
                        <span style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>⚠ Over limit</span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "log" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "8px 0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
          {auditLog.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>No audit entries yet.</div>
          ) : (
            auditLog.map((entry, i) => (
              <div key={entry.id} style={{ padding: "14px 24px", borderBottom: i < auditLog.length - 1 ? "1px solid #f1f5f9" : "none", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#133255", marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{entry.action?.replace(/_/g, " ")}</div>
                  {entry.notes && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{entry.notes}</div>}
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    {entry.actorName} · {entry.performedAt ? new Date(entry.performedAt).toLocaleString("en-IN") : "—"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* LOP Override Modal */}
      {lopModal && (
        <Modal title={`Override LOP — ${lopModal.name}`} onClose={() => setLopModal(null)}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>LOP Days</label>
            <input type="number" min={0} value={lopDays} onChange={e => setLopDays(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Reason</label>
            <textarea value={lopNote} onChange={e => setLopNote(e.target.value)} rows={3}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setLopModal(null)} style={{ padding: "8px 18px", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", background: "#fff", fontSize: 13 }}>Cancel</button>
            <button onClick={handleLopOverride} disabled={isPending}
              style={{ padding: "8px 18px", background: "#133255", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              Save Override
            </button>
          </div>
        </Modal>
      )}

      {/* Approval Modal */}
      {approvalModal && (
        <ApprovalModal
          onClose={() => setApprovalModal(false)}
          onApprove={handleApprove}
          isPending={isPending}
          totalNet={run.totalNetPay ?? 0}
          employees={run.totalEmployees ?? lineItems.length}
          month={ml(run.month)}
        />
      )}

      {/* Finalize Modal */}
      {finalizeModal && (
        <Modal title="Finalize & Send Payslips" onClose={() => setFinalizeModal(false)}>
          <div style={{ background: "#fef3c7", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#92400e" }}>
            <strong>⚠️ Irreversible action.</strong> This will mark the run as Finalized and email payslips to all {lineItems.length} employees. Ensure the run has been approved by the relevant authority.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setFinalizeModal(false)} style={{ padding: "8px 18px", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", background: "#fff", fontSize: 13 }}>Cancel</button>
            <button onClick={handleFinalize} disabled={isPending}
              style={{ padding: "8px 18px", background: "#133255", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              {isPending ? "Sending..." : "Confirm & Send Payslips"}
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, background: toast.type === "ok" ? "#16a34a" : "#dc2626",
          color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 500,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 9999, maxWidth: 400,
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function ActionButton({ children, onClick, disabled, color }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; color: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#e2e8f0" : color, color: disabled ? "#94a3b8" : "#fff",
        border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13,
        fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : `0 2px 8px ${color}44`,
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "28px", width: "100%", maxWidth: 460, boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ApprovalModal({ onClose, onApprove, isPending, totalNet, employees, month }: {
  onClose: () => void; onApprove: (notes: string) => void; isPending: boolean;
  totalNet: number; employees: number; month: string;
}) {
  const [notes, setNotes] = useState("");
  return (
    <Modal title="Approve Payroll Run" onClose={onClose}>
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#15803d", fontWeight: 600, marginBottom: 4 }}>Run Summary</div>
        <div style={{ fontSize: 13, color: "#166534" }}>Month: <strong>{month}</strong></div>
        <div style={{ fontSize: 13, color: "#166534" }}>Employees: <strong>{employees}</strong></div>
        <div style={{ fontSize: 13, color: "#166534" }}>Total Net Pay: <strong>₹{totalNet.toLocaleString("en-IN")}</strong></div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Approval Notes (optional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="Any notes for the record..."
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "8px 18px", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", background: "#fff", fontSize: 13 }}>Cancel</button>
        <button onClick={() => onApprove(notes)} disabled={isPending}
          style={{ padding: "8px 18px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          {isPending ? "Approving..." : "Approve Run ✓"}
        </button>
      </div>
    </Modal>
  );
}
