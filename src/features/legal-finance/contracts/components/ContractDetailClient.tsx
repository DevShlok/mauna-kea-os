"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Shield,
  Building2,
  DollarSign,
  UserCheck,
  Trash2,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  approveContractAction,
  uploadSignedContractAction,
  renewContractAction,
  deleteContractAction,
} from "@/actions/legal-finance";
import EmailDraftModal from "@/features/legal-finance/components/EmailDraftModal";

interface ContractDetailProps {
  contract: {
    id: string;
    contractNumber: string;
    clientId: string;
    clientName: string | null;
    clientSnapshot: any;
    consultant: string | null;
    businessHead: string | null;
    practice: string | null;
    contractStartDate: string;
    contractEndDate: string;
    renewalType: string;
    status: string;
    commercialStructure: string | null;
    successFeePct: number | null;
    replacementPeriod: number | null;
    guaranteePeriod: number | null;
    paymentTerms: string | null;
    currency: string | null;
    exclusivity: boolean | null;
    nonPoachingMonths: number | null;
    confidentiality: boolean | null;
    latePaymentClause?: string | null;
    travelExpenses?: string | null;
    signedDocUrl: string | null;
    approvalStatus: string;
    approvedBy: string | null;
    approvedAt: string | null;
    version: number;
    notes: string | null;
    createdBy: string | null;
    createdAt: string;
    documents: any[];
  };
}

