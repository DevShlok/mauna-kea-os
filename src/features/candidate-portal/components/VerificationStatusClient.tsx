"use client";

import { Shield, CheckCircle2, Clock, CheckCheck, HelpCircle } from "lucide-react";

function NeoCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[36px] relative overflow-hidden ${className}`}
      style={{
        background: "#eef2f7",
        boxShadow: "12px 12px 24px #cbd5e1, -12px -12px 24px #ffffff",
      }}
    >
      {children}
    </div>
  );
}

export function VerificationStatusClient({
  candId,
  checks = [],
  verificationStatus,
  assessmentBadge = null,
}: {
  candId: string;
  checks?: any[];
  verificationStatus?: any | null;
  assessmentBadge?: any | null;
}) {
  const isVerified = verificationStatus?.status === "Verified";
  const tier = assessmentBadge?.metadata?.tier as "A" | "B" | "C" | undefined;
  const assessTotal = assessmentBadge?.metadata?.total as number | undefined;

  const TIER_CONFIG: Record<"A" | "B" | "C", { label: string; color: string; bg: string; desc: string }> = {
    A: { label: "Tier A", color: "text-emerald-700", bg: "bg-emerald-100", desc: "Exceptional profile across all dimensions." },
    B: { label: "Tier B", color: "text-amber-700",   bg: "bg-amber-100",   desc: "Solid profile with strong fundamentals." },
    C: { label: "Tier C", color: "text-red-700",     bg: "bg-red-100",     desc: "Profile under active development." },
  };
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-12">
      {/* Banner */}
      <NeoCard className="p-8 text-center flex flex-col items-center gap-4">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isVerified ? "text-emerald-600 bg-emerald-50" : "text-[#133255] bg-[#eef2f7]"}`}
          style={{
            boxShadow: isVerified ? "4px 4px 10px #a7f3d0, -4px -4px 10px #ffffff" : "4px 4px 10px #cbd5e1, -4px -4px 10px #ffffff",
          }}
        >
          {isVerified ? <CheckCheck className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
        </div>
        <div>
          <h1 className="text-slate-800 text-2xl font-bold">
            {isVerified ? "Fully Verified" : "My Verification Status"}
          </h1>
          <p className="text-slate-500 font-medium text-[14px] mt-1 max-w-md mx-auto">
            {isVerified 
              ? "Your professional brand has been verified. You gain priority representation with top clients." 
              : "Verified candidates gain priority representation with top clients."}
          </p>
        </div>
      </NeoCard>

      {/* Verification Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1: Reference Checks */}
        <NeoCard className="p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#133255] uppercase tracking-wider">
                Step 1
              </span>
              {isVerified ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> Completed
                </span>
              ) : checks.length > 0 ? (
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> In Progress
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
            {checks.length > 0 ? `${checks.length} reference(s) logged` : "Arranged by consultant"}
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
      </div>

      {/* Your Assessment Tier */}
      {tier && (
        <>
          <h2 className="text-lg font-bold text-slate-800 mt-4 mb-2 px-2">Your Assessment Tier</h2>
          <NeoCard className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black ${TIER_CONFIG[tier].bg} ${TIER_CONFIG[tier].color} border-2`}>
                {tier}
              </div>
              <div>
                <div className={`text-xl font-black ${TIER_CONFIG[tier].color}`}>
                  {TIER_CONFIG[tier].label}
                </div>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{TIER_CONFIG[tier].desc}</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Your profile has been reviewed by the Mauna Kea team across behavioral, psychometric, and cultural dimensions.
                </p>
              </div>
            </div>
          </NeoCard>
        </>
      )}

      {/* Reference Check Summaries */}
      <h2 className="text-lg font-bold text-slate-800 mt-4 mb-2 px-2">What your professional network says about you</h2>
      
      {checks.length === 0 ? (
        <div className="neo-inset p-8 text-center text-slate-500 space-y-2 rounded-2xl bg-[#eef2f7]">
          <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-semibold text-sm">No references completed yet.</p>
          <p className="text-xs text-slate-400">Your consultant is arranging reference checks. Constructive feedback will appear here once finalized.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 px-2 font-medium">
            This feedback is shared constructively and anonymously to help you understand your professional brand in the market.
          </p>

          <div className="grid grid-cols-1 gap-4">
            {checks.map((check, idx) => {
              // Extract the base relationship to append an index
              // "Peer" -> "Peer 1"
              // If we have multiple peers, they should be numbered properly, but for simplicity we append the map index + 1 here,
              // or group them. For Phase 2 spec: "Peer 1", "Senior 1"
              // We'll just append (idx + 1) for uniqueness in the UI.
              
              const relationshipLabel = `${check.refereeRelationship} ${idx + 1}`;

              return (
                <div key={check.id} className="neo-card p-6 rounded-2xl bg-white border border-slate-100">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                    <div className="w-8 h-8 rounded-full bg-[#133255] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{relationshipLabel}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">Completed Reference</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {check.summaryPositives && (
                      <div className="flex gap-3 items-start">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">Strengths</span>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">{check.summaryPositives}</p>
                        </div>
                      </div>
                    )}

                    {check.summaryImprovements && (
                      <div className="flex gap-3 items-start">
                        <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] font-black text-amber-600">🔁</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-0.5">Growth Areas</span>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">{check.summaryImprovements}</p>
                        </div>
                      </div>
                    )}

                    {check.summaryNeutral && (
                      <div className="flex gap-3 items-start">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[12px] font-black text-blue-600">💬</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block mb-0.5">Observations</span>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">{check.summaryNeutral}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
