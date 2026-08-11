"use client";

import { useState, useEffect } from "react";
import { Search, CheckCircle2, XCircle, Loader2, Info } from "lucide-react";
import toast from "react-hot-toast";

interface GstinResult {
  gstin: string;
  legalName: string | null;
  tradeName: string | null;
  registeredAddress: string | null;
  city: string | null;
  state: string;
  pinCode: string | null;
  pan: string;
  stateCode: string;
  entityType: string;
  status: string | null;
  fromApi: boolean;
  note?: string;
}

interface GstinLookupFieldProps {
  value: string;
  onChange: (value: string) => void;
  onLookupSuccess?: (result: GstinResult) => void;
  label?: string;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function GstinLookupField({
  value,
  onChange,
  onLookupSuccess,
  label = "GSTIN",
  className = "",
  inputClassName = "",
  required = false,
  disabled = false,
}: GstinLookupFieldProps) {
  const [isLooking, setIsLooking] = useState(false);
  const [result, setResult] = useState<GstinResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-trigger lookup when GSTIN reaches 15 chars
  useEffect(() => {
    if (value.length === 15) {
      handleLookup();
    } else {
      setResult(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleLookup = async () => {
    const gstin = value.trim().toUpperCase();
    if (gstin.length !== 15) {
      setError("GSTIN must be 15 characters");
      return;
    }

    setIsLooking(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/gstin-lookup?gstin=${encodeURIComponent(gstin)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Lookup failed");
        return;
      }

      setResult(data);

      if (onLookupSuccess) {
        onLookupSuccess(data);
      }

      if (data.fromApi && data.legalName) {
        toast.success(`GST verified: ${data.legalName}`, { icon: "✅" });
      } else {
        toast(`State: ${data.state} | PAN: ${data.pan}`, {
          icon: "ℹ️",
          style: { fontSize: "12px" },
        });
      }
    } catch {
      setError("Lookup failed — check your connection");
    } finally {
      setIsLooking(false);
    }
  };

  const statusColor =
    result?.status === "Active"
      ? "text-emerald-600"
      : result?.status
      ? "text-rose-600"
      : "text-slate-500";

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>

      {/* Input + Button row */}
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase().replace(/\s/g, ""))}
            maxLength={15}
            disabled={disabled}
            required={required}
            placeholder="e.g. 06ABCDE1234F1Z5"
            className={`w-full px-3 py-2.5 text-sm font-mono border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#133255]/20 transition-all ${
              error
                ? "border-rose-300 bg-rose-50"
                : result
                ? "border-emerald-300 bg-emerald-50/30"
                : "border-slate-200 bg-slate-50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${inputClassName}`}
          />
          {/* Character count */}
          <span
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono ${
              value.length === 15 ? "text-emerald-500" : "text-slate-400"
            }`}
          >
            {value.length}/15
          </span>
        </div>

        <button
          type="button"
          onClick={handleLookup}
          disabled={isLooking || disabled || value.length !== 15}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ background: "linear-gradient(135deg, #133255 0%, #1e40af 100%)" }}
          title="Look up this GSTIN"
        >
          {isLooking ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          {isLooking ? "Looking…" : "Lookup"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Result chip */}
      {result && !error && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              {result.legalName && (
                <p className="text-xs font-bold text-slate-900">{result.legalName}</p>
              )}
              {result.tradeName && result.tradeName !== result.legalName && (
                <p className="text-[11px] text-slate-500">Trade: {result.tradeName}</p>
              )}
              <p className="text-[11px] text-slate-600">
                <span className="font-semibold">State:</span> {result.state}
                {result.city && ` · ${result.city}`}
                {result.pinCode && ` — ${result.pinCode}`}
              </p>
              <p className="text-[11px] text-slate-600">
                <span className="font-semibold">PAN:</span> {result.pan} ·{" "}
                <span className="font-semibold">Type:</span> {result.entityType}
              </p>
              {result.status && (
                <p className={`text-[11px] font-semibold ${statusColor}`}>
                  {result.fromApi ? (
                    <><CheckCircle2 className="w-3 h-3 inline mr-0.5" /> GST Status: {result.status}</>
                  ) : (
                    result.status
                  )}
                </p>
              )}
            </div>
            <div className="shrink-0">
              {result.fromApi ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-amber-400 mt-0.5" />
              )}
            </div>
          </div>
          {result.note && (
            <p className="text-[10px] text-amber-600 mt-1">{result.note}</p>
          )}
        </div>
      )}
    </div>
  );
}
