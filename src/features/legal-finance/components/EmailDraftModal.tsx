"use client";

import { useState } from "react";
import { X, Copy, Check, Loader2, Mail, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import {
  generateInvoiceEmailDraftAction,
  generateContractEmailDraftAction,
} from "@/actions/email-drafts";

// ─── Types ─────────────────────────────────────────────────────────────────

interface InvoiceDraftContext {
  type: "invoice";
  invoiceNumber: string;
  clientName: string;
  clientContactName?: string | null;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  feeBeforeTax: number;
  lineItems?: { particulars: string; feeAmount: number }[];
  contractNumber?: string | null;
  consultant?: string | null;
}

interface ContractDraftContext {
  type: "contract";
  contractNumber: string;
  clientName: string;
  clientContactName?: string | null;
  contractStartDate: string;
  contractEndDate: string;
  consultant?: string | null;
  practice?: string | null;
  commercialStructure?: string | null;
  successFeePct?: number | null;
}

type DraftContext = InvoiceDraftContext | ContractDraftContext;

interface EmailDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: DraftContext;
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function EmailDraftModal({
  isOpen,
  onClose,
  context,
}: EmailDraftModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      let result: { subject: string; body: string };

      if (context.type === "invoice") {
        result = await generateInvoiceEmailDraftAction({
          invoiceNumber: context.invoiceNumber,
          clientName: context.clientName,
          clientContactName: context.clientContactName,
          invoiceDate: context.invoiceDate,
          dueDate: context.dueDate,
          totalAmount: context.totalAmount,
          feeBeforeTax: context.feeBeforeTax,
          lineItems: context.lineItems,
          contractNumber: context.contractNumber,
          consultant: context.consultant,
        });
      } else {
        result = await generateContractEmailDraftAction({
          contractNumber: context.contractNumber,
          clientName: context.clientName,
          clientContactName: context.clientContactName,
          contractStartDate: context.contractStartDate,
          contractEndDate: context.contractEndDate,
          consultant: context.consultant,
          practice: context.practice,
          commercialStructure: context.commercialStructure,
          successFeePct: context.successFeePct,
        });
      }

      setSubject(result.subject);
      setBody(result.body);
      setIsGenerated(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate email draft.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, type: "subject" | "body") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "subject") {
        setCopiedSubject(true);
        setTimeout(() => setCopiedSubject(false), 2000);
      } else {
        setCopiedBody(true);
        setTimeout(() => setCopiedBody(false), 2000);
      }
      toast.success(`${type === "subject" ? "Subject" : "Email body"} copied!`);
    } catch {
      toast.error("Copy failed — please select and copy manually.");
    }
  };

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  const entityLabel =
    context.type === "invoice" ? context.invoiceNumber : context.contractNumber;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#133255]/10 flex items-center justify-center">
              <Mail className="w-4.5 h-4.5 text-[#133255]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Draft Email
              </h2>
              <p className="text-[11px] text-slate-500">
                {context.type === "invoice" ? "Invoice dispatch" : "Contract dispatch"} — {entityLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!isGenerated ? (
            /* Generate state */
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#133255] to-blue-500 flex items-center justify-center shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Generate Email Draft</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  AI will draft a professional {context.type === "invoice" ? "invoice dispatch" : "contract sharing"} email based on the details. You can edit it before sending.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #133255 0%, #1e40af 100%)" }}
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                ) : (
                  <><Mail className="w-4 h-4" /> Generate Draft</>
                )}
              </button>
            </div>
          ) : (
            /* Editable draft state */
            <div className="space-y-4">
              {/* Subject */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Subject</label>
                  <button
                    onClick={() => copyToClipboard(subject, "subject")}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {copiedSubject ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedSubject ? "Copied!" : "Copy"}
                  </button>
                </div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#133255]/20"
                />
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email Body</label>
                  <button
                    onClick={() => copyToClipboard(body, "body")}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {copiedBody ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedBody ? "Copied!" : "Copy"}
                  </button>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={14}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#133255]/20 resize-none font-mono leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {isGenerated && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => { setIsGenerated(false); handleGenerate(); }}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => copyToClipboard(`Subject: ${subject}\n\n${body}`, "body")}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 inline mr-1" /> Copy All
              </button>
              <button
                onClick={handleOpenGmail}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all"
                style={{ background: "linear-gradient(135deg, #133255 0%, #1e40af 100%)" }}
              >
                <Mail className="w-3.5 h-3.5" /> Open in Gmail
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
