"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus, Search, FileText, Download, Upload, CheckCircle2, AlertTriangle, Clock, Eye, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { deleteContractAction } from "@/actions/legal-finance";

interface ContractRow {
  contract: {
    id: string;
    contractNumber: string;
    clientId: string;
    contractStartDate: string;
    contractEndDate: string;
    renewalType: string;
    status: string;
    commercialStructure: string | null;
    successFeePct: number | null;
    approvalStatus: string;
    signedDocUrl: string | null;
    consultant: string | null;
    createdAt: string;
  };
  clientName: string | null;
}

export default function ContractsClient({
  initialData,
}: {
  initialData: {
    rows: ContractRow[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [activeTab, setActiveTab] = useState(searchParams.get("status") || "All");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Sync URL search params
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) params.set("search", debouncedSearch);
    else params.delete("search");

    if (activeTab && activeTab !== "All") params.set("status", activeTab);
    else params.delete("status");

    params.set("page", "1");
    router.push(`/dashboard/legal-finance/contracts?${params.toString()}`);
  }, [debouncedSearch, activeTab]);

  const handleDelete = async (id: string, number: string) => {
    const reason = prompt(`Reason for deleting contract ${number}?`);
    if (!reason) return;

    try {
      await deleteContractAction(id, reason);
      toast.success(`Contract ${number} deleted.`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete contract");
    }
  };

  const getStatusBadge = (status: string, endDateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    const daysLeft = Math.floor(
      (new Date(endDateStr).getTime() - new Date(today).getTime()) / 86400000
    );

    if (status === "Signed" && daysLeft <= 30 && daysLeft >= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3" /> Expiring ({daysLeft}d)
        </span>
      );
    }

    switch (status) {
      case "Signed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Signed
          </span>
        );
      case "Draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 border border-slate-500/20">
            <Clock className="w-3 h-3" /> Draft
          </span>
        );
      case "Shared":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <FileText className="w-3 h-3" /> Shared
          </span>
        );
      case "Expired":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            Expired
          </span>
        );
      case "Renewed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
            Renewed
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  const getApprovalBadge = (approvalStatus: string) => {
    switch (approvalStatus) {
      case "Approved":
        return <span className="text-xs font-medium text-emerald-600">Approved</span>;
      case "Rejected":
        return <span className="text-xs font-medium text-rose-600">Rejected</span>;
      default:
        return <span className="text-xs font-medium text-amber-600">Pending Approval</span>;
    }
  };

  const tabs = ["All", "Signed", "Draft", "Shared", "Expiring", "Expired", "Renewed"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
            Contract Repository
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage legal agreements, commercial terms, and client contracts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const exportData = initialData.rows.map(({ contract, clientName }) => ({
                "Contract Number": contract.contractNumber,
                "Client Name": clientName || "N/A",
                "Start Date": contract.contractStartDate,
                "End Date": contract.contractEndDate,
                "Success Fee %": contract.successFeePct || "N/A",
                "Structure": contract.commercialStructure || "SuccessFee",
                "Renewal Type": contract.renewalType,
                "Status": contract.status,
                "Approval Status": contract.approvalStatus,
                "Consultant": contract.consultant || "N/A",
              }));
              import("@/lib/export-excel").then((mod) =>
                mod.exportToExcel(exportData, `Contracts_Export_${new Date().toISOString().split("T")[0]}`)
              );
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Export Excel
          </button>
          <Link
            href="/dashboard/legal-finance/contracts/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-md transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #133255 0%, #1e40af 100%)",
            }}
          >
            <Plus className="w-4 h-4" />
            Create Contract
          </Link>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-[#133255] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contract no., client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#133255]/20 focus:border-[#133255] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Contract No.</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Commercials</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Approval</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {initialData.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-medium text-slate-600">No contracts found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || activeTab !== "All"
                        ? "Try resetting your search filters."
                        : "Click 'Create Contract' to get started."}
                    </p>
                  </td>
                </tr>
              ) : (
                initialData.rows.map(({ contract, clientName }) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-[#133255]">
                      <Link
                        href={`/dashboard/legal-finance/contracts/${contract.id}`}
                        className="hover:underline"
                      >
                        {contract.contractNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {clientName || "Unknown Client"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {contract.contractStartDate} → {contract.contractEndDate}
                    </td>
                    <td className="py-3.5 px-4">
                      {contract.successFeePct ? (
                        <span className="font-semibold text-slate-900">
                          {contract.successFeePct}% Fee
                        </span>
                      ) : (
                        <span className="text-slate-400">Retainer/Custom</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(contract.status, contract.contractEndDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getApprovalBadge(contract.approvalStatus)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/legal-finance/contracts/${contract.id}`}
                          className="p-1.5 text-slate-500 hover:text-[#133255] hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {contract.signedDocUrl && (
                          <a
                            href={contract.signedDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Download Signed Copy"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(contract.id, contract.contractNumber)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        {initialData.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page {initialData.currentPage} of {initialData.totalPages} ({initialData.totalCount} total)
            </div>
            <div className="flex gap-2">
              <button
                disabled={initialData.currentPage <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", String(initialData.currentPage - 1));
                  router.push(`/dashboard/legal-finance/contracts?${params.toString()}`);
                }}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={initialData.currentPage >= initialData.totalPages}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", String(initialData.currentPage + 1));
                  router.push(`/dashboard/legal-finance/contracts?${params.toString()}`);
                }}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
