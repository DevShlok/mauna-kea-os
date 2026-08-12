"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Shield,
  Percent,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  saveContractTemplateAction,
  deleteContractTemplateAction,
} from "@/actions/contract-templates";
import { confirmDialog } from "@/components/ConfirmDialog";

interface Props {
  templates: any[];
}

export default function ContractTemplatesClient({ templates: initial }: Props) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initial);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    structureType: "SuccessFee",
    defaultSuccessFeePct: 20,
    defaultMinFee: "",
    defaultMaxFee: "",
    defaultRetainerAmount: "",
    defaultReplacementPeriodDays: 90,
    defaultGuaranteePeriodDays: 90,
    defaultPaymentTerms: "30 Days",
    defaultCurrency: "INR",
    defaultLatePaymentClause: "Interest @ 1.5% per month applicable on delayed payments.",
    defaultTravelExpensesClause: "Out of pocket expenses reimbursed at actuals with prior approval.",
    defaultExclusivity: true,
    defaultNonPoachingMonths: 12,
    defaultConfidentiality: true,
    isActive: true,
  });

  const handleOpenModal = (t?: any) => {
    if (t) {
      setEditingTemplate(t);
      setFormData({
        name: t.name,
        code: t.code,
        description: t.description || "",
        structureType: t.structureType || "SuccessFee",
        defaultSuccessFeePct: t.defaultSuccessFeePct || 20,
        defaultMinFee: t.defaultMinFee || "",
        defaultMaxFee: t.defaultMaxFee || "",
        defaultRetainerAmount: t.defaultRetainerAmount || "",
        defaultReplacementPeriodDays: t.defaultReplacementPeriodDays || 90,
        defaultGuaranteePeriodDays: t.defaultGuaranteePeriodDays || 90,
        defaultPaymentTerms: t.defaultPaymentTerms || "30 Days",
        defaultCurrency: t.defaultCurrency || "INR",
        defaultLatePaymentClause: t.defaultLatePaymentClause || "",
        defaultTravelExpensesClause: t.defaultTravelExpensesClause || "",
        defaultExclusivity: t.defaultExclusivity ?? true,
        defaultNonPoachingMonths: t.defaultNonPoachingMonths ?? 12,
        defaultConfidentiality: t.defaultConfidentiality ?? true,
        isActive: t.isActive ?? true,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: "",
        code: `TEMPLATE_${Date.now().toString().slice(-4)}`,
        description: "",
        structureType: "SuccessFee",
        defaultSuccessFeePct: 20,
        defaultMinFee: "",
        defaultMaxFee: "",
        defaultRetainerAmount: "",
        defaultReplacementPeriodDays: 90,
        defaultGuaranteePeriodDays: 90,
        defaultPaymentTerms: "30 Days",
        defaultCurrency: "INR",
        defaultLatePaymentClause: "Interest @ 1.5% per month applicable on delayed payments.",
        defaultTravelExpensesClause: "Out of pocket expenses reimbursed at actuals with prior approval.",
        defaultExclusivity: true,
        defaultNonPoachingMonths: 12,
        defaultConfidentiality: true,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          id: editingTemplate?.id,
          ...formData,
          defaultSuccessFeePct: parseFloat(String(formData.defaultSuccessFeePct)) || undefined,
          defaultMinFee: parseFloat(String(formData.defaultMinFee)) || undefined,
          defaultMaxFee: parseFloat(String(formData.defaultMaxFee)) || undefined,
          defaultRetainerAmount: parseFloat(String(formData.defaultRetainerAmount)) || undefined,
          defaultReplacementPeriodDays: parseInt(String(formData.defaultReplacementPeriodDays)) || 90,
          defaultGuaranteePeriodDays: parseInt(String(formData.defaultGuaranteePeriodDays)) || 90,
          defaultNonPoachingMonths: parseInt(String(formData.defaultNonPoachingMonths)) || 12,
        };
        await saveContractTemplateAction(payload);
        toast.success(`Template ${editingTemplate ? "updated" : "created"} successfully!`);
        setIsModalOpen(false);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to save template.");
      }
    });
  };

  const handleDelete = async (id: number, name: string) => {
    if (await confirmDialog(`Delete contract template "${name}"?`)) {
      startTransition(async () => {
        try {
          await deleteContractTemplateAction(id);
          setTemplates((prev) => prev.filter((t) => t.id !== id));
          toast.success("Template deleted.");
          router.refresh();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete template.");
        }
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/legal-finance/contracts"
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Contract Commercial Templates
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Configure default fee structures, replacement guarantees, and standard commercial clauses
          </p>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-800">Master Commercial Clause Library</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Templates populate automatically during contract creation wizard Step 3.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#133255] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#133255]/90 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Contract Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#133255]/10 text-[#133255]">
                  {t.code}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    t.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {t.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-1">{t.name}</h3>
              <p className="text-xs text-slate-500 min-h-[36px] line-clamp-2 mb-4">
                {t.description || "Standard commercial agreement terms."}
              </p>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fee Structure</span>
                  <span className="font-bold text-slate-800">
                    {t.defaultSuccessFeePct ? `${t.defaultSuccessFeePct}% Success Fee` : `Fixed Retainer`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Replacement Guarantee</span>
                  <span className="font-semibold text-slate-700">
                    {t.defaultReplacementPeriodDays} Days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Terms</span>
                  <span className="font-semibold text-slate-700">{t.defaultPaymentTerms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Non-Poaching</span>
                  <span className="font-semibold text-slate-700">
                    {t.defaultNonPoachingMonths} Months
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
              <button
                onClick={() => handleOpenModal(t)}
                className="p-2 text-slate-600 hover:text-[#133255] hover:bg-slate-100 rounded-lg transition-colors"
                title="Edit Template"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(t.id, t.name)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete Template"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">No Contract Templates Created</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add commercial templates (e.g. Success Fee, Retainer) so consultants can auto-populate standard terms when drafting agreements.
            </p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                {editingTemplate ? "Edit Contract Template" : "New Contract Template"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Success Fee 20%"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#133255]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Template Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUCCESS_FEE_20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#133255]/50 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of when to use this template..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#133255]/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Success Fee %
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.defaultSuccessFeePct}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultSuccessFeePct: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#133255]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Replacement (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.defaultReplacementPeriodDays}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultReplacementPeriodDays: parseInt(e.target.value) || 90 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#133255]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.defaultPaymentTerms}
                    onChange={(e) => setFormData({ ...formData, defaultPaymentTerms: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#133255]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Default Late Payment Clause
                </label>
                <input
                  type="text"
                  value={formData.defaultLatePaymentClause}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultLatePaymentClause: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#133255]/50"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.defaultExclusivity}
                    onChange={(e) => setFormData({ ...formData, defaultExclusivity: e.target.checked })}
                    className="rounded text-[#133255] focus:ring-[#133255]"
                  />
                  Default Exclusivity Clause
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.defaultConfidentiality}
                    onChange={(e) => setFormData({ ...formData, defaultConfidentiality: e.target.checked })}
                    className="rounded text-[#133255] focus:ring-[#133255]"
                  />
                  Default Confidentiality Clause
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[#133255] text-white rounded-xl text-xs font-bold hover:bg-[#133255]/90 transition-all disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isPending ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
