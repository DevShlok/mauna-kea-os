"use client";

import React, { useState } from "react";
import { Brain, CheckCircle2, ChevronRight, Loader2, Sparkles, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { submitCandidateSelfAssessmentAction } from "@/actions/candidate-portal";

const PSYCHOMETRIC_INDICATORS = [
  { id: "decision_making", label: "Comfort with decision making under high ambiguity", category: "Leadership" },
  { id: "team_empowerment", label: "Delegation and empowering cross-functional team leads", category: "People Management" },
  { id: "risk_tolerance", label: "Calculated risk-taking vs conservative compliance", category: "Strategy" },
  { id: "ethics", label: "Uncompromising integrity and financial compliance standards", category: "Governance" },
  { id: "financial_acuity", label: "Depth of P&L management, forecasting, and capital allocation", category: "Core Skill" },
  { id: "communication", label: "Executive presence and board-level communication clarity", category: "Communication" },
  { id: "adaptability", label: "Speed of adapting to market disruptions or business pivots", category: "Agility" },
  { id: "conflict_resolution", label: "De-escalating cross-departmental friction constructively", category: "People Management" },
  { id: "data_driven", label: "Leveraging metrics and data over intuition for key calls", category: "Execution" },
  { id: "vision_alignment", label: "Translating high-level company vision into quarterly OKRs", category: "Strategy" },
];

const SCENARIO_QUESTIONS = [
  {
    id: "q1",
    title: "Strategic Crisis & Turnaround",
    question: "Describe a situation where a core project or financial mandate faced unexpected headwinds. How did you realign resources, communicate with key stakeholders, and navigate to resolution?",
    placeholder: "Detail your approach, key decisions made, and measurable business outcome...",
  },
  {
    id: "q2",
    title: "Team Leadership & Culture",
    question: "How do you foster accountability and high performance within your team while maintaining high trust and low turnover during intense deliverable cycles?",
    placeholder: "Share your leadership philosophy, team feedback loops, and management style...",
  },
];

export function CandidateAssessmentWidget({
  candId,
  onComplete,
}: {
  candId: string;
  onComplete?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"intro" | "psychometric" | "scenario" | "review">("intro");
  const [psychometricRatings, setPsychometricRatings] = useState<Record<string, number>>({});
  const [scenarioAnswers, setScenarioAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePsychometricChange = (id: string, rating: number) => {
    setPsychometricRatings((prev) => ({ ...prev, [id]: rating }));
  };

  const handleScenarioChange = (id: string, text: string) => {
    setScenarioAnswers((prev) => ({ ...prev, [id]: text }));
  };

  const isPsychometricComplete = PSYCHOMETRIC_INDICATORS.every((ind) => psychometricRatings[ind.id]);
  const isScenarioComplete = SCENARIO_QUESTIONS.every((q) => (scenarioAnswers[q.id] || "").trim().length >= 30);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitCandidateSelfAssessmentAction(candId, {
        psychometric: psychometricRatings,
        scenarios: scenarioAnswers,
      });

      if (res.success) {
        toast.success("Assessment submitted successfully! Evaluation completed.");
        setIsOpen(false);
        if (onComplete) onComplete();
      } else {
        toast.error("Failed to submit assessment");
      }
    } catch (err: any) {
      toast.error(err.message || "Error submitting assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Launcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="neo-btn px-5 py-3 rounded-2xl bg-[#133255] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#1d4d82] transition-all shadow-md cursor-pointer"
      >
        <Brain className="w-4 h-4 text-[#D8B15B]" />
        Take Behavioral & Psychometric Evaluation
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="neo-card max-w-3xl w-full max-h-[90vh] flex flex-col bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="px-6 py-5 bg-[#133255] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#D8B15B]">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Mauna Kea Behavioral & Psychometric Evaluation</h3>
                  <p className="text-xs text-slate-300">AI-powered competency assessment framework</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-600">
              <span className={step === "intro" ? "text-[#133255]" : "text-slate-400"}>1. Overview</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className={step === "psychometric" ? "text-[#133255]" : "text-slate-400"}>2. Psychometric Scale</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className={step === "scenario" ? "text-[#133255]" : "text-slate-400"}>3. Scenarios</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className={step === "review" ? "text-[#133255]" : "text-slate-400"}>4. Submit</span>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {step === "intro" && (
                <div className="space-y-5 text-slate-700">
                  <div className="p-5 rounded-2xl bg-sky-50 border border-sky-100 flex items-start gap-4">
                    <Sparkles className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <h4 className="font-bold text-sky-950 text-sm">About the Mauna Kea Assessment</h4>
                      <p className="text-sky-800 leading-relaxed">
                        This 10-minute evaluation analyzes leadership behavior, decision dynamics, and strategic problem-solving competencies. Your answers will generate constructive takeaway insights and calculate your Mauna Kea Tier rating.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium text-slate-600">
                    <div className="p-4 rounded-xl neo-inset space-y-1">
                      <div className="font-bold text-slate-800">10 Indicators</div>
                      <div>Psychometric self-assessment across 5 competency pillars.</div>
                    </div>
                    <div className="p-4 rounded-xl neo-inset space-y-1">
                      <div className="font-bold text-slate-800">2 Core Scenarios</div>
                      <div>Short written situational responses detailing your leadership approach.</div>
                    </div>
                    <div className="p-4 rounded-xl neo-inset space-y-1">
                      <div className="font-bold text-slate-800">Constructive Feedback</div>
                      <div>Receive actionable growth takeaways upon completion.</div>
                    </div>
                  </div>
                </div>
              )}

              {step === "psychometric" && (
                <div className="space-y-6">
                  <div className="text-xs text-slate-500 font-medium">
                    Rate yourself on a scale from 1 (Needs Development) to 5 (Mastery/Exemplary) for each leadership dimension:
                  </div>

                  <div className="space-y-4">
                    {PSYCHOMETRIC_INDICATORS.map((ind, idx) => (
                      <div key={ind.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {idx + 1}. {ind.label}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                            {ind.category}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-[11px] font-medium text-slate-400">1 (Developing)</span>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handlePsychometricChange(ind.id, val)}
                                className={`w-9 h-9 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                  psychometricRatings[ind.id] === val
                                    ? "bg-[#133255] text-white shadow-md scale-105"
                                    : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                          <span className="text-[11px] font-medium text-slate-400">5 (Exemplary)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === "scenario" && (
                <div className="space-y-6">
                  {SCENARIO_QUESTIONS.map((q, idx) => (
                    <div key={q.id} className="space-y-2">
                      <label className="block text-xs font-bold text-slate-800">
                        {idx + 1}. {q.title}
                      </label>
                      <p className="text-xs text-slate-600 leading-relaxed">{q.question}</p>
                      <textarea
                        rows={4}
                        value={scenarioAnswers[q.id] || ""}
                        onChange={(e) => handleScenarioChange(q.id, e.target.value)}
                        placeholder={q.placeholder}
                        className="w-full p-4 rounded-2xl border border-slate-200 outline-none text-xs font-medium focus:ring-2 focus:ring-[#133255] neo-inset"
                      />
                      <div className="text-[10px] text-slate-400 text-right">
                        {(scenarioAnswers[q.id] || "").trim().length}/30 min characters
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === "review" && (
                <div className="space-y-5 text-xs text-slate-700">
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-950 text-sm">Ready to Generate Assessment</h4>
                      <p className="text-emerald-800 mt-1 leading-relaxed">
                        You have completed all 10 psychometric ratings and behavioral scenario responses. Click submit to process your AI evaluation.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-800">Submission Summary</div>
                    <div className="p-4 rounded-xl neo-inset space-y-2">
                      <div className="flex justify-between">
                        <span>Psychometric Indicators:</span>
                        <span className="font-bold text-emerald-600">10 / 10 Rated</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Behavioral Scenarios:</span>
                        <span className="font-bold text-emerald-600">2 / 2 Answered</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Controls */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {step !== "intro" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === "psychometric") setStep("intro");
                    if (step === "scenario") setStep("psychometric");
                    if (step === "review") setStep("scenario");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step === "intro" && (
                <button
                  type="button"
                  onClick={() => setStep("psychometric")}
                  className="neo-btn px-6 py-2.5 rounded-xl bg-[#133255] text-white text-xs font-bold hover:bg-[#1d4d82] transition-all cursor-pointer"
                >
                  Start Assessment
                </button>
              )}

              {step === "psychometric" && (
                <button
                  type="button"
                  disabled={!isPsychometricComplete}
                  onClick={() => setStep("scenario")}
                  className="neo-btn px-6 py-2.5 rounded-xl bg-[#133255] text-white text-xs font-bold disabled:opacity-40 hover:bg-[#1d4d82] transition-all cursor-pointer"
                >
                  Next: Scenarios
                </button>
              )}

              {step === "scenario" && (
                <button
                  type="button"
                  disabled={!isScenarioComplete}
                  onClick={() => setStep("review")}
                  className="neo-btn px-6 py-2.5 rounded-xl bg-[#133255] text-white text-xs font-bold disabled:opacity-40 hover:bg-[#1d4d82] transition-all cursor-pointer"
                >
                  Review Submission
                </button>
              )}

              {step === "review" && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="neo-btn px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Evaluating...
                    </>
                  ) : (
                    "Submit Assessment & Calculate Score"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
