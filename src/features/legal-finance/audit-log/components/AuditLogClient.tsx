"use client";

import { useState } from "react";
import { ShieldCheck, Search, FileText, User, Tag, Clock } from "lucide-react";

interface AuditRow {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  actorName: string;
  actorRole: string | null;
  timestamp: string;
  previousValue: any;
  newValue: any;
  changeReason: string | null;
}

export default function AuditLogClient({
  initialData,
}: {
  initialData: {
    rows: AuditRow[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
}) {
  const [selectedEntity, setSelectedEntity] = useState("All");

  const filteredRows = selectedEntity !== "All"
    ? initialData.rows.filter((r) => r.entityType === selectedEntity)
    : initialData.rows;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
            Legal & Finance Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Immutable log of all contract, invoice, payment, and commercial term modifications
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-2">
        {["All", "contract", "invoice", "payment", "client"].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedEntity(type)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
              selectedEntity === type
                ? "bg-[#133255] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Entity ID</th>
                <th className="py-3.5 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-medium text-slate-600">No audit log entries recorded</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td suppressHydrationWarning className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      {new Date(log.timestamp).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 capitalize">
                      {log.action.replace("_", " ")}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {log.actorName} <span className="text-slate-400 text-[10px]">({log.actorRole || "user"})</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#133255]">{log.entityId}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {log.changeReason || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
