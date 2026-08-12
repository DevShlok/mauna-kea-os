"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getOrCreatePayrollRunAction } from "@/actions/payroll";

export function NewPayrollRunForm() {
  const router = useRouter();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await getOrCreatePayrollRunAction(month);
      if (result.success) {
        router.push(`/dashboard/payroll/${result.run.id}`);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  const monthLabel = new Date(Number(month.split("-")[0]), Number(month.split("-")[1]) - 1, 1)
    .toLocaleString("en-IN", { month: "long", year: "numeric" });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", padding: "28px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <a href="/dashboard/payroll" style={{ color: "#64748b", fontSize: 13, textDecoration: "none" }}>← Back to Payroll</a>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "12px 0 4px" }}>Start New Payroll Run</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
          Select the payroll month. If a run already exists for this month, it will be opened instead of creating a duplicate.
        </p>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, padding: "32px", boxShadow: "0 1px 8px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Payroll Month
            </label>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db",
                fontSize: 15, color: "#0f172a", outline: "none", boxSizing: "border-box",
              }}
            />
            {month && (
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
                → Will process payroll for <strong>{monthLabel}</strong>
              </p>
            )}
          </div>

          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#1d4ed8" }}>
            <strong>Note:</strong> After creating the run, you can generate the Leave &amp; LOP report, then process, approve, and finally send payslips — all from the run detail page.
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            style={{
              width: "100%", background: isPending ? "#93c5fd" : "linear-gradient(135deg, #133255 0%, #1e4d7b 100%)",
              color: "#fff", border: "none", borderRadius: 8, padding: "12px",
              fontSize: 15, fontWeight: 600, cursor: isPending ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(19,50,85,0.25)",
            }}
          >
            {isPending ? "Creating..." : "Create Payroll Run →"}
          </button>
        </form>
      </div>
    </div>
  );
}
