"use client";

import React, { useState } from "react";
import { Shield, CheckCircle2, Clock, CheckCheck, HelpCircle, MessageSquare, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { CandidateAssessmentWidget } from "./CandidateAssessmentWidget";
import { requestAssessmentClarificationAction } from "@/actions/candidate-portal";

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
  
  const [isClarifyOpen, setIsClarifyOpen] = useState(false);
  const [clarificationText, setClarificationText] = useState("");
  const [isSubmittingClarification, setIsSubmittingClarification] = useState(false);

  const handleClarificationSubmit = async () => {
    setIsSubmittingClarification(true);
    try {
      const res = await requestAssessmentClarificationAction(candId, clarificationText);
      if (res.success) {
        toast.success("Feedback request sent to Mauna Kea consultant team!");
        setIsClarifyOpen(false);
        setClarificationText("");
      } else {
        toast.error(res.error || "Failed to send request");
      }
    } catch {
      toast.error("Error sending clarification request");
    } finally {
      setIsSubmittingClarification(false);
    }
  };

  const TIER_CONFIG: Record<"A" | "B" | "C", { label: string; color: string; bg: string; desc: string }> = {
    A: {
      label: "Tier A — Top 5% Talent",
      color: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-300",
      desc: "Exceptional mastery across leadership, financial strategy, crisis resolution, and team empowerment.",
    },
    B: {
      label: "Tier B — High Potential Leader",
      color: "text-blue-700",
      bg: "bg-blue-50 border-blue-300",
      desc: "Strong core competency in functional execution and strategic planning, recommended for growth mandates.",
    },
    C: {
      label: "Tier C — Emerging Professional",
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-300",
      desc: "Demonstrates core domain experience with clear development areas for executive progression.",
    },
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-16">
      {/* Verification Banner */}
      <NeoCard className="p-8 text-center space-y-4">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${isVerified ? "text-emerald-600 bg-emerald-50" : "text-[#133255] bg-[#eef2f7]"}`}
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

      {/* Your Assessment Tier or Assessment Widget Launcher */}
      {tier ? (
        <>
          <div className="flex items-center justify-between mt-4 mb-2 px-2">
            <h2 className="text-lg font-bold text-slate-800">Your Assessment Tier</h2>
            <button
              onClick={() => setIsClarifyOpen(true)}
              className="text-xs font-bold text-[#133255] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#D8B15B]" /> Request Outcome Clarification
            </button>
          </div>
          <NeoCard className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black ${TIER_CONFIG[tier].bg} ${TIER_CONFIG[tier].color} border-2 shrink-0`}>
                  {tier}
                </div>
                <div>
                  <div className={`text-xl font-black ${TIER_CONFIG[tier].color}`}>
                    {TIER_CONFIG[tier].label}
                  </div>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">{TIER_CONFIG[tier].desc}</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Your profile has been evaluated by the Mauna Kea team across behavioral, psychometric, and leadership dimensions.
                  </p>
                </div>
              </div>
              {assessTotal !== undefined && (
                <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-center shrink-0 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluation Score</div>
                  <div className="text-xl font-black text-[#133255]">{assessTotal} / 100</div>
                </div>
              )}
            </div>
          </NeoCard>

          {/* Clarification Modal (#24) */}
          {isClarifyOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
              <div className="neo-card max-w-lg w-full p-6 bg-white rounded-3xl space-y-4 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#133255]" /> Assessment Feedback Query
                  </h3>
                  <button onClick={() => setIsClarifyOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Have questions about your constructive takeaways or tier placement? Submit your clarification request below. Our consultant team will review your query without altering your official score.
                </p>
                <textarea
                  rows={4}
                  value={clarificationText}
                  onChange={(e) => setClarificationText(e.target.value)}
                  placeholder="Detail your question, additional context, or specific areas you would like to discuss with a consultant..."
                  className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs font-medium outline-none neo-inset"
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setIsClarifyOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isSubmittingClarification || clarificationText.trim().length < 10}
                    onClick={handleClarificationSubmit}
                    className="px-5 py-2 rounded-xl bg-[#133255] text-white text-xs font-bold disabled:opacity-40 hover:bg-[#1d4d82] flex items-center gap-2"
                  >
                    {isSubmittingClarification ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Query to Consultants"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <NeoCard className="p-7 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Behavioral & Psychometric Assessment
              </span>
              <h3 className="text-lg font-bold text-slate-800">Complete Your AI Competency Evaluation</h3>
              <p className="text-xs text-slate-500 font-medium max-w-lg">
                Complete our 10-minute behavioral and psychometric questionnaire to earn your Mauna Kea Assessment Verification Badge and constructive growth takeaways.
              </p>
            </div>
            <CandidateAssessmentWidget candId={candId} />
          </div>
        </NeoCard>
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
