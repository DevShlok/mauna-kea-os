"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getOrCreatePayrollRunAction,
  generateLeaveLopReportAction,
  processPayrollRunAction,
  approvePayrollRunAction,
  finalizeAndSendPayslipsAction,
} from "@/actions/payroll";
import type { PayrollRun } from "@/db/schema";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  Draft: { color: "#64748b", bg: "#f1f5f9", label: "Draft" },
  Processed: { color: "#d97706", bg: "#fef3c7", label: "Processed" },
  Approved: { color: "#0284c7", bg: "#e0f2fe", label: "Approved" },
  Finalized: { color: "#16a34a", bg: "#dcfce7", label: "Finalized" },
};

function formatCurrency(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function monthLabel(month: string) {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}

export function PayrollDashboard({ runs: initialRuns }: { runs: PayrollRun[] }) {
  const router = useRouter();
  const [runs, setRuns] = useState(initialRuns);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Stat cards
  const total = runs.length;
  const finalized = runs.filter(r => r.status === "Finalized").length;
  const totalPayroll = runs.filter(r => r.status === "Finalized").reduce((s, r) => s + (r.totalNetPay ?? 0), 0);
  const drafts = runs.filter(r => r.status === "Draft").length;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", padding: "28px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Payroll</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 14 }}>Manage payroll runs, CTC, and payslip dispatch</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/payroll/new")}
          style={{
            background: "linear-gradient(135deg, #133255 0%, #1e4d7b 100%)",
            color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px",
            fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 2px 8px rgba(19,50,85,0.3)",
          }}
        >
          + New Payroll Run
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Runs", value: total, color: "#133255" },
          { label: "Finalized", value: finalized, color: "#16a34a" },
          { label: "Drafts Pending", value: drafts, color: "#d97706" },
          { label: "Total Payroll Disbursed", value: formatCurrency(totalPayroll), color: "#0284c7" },
        ].map(card => (
          <div key={card.label} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Runs Table */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, fontSize: 15, color: "#0f172a" }}>
          All Payroll Runs
        </div>
        {runs.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>No payroll runs yet</div>
            <div style={{ fontSize: 14 }}>Create your first payroll run to get started.</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Month", "Employees", "Gross Earnings", "Net Pay", "Status", "Processed By", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map((run, i) => {
                const sc = STATUS_CONFIG[run.status ?? "Draft"] ?? STATUS_CONFIG.Draft;
                return (
                  <tr key={run.id} style={{ borderTop: i > 0 ? "1px solid #f1f5f9" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}>
                    <td style={{ padding: "14px 16px" }}>
                      <a href={`/dashboard/payroll/${run.id}`} style={{ fontWeight: 600, color: "#133255", textDecoration: "none", fontSize: 14 }}>
                        {monthLabel(run.month)}
                      </a>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#334155", fontSize: 14 }}>{run.totalEmployees ?? "—"}</td>
                    <td style={{ padding: "14px 16px", color: "#334155", fontSize: 14 }}>{formatCurrency(run.totalGrossEarnings)}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "#133255", fontSize: 14 }}>{formatCurrency(run.totalNetPay)}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: sc.bg, color: sc.color, borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748b", fontSize: 13 }}>{run.processedBy ?? "—"}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        onClick={() => router.push(`/dashboard/payroll/${run.id}`)}
                        style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", color: "#334155", fontWeight: 500 }}
                      >
                        Open →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, background: toast.type === "ok" ? "#16a34a" : "#dc2626",
          color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 500,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 1000, maxWidth: 360,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
