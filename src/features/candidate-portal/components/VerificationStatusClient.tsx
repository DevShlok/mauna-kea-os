"use client";

import { Shield, ShieldCheck, CheckCircle2, Clock, AlertCircle } from "lucide-react";

function NeoCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl relative overflow-hidden ${className}`}
      style={{
        background: "#e0e5ec",
        boxShadow: "9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)",
      }}
    >
      {children}
    </div>
  );
}

export function VerificationStatusClient({
  candId,
  refCount,
}: {
  candId: string;
  refCount: number;
}) {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Banner */}
      <NeoCard className="p-8 text-center flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-[#133255]"
          style={{
            background: "#e0e5ec",
            boxShadow: "4px 4px 8px rgba(163,177,198,0.5), -4px -4px 8px rgba(255,255,255,0.7)",
          }}
        >
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-slate-800 text-2xl font-bold">My Verification Status</h1>
          <p className="text-slate-500 font-medium text-[14px] mt-1 max-w-md mx-auto">
            Verified candidates gain priority representation with top clients.
          </p>
        </div>
      </NeoCard>

      {/* Verification Steps Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: Reference Checks */}
        <NeoCard className="p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#133255] uppercase tracking-wider">
                Step 1
              </span>
              {refCount > 0 ? (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> In Progress
                </span>
              ) : (
                <span className="text-[11px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full" style={{ boxShadow: "inset 2px 2px 4px rgba(163,177,198,0.5), inset -2px -2px 4px rgba(255,255,255,0.7)" }}>
                  Not Started
                </span>
              )}
            </div>
            <h3 className="text-slate-800 font-bold text-[15px]">Reference Check</h3>
            <p className="text-slate-500 font-medium text-[12px] leading-relaxed">
              360° qualitative feedback gathered from former peers and seniors.
            </p>
          </div>
          <div className="text-[12px] text-slate-400 font-bold pt-3 border-t border-slate-300">
            {refCount > 0 ? `${refCount} reference(s) logged` : "Arranged by consultant"}
          </div>
        </NeoCard>

        {/* Step 2: Executive Assessment */}
        <NeoCard className="p-5 flex flex-col justify-between gap-4 opacity-75">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                Step 2
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full" style={{ boxShadow: "inset 2px 2px 4px rgba(163,177,198,0.5), inset -2px -2px 4px rgba(255,255,255,0.7)" }}>
                Phase 4
              </span>
            </div>
            <h3 className="text-slate-800 font-bold text-[15px]">Assessment</h3>
            <p className="text-slate-500 font-medium text-[12px] leading-relaxed">
              Leadership competency evaluation and psychometric alignment.
            </p>
          </div>
          <div className="text-[12px] text-slate-400 font-bold pt-3 border-t border-slate-300">
            Coming soon
          </div>
        </NeoCard>

        {/* Step 3: Verified Badge */}
        <NeoCard className="p-5 flex flex-col justify-between gap-4 opacity-75">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                Badge
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full" style={{ boxShadow: "inset 2px 2px 4px rgba(163,177,198,0.5), inset -2px -2px 4px rgba(255,255,255,0.7)" }}>
                Locked
              </span>
            </div>
            <h3 className="text-slate-800 font-bold text-[15px]">Verification Badge</h3>
            <p className="text-slate-500 font-medium text-[12px] leading-relaxed">
              Shield badge displayed across mandate pipeline and client portals.
            </p>
          </div>
          <div className="text-[12px] text-slate-400 font-bold pt-3 border-t border-slate-300">
            Awarded upon completion
          </div>
        </NeoCard>
      </div>

      {/* Info card */}
      <NeoCard className="p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#133255] shrink-0 mt-0.5" />
          <div className="text-[13px] text-slate-600 font-medium leading-relaxed">
            <p className="font-bold text-slate-800 mb-1">About Mauna Kea Verification</p>
            Reference checks and executive assessments help clients make faster, more confident hiring decisions. Your consultant will initiate these steps when appropriate for active opportunities.
          </div>
        </div>
      </NeoCard>
    </div>
  );
}
