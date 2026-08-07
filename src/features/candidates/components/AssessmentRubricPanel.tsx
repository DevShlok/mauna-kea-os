"use client";

import { useState, useTransition } from "react";
import { saveAssessmentAction } from "@/actions/assessment";
import { computeTier, type RubricScores } from "@/lib/rubric";
import toast from "react-hot-toast";
import { CheckCircle2, ChevronDown, ChevronRight, Loader2, Star, ClipboardList } from "lucide-react";


// ─── Rubric Definition ────────────────────────────────────────────────────────

const RUBRIC = [
  {
    key: "behavioral",
    label: "Behavioral",
    weight: 40,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    questions: [
      { id: "B1", text: "Led a team through significant change — rate leadership clarity and decisiveness." },
      { id: "B2", text: "Handling ambiguity — how does the candidate operate in uncertain, undefined situations?" },
      { id: "B3", text: "Communication under pressure — did they give a specific, structured example?" },
      { id: "B4", text: "Stakeholder management — evidence of managing up, down, and across effectively?" },
    ],
  },
  {
    key: "psychometric",
    label: "Psychometric",
    weight: 35,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    questions: [
      { id: "P1", text: "Goal orientation — are they primarily process-driven or outcome-driven? Is it contextually appropriate?" },
      { id: "P2", text: "Risk tolerance — how do they approach uncertain decisions and calculated risks?" },
      { id: "P3", text: "Resilience — concrete evidence of bouncing back from professional setbacks?" },
      { id: "P4", text: "Collaboration vs independence — is their preferred style a fit for the role?" },
      { id: "P5", text: "Learning agility — verifiable evidence of acquiring new skills in the past 2 years?" },
    ],
  },
  {
    key: "culturalFit",
    label: "Cultural Fit",
    weight: 25,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    questions: [
      { id: "C1", text: "Alignment with the hiring organisation's values and leadership principles?" },
      { id: "C2", text: "Work-life integration style — compatible with the role's intensity and travel requirements?" },
      { id: "C3", text: "Response to feedback and coachability — do they show genuine openness to growth?" },
    ],
  },
] as const;

const SCALE_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Below Average",
  3: "Average",
  4: "Above Average",
  5: "Excellent",
};

