"use client";

import { useState, useTransition } from "react";
import { updatePayrollEmployeeProfileAction } from "@/actions/payroll";
import type { PlatformUser } from "@/db/schema";

type EmployeeWithProfile = PlatformUser & {
  designation?: string | null;
  department?: string | null;
  employeeCode?: string | null;
  pan?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  ifscCode?: string | null;
  annualQuota?: number | null;
};

export function EmployeeProfilesPage({ employees: initialEmployees }: { employees: PlatformUser[] }) {
  const [employees, setEmployees] = useState<EmployeeWithProfile[]>(initialEmployees);
  const [editingUser, setEditingUser] = useState<EmployeeWithProfile | null>(null);
  const [form, setForm] = useState({
    designation: "",
    department: "",
    employeeCode: "",
    pan: "",
    bankName: "",
    bankAccountNumber: "",
    ifscCode: "",
    annualQuota: "24",
  });
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [search, setSearch] = useState("");

  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function openEditModal(emp: EmployeeWithProfile) {
    setEditingUser(emp);
    setForm({
      designation: emp.designation ?? "",
      department: emp.department ?? "",
      employeeCode: emp.employeeCode ?? "",
      pan: emp.pan ?? "",
      bankName: emp.bankName ?? "",
      bankAccountNumber: emp.bankAccountNumber ?? "",
      ifscCode: emp.ifscCode ?? "",
      annualQuota: String(emp.annualQuota ?? 24),
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    startTransition(async () => {
      const res = await updatePayrollEmployeeProfileAction(editingUser.id, {
        designation: form.designation || undefined,
        department: form.department || undefined,
        employeeCode: form.employeeCode || undefined,
        pan: form.pan || undefined,
        bankName: form.bankName || undefined,
        bankAccountNumber: form.bankAccountNumber || undefined,
        ifscCode: form.ifscCode || undefined,
        annualQuota: form.annualQuota ? parseInt(form.annualQuota, 10) : undefined,
      });

      if (res.success) {
        showToast("Employee profile updated successfully.");
        setEmployees(prev =>
          prev.map(emp =>
            emp.id === editingUser.id
              ? {
                  ...emp,
                  designation: form.designation,
                  department: form.department,
                  employeeCode: form.employeeCode,
                  pan: form.pan,
                  bankName: form.bankName,
                  bankAccountNumber: form.bankAccountNumber,
                  ifscCode: form.ifscCode,
                  annualQuota: parseInt(form.annualQuota, 10),
                }
              : emp
          )
        );
        setEditingUser(null);
      } else {
        showToast(res.error ?? "Failed to update profile.", "err");
      }
    });
  }

  const filtered = employees.filter(
    e =>
      (e.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.department ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.designation ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", padding: "28px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <a href="/dashboard/payroll" style={{ color: "#64748b", fontSize: 13, textDecoration: "none" }}>
            ← Back to Payroll
          </a>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "10px 0 4px" }}>Employee Profiles</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>
            Manage employee HR data, PAN, bank details, designation, and annual leave quotas for payroll processing.
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search employees by name, email, designation..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, width: 340, outline: "none" }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>No employees found</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Employee", "Role & Code", "Dept & Designation", "PAN & Bank", "Annual Leave Quota", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <tr key={emp.id} style={{ borderTop: i > 0 ? "1px solid #f1f5f9" : "none" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{emp.name ?? "Unnamed"}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{emp.email}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: "#e0f2fe", color: "#0369a1", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                      {emp.role}
                    </span>
                    {emp.employeeCode && <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>ID: {emp.employeeCode}</div>}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{emp.designation ?? "—"}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{emp.department ?? "—"}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 12, color: "#334155" }}>PAN: {emp.pan || "—"}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {emp.bankName ? `${emp.bankName} (${emp.bankAccountNumber ? "..." + emp.bankAccountNumber.slice(-4) : "—"})` : "Bank details pending"}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "#0284c7" }}>
                    {emp.annualQuota ?? 24} days/yr
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      onClick={() => openEditModal(emp)}
                      style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#334155", fontWeight: 500 }}
                    >
                      Edit HR Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editingUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "32px", width: "100%", maxWidth: 540, boxShadow: "0 16px 48px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Edit HR Profile</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{editingUser.name} ({editingUser.email})</p>
              </div>
              <button onClick={() => setEditingUser(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8" }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Designation</label>
                  <input type="text" placeholder="e.g. Senior Partner" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <input type="text" placeholder="e.g. Executive Search" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Employee Code / ID</label>
                  <input type="text" placeholder="e.g. MK-007" value={form.employeeCode} onChange={e => setForm(f => ({ ...f, employeeCode: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>PAN Number</label>
                  <input type="text" placeholder="e.g. ABCDE1234F" value={form.pan} onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))} style={inputStyle} />
                </div>
              </div>

              <div style={{ background: "#f8fafc", borderRadius: 10, padding: "16px", marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Bank Details</div>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Bank Name</label>
                  <input type="text" placeholder="e.g. HDFC Bank" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Account Number</label>
                    <input type="text" placeholder="Account No" value={form.bankAccountNumber} onChange={e => setForm(f => ({ ...f, bankAccountNumber: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>IFSC Code</label>
                    <input type="text" placeholder="e.g. HDFC0001234" value={form.ifscCode} onChange={e => setForm(f => ({ ...f, ifscCode: e.target.value.toUpperCase() }))} style={inputStyle} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Annual Leave Quota (days)</label>
                <input type="number" min={0} max={365} value={form.annualQuota} onChange={e => setForm(f => ({ ...f, annualQuota: e.target.value }))} style={inputStyle} />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setEditingUser(null)} style={{ padding: "9px 20px", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", background: "#fff", fontSize: 13 }}>
                  Cancel
                </button>
                <button type="submit" disabled={isPending} style={{ padding: "9px 20px", background: "#133255", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                  {isPending ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.type === "ok" ? "#16a34a" : "#dc2626", color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 9999 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" };