export default function ContractDetailClient({ contract }: ContractDetailProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [signedUrlInput, setSignedUrlInput] = useState("");
  const [isEmailDraftOpen, setIsEmailDraftOpen] = useState(false);

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");

  const handleOpenApprovalModal = () => {
    setHasScrolledToBottom(false);
    setShowApprovalModal(true);
  };

  const handleConfirmApprove = async (approved: boolean) => {
    try {
      await approveContractAction(contract.id, approved, approvalNotes || undefined);
      toast.success(`Contract ${approved ? "approved" : "rejected"}.`);
      setShowApprovalModal(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
  };

  const handleUploadSigned = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedUrlInput.trim()) {
      toast.error("Please enter a valid document URL.");
      return;
    }

    setIsUploading(true);
    try {
      await uploadSignedContractAction(
        contract.id,
        signedUrlInput,
        `Signed-${contract.contractNumber}.pdf`
      );
      toast.success("Signed contract copy saved successfully!");
      setSignedUrlInput("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRenew = async () => {
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() + 1);
    const newEnd = prompt(
      "Enter new end date for contract renewal (YYYY-MM-DD):",
      defaultDate.toISOString().split("T")[0]
    );

    if (!newEnd) return;

    try {
      const res = await renewContractAction(contract.id, newEnd);
      toast.success(`Contract renewed into new version ${res.contractNumber}!`);
      router.push(`/dashboard/legal-finance/contracts/${res.id}`);
    } catch (err: any) {
      toast.error(err.message || "Renewal failed.");
    }
  };

  const handleDelete = async () => {
    const reason = prompt(`Reason for deleting contract ${contract.contractNumber}?`);
    if (!reason) return;

    try {
      await deleteContractAction(contract.id, reason);
      toast.success("Contract deleted.");
      router.push("/dashboard/legal-finance/contracts");
    } catch (err: any) {
      toast.error(err.message || "Delete failed.");
    }
  };

  // ─── Expiry alert computation ────────────────────────────────────────────────
  const today = new Date();
  const endDate = new Date(contract.contractEndDate);
  const daysToExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysToExpiry < 0;
  const isExpiringSoon = !isExpired && daysToExpiry <= 60;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/legal-finance/contracts"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
                {contract.contractNumber}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                v{contract.version}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: <strong className="text-slate-800">{contract.clientName || "Unknown"}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {contract.signedDocUrl && (
            <a
              href={contract.signedDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download Signed PDF
            </a>
          )}
          <button
            onClick={() => setIsEmailDraftOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-100 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" /> Draft Email
          </button>
          {contract.status === "Signed" && (
            <button
              onClick={handleRenew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Renew Contract
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Expiry Warning Banner ─────────────────────────────────────── */}
      {(isExpired || isExpiringSoon) && (
        <div className={`flex items-start gap-3 p-4 rounded-2xl border text-sm ${
          isExpired
            ? "bg-rose-50 border-rose-200 text-rose-800"
            : daysToExpiry <= 30
            ? "bg-amber-50 border-amber-300 text-amber-900"
            : "bg-yellow-50 border-yellow-200 text-yellow-800"
        }`}>
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">
              {isExpired
                ? `Contract expired ${Math.abs(daysToExpiry)} days ago`
                : `Contract expires in ${daysToExpiry} day${daysToExpiry === 1 ? "" : "s"}`}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              {isExpired
                ? "This contract is no longer active. Please renew or archive it."
                : daysToExpiry <= 30
                ? "Urgent: initiate renewal or extension process immediately."
                : "Renewal planning should begin. Use the Renew button above."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Commercial Terms */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <DollarSign className="w-4 h-4 text-[#133255]" />
              Commercial Terms & Structure
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Success Fee %</span>
                <span className="text-base font-bold text-slate-900">
                  {contract.successFeePct ? `${contract.successFeePct}%` : "Retainer"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Replacement Period</span>
                <span className="text-base font-bold text-slate-900">
                  {contract.replacementPeriod ? `${contract.replacementPeriod} Days` : "None"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Guarantee Period</span>
                <span className="text-base font-bold text-slate-900">
                  {contract.guaranteePeriod ? `${contract.guaranteePeriod} Days` : "None"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Payment Terms</span>
                <span className="font-semibold text-slate-800">
                  {contract.paymentTerms || "Net 30 days"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Currency</span>
                <span className="font-semibold text-slate-800">{contract.currency || "INR"}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Renewal Type</span>
                <span className="font-semibold text-slate-800">{contract.renewalType}</span>
              </div>
            </div>
          </div>

          {/* Card: Governance & Clauses */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <Shield className="w-4 h-4 text-[#133255]" />
              Governance & Special Clauses
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Exclusivity</span>
                <span className={`font-semibold ${contract.exclusivity ? "text-emerald-600" : "text-slate-600"}`}>
                  {contract.exclusivity ? "Yes — Exclusive Partner" : "Non-exclusive"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Non-Poaching Period</span>
                <span className="font-semibold text-slate-800">
                  {contract.nonPoachingMonths ? `${contract.nonPoachingMonths} Months` : "None"}
                </span>
              </div>
              {contract.latePaymentClause && (
                <div className="col-span-2">
                  <span className="text-slate-400 block font-semibold">Late Payment Clause</span>
                  <span className="font-semibold text-slate-800">{contract.latePaymentClause}</span>
                </div>
              )}
              {contract.travelExpenses && (
                <div className="col-span-2">
                  <span className="text-slate-400 block font-semibold">Travel Expenses</span>
                  <span className="font-semibold text-slate-800">{contract.travelExpenses}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card: Client Legal Snapshot */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-[#133255]" />
              Frozen Client Legal Snapshot
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block font-semibold">Legal Entity Name</span>
                <span className="font-semibold text-slate-900">
                  {contract.clientSnapshot?.legalEntityName || contract.clientName || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">GST Number</span>
                <span className="font-semibold text-slate-900">
                  {contract.clientSnapshot?.gstNumber || "Not recorded"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block font-semibold">Registered Billing Address</span>
                <span className="text-slate-800">
                  {contract.clientSnapshot?.billingAddress || contract.clientSnapshot?.registeredAddress || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Status & Documents */}
        <div className="space-y-6">
          {/* Card: Approval Status */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Approval Status
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-slate-900">{contract.approvalStatus}</span>
              </div>

              {contract.approvalStatus === "Pending" && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleOpenApprovalModal}
                    className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleConfirmApprove(false)}
                    className="flex-1 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}

              {contract.approvedBy && (
                <p suppressHydrationWarning className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  Approved by <strong>{contract.approvedBy}</strong> on{" "}
                  {new Date(contract.approvedAt!).toLocaleDateString("en-IN")}
                </p>
              )}
            </div>
          </div>

          {/* Card: Upload Signed Executed Copy */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Signed Executed Copy</span>
              <Upload className="w-3.5 h-3.5 text-slate-400" />
            </h3>

            <form onSubmit={handleUploadSigned} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Document URL / Cloud Link
                </label>
                <input
                  type="url"
                  placeholder="https://storage..."
                  value={signedUrlInput}
                  onChange={(e) => setSignedUrlInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-2 text-xs font-semibold text-white bg-[#133255] rounded-xl hover:bg-[#1a3d66] transition-colors"
              >
                {isUploading ? "Uploading..." : "Save Signed Copy"}
              </button>
            </form>
          </div>

          {/* Document History */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Document History ({contract.documents.length})
            </h3>
            {contract.documents.length === 0 ? (
              <p className="text-xs text-slate-400">No documents attached yet.</p>
            ) : (
              <div className="space-y-2">
                {contract.documents.map((doc: any) => (
                  <a
                    key={doc.id}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs transition-colors"
                  >
                    <div className="truncate pr-2">
                      <span className="font-semibold text-slate-900 block truncate">{doc.label}</span>
                      <span className="text-[10px] text-slate-400">{doc.fileName}</span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FORCE-SCROLL APPROVAL INSPECTION MODAL (SaaS-Style) */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-[#133255] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-serif">Contract Approval & Terms Inspection</h3>
                <p className="text-[11px] text-slate-300">
                  {contract.contractNumber} — {contract.clientName}
                </p>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-slate-300 hover:text-white text-xs font-bold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* Inspection Status Banner */}
            <div
              className={`p-3 text-xs font-semibold flex items-center gap-2 ${
                hasScrolledToBottom
                  ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-b border-amber-200"
              }`}
            >
              {hasScrolledToBottom ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All contract terms inspected! You may now approve and execute this contract.</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Please scroll through all terms to the bottom to enable approval.</span>
                </>
              )}
            </div>

            {/* Scrollable Terms Inspection Body */}
            <div
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                if (scrollTop + clientHeight >= scrollHeight - 30) {
                  setHasScrolledToBottom(true);
                }
              }}
              className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed font-sans max-h-96"
            >
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm mb-1">1. Commercial Structure & Fees</h4>
                <p>
                  Success Fee Rate: <strong>{contract.successFeePct ? `${contract.successFeePct}%` : "As per CTC Slabs"}</strong> of candidate annual CTC. Payment terms: <strong>{contract.paymentTerms}</strong>. Replacement guarantee period: <strong>{contract.replacementPeriod} days</strong>.
                </p>
              </div>

              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm mb-1">2. Non-Poaching & Exclusivity</h4>
                <p>
                  Exclusivity Status: <strong>{contract.exclusivity ? "Exclusive Partner" : "Non-Exclusive"}</strong>. Non-poaching restriction period: <strong>{contract.nonPoachingMonths} months</strong> post contract end date.
                </p>
              </div>

              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm mb-1">3. Late Payment & Expenses</h4>
                <p>
                  {contract.latePaymentClause || "Interest of 1.5% per month applicable on delayed invoices."}
                </p>
                <p className="mt-1">
                  {contract.travelExpenses || "Outstation travel expenses to be reimbursed at actuals."}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">4. Approval Confirmation</h4>
                <p className="text-slate-500">
                  By clicking Approve below, you confirm that you have thoroughly reviewed all commercial terms, guarantees, and legal governance clauses for {contract.clientName}.
                </p>
              </div>
            </div>

            {/* Approval Action Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Approval notes / sign-off reference (optional)..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full sm:w-2/3 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!hasScrolledToBottom}
                  onClick={() => handleConfirmApprove(true)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                >
                  Approve & Execute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <EmailDraftModal
        isOpen={isEmailDraftOpen}
        onClose={() => setIsEmailDraftOpen(false)}
        context={{
          type: "contract",
          contractNumber: contract.contractNumber,
          clientName: contract.clientName || "",
          contractStartDate: contract.contractStartDate,
          contractEndDate: contract.contractEndDate,
          consultant: contract.consultant,
          practice: contract.practice,
          commercialStructure: contract.commercialStructure,
          successFeePct: contract.successFeePct,
        }}
      />
    </div>
  );
}