const TIER_CONFIG = {
  A: { label: "Tier A", color: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-300", desc: "Exceptional candidate — strong recommend." },
  B: { label: "Tier B", color: "text-amber-700",   bg: "bg-amber-100",   border: "border-amber-300",   desc: "Solid candidate — recommend with context." },
  C: { label: "Tier C", color: "text-red-700",     bg: "bg-red-100",     border: "border-red-300",     desc: "Below threshold — not recommended at this time." },
};

// ─── Default empty scores ─────────────────────────────────────────────────────

function emptyScores(): RubricScores {
  return {
    B1: 0, B2: 0, B3: 0, B4: 0,
    P1: 0, P2: 0, P3: 0, P4: 0, P5: 0,
    C1: 0, C2: 0, C3: 0,
    notes: { behavioral: "", psychometric: "", culturalFit: "" },
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  candId: string;
  existingReport?: any | null;
}

export function AssessmentRubricPanel({ candId, existingReport }: Props) {
  const existingData = (existingReport?.reportData as any) ?? null;
  const [scores, setScores] = useState<RubricScores>(existingData?.scores ?? emptyScores());
  const [preview, setPreview] = useState<{ total: number; tier: "A" | "B" | "C"; breakdown: Record<string, number> } | null>(
    existingData ? { total: existingData.total, tier: existingData.tier, breakdown: {} } : null
  );
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ behavioral: true, psychometric: false, culturalFit: false });
  const [isPending, startTransition] = useTransition();
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const allAnswered = [
    scores.B1, scores.B2, scores.B3, scores.B4,
    scores.P1, scores.P2, scores.P3, scores.P4, scores.P5,
    scores.C1, scores.C2, scores.C3,
  ].every((v) => v > 0);

  const setScore = (id: string, val: number) => {
    setScores((prev) => ({ ...prev, [id]: val }));
    // Live tier preview whenever all answered
    setPreview(null);
  };

  const setNote = (section: keyof RubricScores["notes"], val: string) => {
    setScores((prev) => ({ ...prev, notes: { ...prev.notes, [section]: val } }));
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePreview = () => {
    if (!allAnswered) { toast.error("Please rate all 12 questions before previewing."); return; }
    const result = computeTier(scores);
    setPreview(result);
  };

  const handleSubmit = (status: "Draft" | "Completed") => {
    if (status === "Completed" && !allAnswered) {
      toast.error("Please rate all 12 questions before completing the assessment.");
      return;
    }
    if (status === "Draft") setIsSavingDraft(true);

    startTransition(async () => {
      try {
        const result = await saveAssessmentAction(candId, scores, status);
        if (result.success) {
          if (status === "Completed") {
            setPreview({ total: result.total, tier: result.tier as "A" | "B" | "C", breakdown: {} });
            toast.success(`Assessment completed — Tier ${result.tier} (${result.total}/100)`);
          } else {
            toast.success("Draft saved.");
          }
        }
      } catch {
        toast.error("Failed to save assessment. Please try again.");
      } finally {
        setIsSavingDraft(false);
      }
    });
  };

  const isCompleted = existingReport?.status === "Completed";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="neo-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-5 h-5 text-[#133255]" />
              <h2 className="text-lg font-bold text-[#133255]">MK Candidate Assessment Rubric</h2>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Rate the candidate on 12 dimensions across Behavioral (40 pts), Psychometric (35 pts), and Cultural Fit (25 pts).
            </p>
          </div>
          {existingReport && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
              {isCompleted ? "✓ Completed" : "Draft"}
            </span>
          )}
        </div>

        {existingData && (
          <div className="mt-3 text-xs text-slate-400 font-medium">
            Last assessed by <span className="font-bold text-slate-600">{existingData.assessedBy}</span> on{" "}
            {new Date(existingData.assessedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        )}
      </div>

      {/* Tier Preview (shown after scoring) */}
      {preview && (
        <div className={`neo-card p-6 border-2 ${TIER_CONFIG[preview.tier].border}`}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black ${TIER_CONFIG[preview.tier].bg} ${TIER_CONFIG[preview.tier].color} border-2 ${TIER_CONFIG[preview.tier].border}`}>
              {preview.tier}
            </div>
            <div>
              <div className={`text-xl font-black ${TIER_CONFIG[preview.tier].color}`}>
                {TIER_CONFIG[preview.tier].label} — {preview.total}/100
              </div>
              <p className="text-sm text-slate-500 font-medium mt-0.5">{TIER_CONFIG[preview.tier].desc}</p>
            </div>
          </div>
          {Object.keys(preview.breakdown).length > 0 && (
            <div className="mt-4 flex gap-4 flex-wrap">
              {Object.entries(preview.breakdown).map(([k, v]) => (
                <div key={k} className="text-xs font-bold text-slate-500">
                  {k.charAt(0).toUpperCase() + k.slice(1)}: <span className="text-slate-800">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rubric Sections */}
      {RUBRIC.map((section) => {
        const isOpen = openSections[section.key];
        const sectionScores = section.questions.map((q) => (scores as any)[q.id] as number);
        const answeredCount = sectionScores.filter((s) => s > 0).length;

        return (
          <div key={section.key} className="neo-card overflow-hidden">
            {/* Section Header */}
            <button
              type="button"
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${section.bg} ${section.color} ${section.border} border`}>
                  {section.label}
                </span>
                <span className="text-sm font-bold text-slate-700">{section.weight} points</span>
                <span className="text-xs font-medium text-slate-400">
                  {answeredCount}/{section.questions.length} rated
                </span>
                {answeredCount === section.questions.length && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>

            {isOpen && (
              <div className="px-5 pb-5 space-y-5 border-t border-slate-100">
                {section.questions.map((q, idx) => {
                  const currentVal = (scores as any)[q.id] as number;
                  return (
                    <div key={q.id} className="pt-4">
                      <div className="flex items-start gap-2 mb-3">
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded ${section.bg} ${section.color} mt-0.5 shrink-0`}>
                          {q.id}
                        </span>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{q.text}</p>
                      </div>
                      {/* 1–5 Radio Scale */}
                      <div className="flex gap-2 flex-wrap">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setScore(q.id, val)}
                            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border-2 transition-all text-xs font-bold min-w-[60px] ${
                              currentVal === val
                                ? `${section.bg} ${section.color} ${section.border}`
                                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${currentVal >= val ? section.color : "text-slate-300"}`} fill={currentVal >= val ? "currentColor" : "none"} />
                            <span>{val}</span>
                            <span className="text-[9px] font-medium opacity-70 text-center leading-tight">{SCALE_LABELS[val]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Section Notes */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {section.label} Notes (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={(scores.notes as any)[section.key]}
                    onChange={(e) => setNote(section.key as any, e.target.value)}
                    placeholder={`Key observations for the ${section.label} section...`}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#133255] text-slate-700 resize-none font-medium"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Action Bar */}
      <div className="neo-card p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-slate-500 font-medium">
          {allAnswered ? (
            <span className="text-emerald-600 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> All 12 questions answered
            </span>
          ) : (
            <span>Rate all 12 questions to complete.</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!allAnswered || isPending}
            className="px-4 py-2 rounded-xl text-sm font-bold border-2 border-[#133255] text-[#133255] hover:bg-[#133255]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Preview Tier
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSubmit("Draft")}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            {isSavingDraft ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : "Save Draft"}
          </button>
          <button
            type="button"
            disabled={!allAnswered || isPending}
            onClick={() => handleSubmit("Completed")}
            className="px-5 py-2 rounded-xl text-sm font-bold bg-[#133255] text-white hover:bg-[#0e3178] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isPending && !isSavingDraft ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : "Complete Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
}
