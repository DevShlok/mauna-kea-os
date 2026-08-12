"use client";

import { useState, useTransition } from "react";
import { upsertEmployeeCtcAction } from "@/actions/payroll";
import type { EmployeeCtcMaster, PlatformUser } from "@/db/schema";

type CtcRecord = {
  ctc: EmployeeCtcMaster;
  user: { id: string; name: string | null; email: string; designation: string | null; department: string | null; employeeCode: string | null };
};

function fc(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0 });
}

const EMPTY_FORM = {
  userId: "",
  effectiveDate: new Date().toISOString().split("T")[0],
  annualCtc: "",
  basicPct: "40",
  hraPct: "40",
  specialAllowancePct: "20",
  pfApplicable: true,
  pfEmployeePct: "12",
  pfEmployerPct: "12",
  professionalTaxMonthly: "200",
  tdsMonthly: "0",
};

export function CtcMasterPage({ ctcRecords, employees }: { ctcRecords: CtcRecord[]; employees: PlatformUser[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CtcRecord | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [search, setSearch] = useState("");

  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function openNewForm() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(record: CtcRecord) {
    setEditing(record);
    setForm({
      userId: record.ctc.userId,
      effectiveDate: record.ctc.effectiveDate,
      annualCtc: String(record.ctc.annualCtc),
      basicPct: String(record.ctc.basicPct),
      hraPct: String(record.ctc.hraPct),
      specialAllowancePct: String(record.ctc.specialAllowancePct),
      pfApplicable: record.ctc.pfApplicable,
      pfEmployeePct: String(record.ctc.pfEmployeePct),
      pfEmployerPct: String(record.ctc.pfEmployerPct),
      professionalTaxMonthly: String(record.ctc.professionalTaxMonthly),
      tdsMonthly: String(record.ctc.tdsMonthly),
    });
    setShowForm(true);
  }

  function pctSum() {
    return (parseFloat(form.basicPct) || 0) + (parseFloat(form.hraPct) || 0) + (parseFloat(form.specialAllowancePct) || 0);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Math.abs(pctSum() - 100) > 0.01) { showToast("Basic + HRA + Special Allowance must sum to 100%.", "err"); return; }
    startTransition(async () => {
      const res = await upsertEmployeeCtcAction({
        userId: form.userId,
        effectiveDate: form.effectiveDate,
        annualCtc: parseFloat(form.annualCtc),
        basicPct: parseFloat(form.basicPct),
        hraPct: parseFloat(form.hraPct),
        specialAllowancePct: parseFloat(form.specialAllowancePct),
        pfApplicable: form.pfApplicable,
        pfEmployeePct: parseFloat(form.pfEmployeePct),
        pfEmployerPct: parseFloat(form.pfEmployerPct),
        professionalTaxMonthly: parseFloat(form.professionalTaxMonthly),
        tdsMonthly: parseFloat(form.tdsMonthly),
      });
      if (res.success) {
        showToast(editing ? "CTC updated." : "CTC record created.");
        setShowForm(false);
        // Refresh page data
        window.location.reload();
      } else {
        showToast(res.error ?? "Failed.", "err");
      }
    });
  }

  const monthlyCtc = (parseFloat(form.annualCtc) || 0) / 12;
  const basic = monthlyCtc * (parseFloat(form.basicPct) || 0) / 100;
  const hra = monthlyCtc * (parseFloat(form.hraPct) || 0) / 100;
  const special = monthlyCtc * (parseFloat(form.specialAllowancePct) || 0) / 100;

  const filtered = ctcRecords.filter(r =>
    (r.user.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (r.user.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (r.user.department ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", padding: "28px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <a href="/dashboard/payroll" style={{ color: "#64748b", fontSize: 13, textDecoration: "none" }}>← Back to Payroll</a>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "10px 0 4px" }}>CTC Master</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>Manage employee compensation structures. Each new entry creates a versioned record.</p>
        </div>
        <button onClick={openNewForm} style={{
          background: "linear-gradient(135deg, #133255 0%, #1e4d7b 100%)",
          color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px",
          fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(19,50,85,0.3)",
        }}>
          + Set / Update CTC
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by name, email, or department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, width: 320, outline: "none" }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📑</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>No CTC records found</div>
            <div style={{ fontSize: 14, marginTop: 6 }}>Add a CTC record for your first employee.</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Employee", "Dept", "Effective Date", "Annual CTC", "Monthly Net (est.)", "PF", "PT", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, i) => {
                const mCtc = record.ctc.annualCtc / 12;
                const gross = mCtc; // approximate
                const ded = (record.ctc.pfApplicable ? Math.min(mCtc * record.ctc.basicPct / 100, 15000) * record.ctc.pfEmployeePct / 100 : 0)
                  + record.ctc.professionalTaxMonthly + record.ctc.tdsMonthly;
                const est = gross - ded;
                return (
                  <tr key={record.ctc.id} style={{ borderTop: i > 0 ? "1px solid #f1f5f9" : "none" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{record.user.name ?? record.user.email}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{record.user.email}</div>
                      {record.user.employeeCode && <div style={{ fontSize: 11, color: "#94a3b8" }}>#{record.user.employeeCode}</div>}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#64748b" }}>{record.user.department ?? "—"}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#334155" }}>{record.ctc.effectiveDate}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, fontSize: 13, color: "#133255" }}>{fc(record.ctc.annualCtc)}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#334155" }}>{fc(Math.round(est))}</td>
                    <td style={{ padding: "14px 16px", fontSize: 12 }}>
                      {record.ctc.pfApplicable
                        ? <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>✓ Yes</span>
                        : <span style={{ background: "#f1f5f9", color: "#94a3b8", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>No</span>}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "#334155" }}>{fc(record.ctc.professionalTaxMonthly)}/mo</td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => openEditForm(record)} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#334155", fontWeight: 500 }}>
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "32px", width: "100%", maxWidth: 600, boxShadow: "0 16px 48px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{editing ? "Update CTC" : "Set Employee CTC"}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8" }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Employee */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Employee</label>
                <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} required style={inputStyle}>
                  <option value="">Select employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name ?? emp.email} ({emp.email})</option>
                  ))}
                </select>
              </div>

              {/* Effective Date */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Effective Date</label>
                <input type="date" value={form.effectiveDate} onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))} required style={inputStyle} />
              </div>

              {/* Annual CTC */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Annual CTC (₹)</label>
                <input type="number" min={0} step={1000} value={form.annualCtc} onChange={e => setForm(f => ({ ...f, annualCtc: e.target.value }))} required placeholder="e.g. 1200000" style={inputStyle} />
                {form.annualCtc && <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Monthly: ₹{Math.round(parseFloat(form.annualCtc) / 12).toLocaleString("en-IN")}</p>}
              </div>

              {/* Component Percentages */}
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: "16px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Salary Components (must sum to 100%)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[
                    { key: "basicPct", label: "Basic %" },
                    { key: "hraPct", label: "HRA %" },
                    { key: "specialAllowancePct", label: "Special Allowance %" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <input type="number" min={0} max={100} step={0.5}
                        value={(form as Record<string, unknown>)[key] as string}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        style={inputStyle} />
                    </div>
                  ))}
                </div>
                {form.annualCtc && (
                  <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, fontSize: 12, color: "#64748b" }}>
                    <span>Basic/mo: <strong>₹{Math.round(basic).toLocaleString("en-IN")}</strong></span>
                    <span>HRA/mo: <strong>₹{Math.round(hra).toLocaleString("en-IN")}</strong></span>
                    <span>Special/mo: <strong>₹{Math.round(special).toLocaleString("en-IN")}</strong></span>
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: 12, color: Math.abs(pctSum() - 100) > 0.01 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                  Total: {pctSum().toFixed(1)}% {Math.abs(pctSum() - 100) > 0.01 ? "⚠ Must be 100%" : "✓"}
                </div>
              </div>

              {/* PF */}
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" id="pfApplicable" checked={form.pfApplicable} onChange={e => setForm(f => ({ ...f, pfApplicable: e.target.checked }))} />
                <label htmlFor="pfApplicable" style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>PF Applicable</label>
              </div>
              {form.pfApplicable && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Employee PF %</label>
                    <input type="number" min={0} max={25} step={0.5} value={form.pfEmployeePct} onChange={e => setForm(f => ({ ...f, pfEmployeePct: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Employer PF %</label>
                    <input type="number" min={0} max={25} step={0.5} value={form.pfEmployerPct} onChange={e => setForm(f => ({ ...f, pfEmployerPct: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
              )}

              {/* PT & TDS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                <div>
                  <label style={labelStyle}>Professional Tax (₹/month)</label>
                  <input type="number" min={0} value={form.professionalTaxMonthly} onChange={e => setForm(f => ({ ...f, professionalTaxMonthly: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>TDS (₹/month)</label>
                  <input type="number" min={0} value={form.tdsMonthly} onChange={e => setForm(f => ({ ...f, tdsMonthly: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "9px 20px", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", background: "#fff", fontSize: 13 }}>Cancel</button>
                <button type="submit" disabled={isPending} style={{ padding: "9px 20px", background: "#133255", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                  {isPending ? "Saving..." : editing ? "Update CTC" : "Create CTC Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, background: toast.type === "ok" ? "#16a34a" : "#dc2626",
          color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 500,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 9999,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" };
