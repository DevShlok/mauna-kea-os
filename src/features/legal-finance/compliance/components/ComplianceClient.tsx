"use client";

import Link from "next/link";
import { ShieldAlert, AlertTriangle, CheckCircle2, FileX, Clock, Building2, ExternalLink } from "lucide-react";

interface ComplianceProps {
  stats: {
    missingContractsCount: number;
    missingContractsList: any[];
    expiredContractsCount: number;
    expiredContractsList: any[];
    missingGstCount: number;
    missingGstList: any[];
    overdueInvoicesCount: number;
    overdueInvoicesList: any[];
    pendingApprovalsCount: number;
    pendingApprovalsList: any[];
  };
}

export default function ComplianceClient({ stats }: ComplianceProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
          Compliance & Risk Control Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Real-time red flag monitoring for uncontracted mandates, expired terms, and billing gaps
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Missing Signed Contracts */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-rose-600">
            <FileX className="w-5 h-5" />
            <span className="text-2xl font-bold font-serif">{stats.missingContractsCount}</span>
          </div>
          <p className="text-xs font-bold text-slate-900">Clients Without Signed Contract</p>
          <p className="text-[11px] text-slate-500">Active mandates in last 12 mo without signed agreement</p>
        </div>

        {/* Card 2: Expired Contracts */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-amber-600">
            <Clock className="w-5 h-5" />
            <span className="text-2xl font-bold font-serif">{stats.expiredContractsCount}</span>
          </div>
          <p className="text-xs font-bold text-slate-900">Expired Contracts</p>
          <p className="text-[11px] text-slate-500">Contracts past end date requiring immediate renewal</p>
        </div>

        {/* Card 3: Missing GST Details */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-blue-600">
            <Building2 className="w-5 h-5" />
            <span className="text-2xl font-bold font-serif">{stats.missingGstCount}</span>
          </div>
          <p className="text-xs font-bold text-slate-900">Clients Missing GST</p>
          <p className="text-[11px] text-slate-500">Clients without valid GSTIN for tax invoice generation</p>
        </div>

        {/* Card 4: Overdue Collections */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-2xl font-bold font-serif">{stats.overdueInvoicesCount}</span>
          </div>
          <p className="text-xs font-bold text-slate-900">Overdue Collections</p>
          <p className="text-[11px] text-slate-500">Invoices past payment terms requiring follow up</p>
        </div>
      </div>

      {/* Drill-down Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uncontracted Clients Table */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
            <span>Clients Missing Signed Agreement ({stats.missingContractsCount})</span>
          </h2>
          {stats.missingContractsList.length === 0 ? (
            <p className="text-xs text-emerald-600 font-semibold py-4">All active clients have signed contracts!</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {stats.missingContractsList.map((c: any) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{c.name}</span>
                  <Link
                    href={`/dashboard/legal-finance/contracts/new?clientId=${c.id}`}
                    className="text-[11px] font-semibold text-[#133255] hover:underline flex items-center gap-1"
                  >
                    Draft Agreement <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expired Contracts Table */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
            <span>Expired Contracts Pending Renewal ({stats.expiredContractsCount})</span>
          </h2>
          {stats.expiredContractsList.length === 0 ? (
            <p className="text-xs text-emerald-600 font-semibold py-4">No contracts currently expired.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {stats.expiredContractsList.map((con: any) => (
                <div key={con.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block">{con.contractNumber}</span>
                    <span className="text-[10px] text-slate-500">Expired on {con.contractEndDate}</span>
                  </div>
                  <Link
                    href={`/dashboard/legal-finance/contracts/${con.id}`}
                    className="text-[11px] font-semibold text-purple-700 hover:underline flex items-center gap-1"
                  >
                    Renew Contract <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
