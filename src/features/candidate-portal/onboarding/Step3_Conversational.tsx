"use client";

import { useState } from "react";
import { ArrowRight, MessageSquare, Send, CheckCircle2, Loader2 } from "lucide-react";
import { saveConversationalAnswersAction } from "@/actions/candidate-onboarding";

const QUESTIONS = [
  { id: "name", text: "What's your full name?", type: "text" },
  { id: "company", text: "What is your current company?", type: "text" },
  { id: "designation", text: "What is your current role/designation?", type: "text" },
  { id: "ctc", text: "What is your current CTC (in INR)?", type: "text", placeholder: "e.g. 1500000" },
  { id: "expected", text: "What is your expected CTC (in INR)?", type: "text", placeholder: "e.g. 2000000" },
  { id: "notice", text: "What is your notice period (in days)?", type: "text", placeholder: "e.g. 60" },
  { id: "location", text: "Where are you currently located?", type: "text" }
];

export function Step3_Conversational({ candId, onNext }: { candId: string; onNext: (data?: any) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const q = QUESTIONS[currentIndex];

  const handleSend = async () => {
    if (!currentAnswer.trim()) return;

    const newAnswers = { ...answers, [q.id]: currentAnswer.trim() };
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last question answered
      setIsSaving(true);
      try {
        await saveConversationalAnswersAction(candId, newAnswers);
        onNext(newAnswers);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSkip = async () => {
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsSaving(true);
      try {
        await saveConversationalAnswersAction(candId, answers);
        onNext(answers);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 bg-[#133255]/10 rounded-2xl flex items-center justify-center mb-6">
        <MessageSquare className="w-8 h-8 text-[#133255]" />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Let's chat about you</h2>
      <p className="text-slate-600 max-w-md mb-8 text-center">
        We'll ask a few quick questions to fill in the gaps. Feel free to skip any you'd rather answer later.
      </p>

      <div className="w-full max-w-lg bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-start mb-6">
          <div className="w-8 h-8 rounded-full bg-[#133255] flex items-center justify-center shrink-0 mr-4">
            <span className="text-white font-bold text-sm">MK</span>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-sm text-slate-800 shadow-sm">
            {q.text}
          </div>
        </div>

        <div className="relative">
          {q.type === "text" ? (
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={q.placeholder || "Type your answer..."}
              className="w-full pr-14 py-4 pl-4 text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#133255]/50 bg-white"
              autoFocus
            />
          ) : (
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={q.placeholder || "Type your answer..."}
              className="w-full pr-14 py-4 pl-4 text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#133255]/50 resize-none bg-white"
              rows={3}
              autoFocus
            />
          )}
          <button 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#F15A29] text-white hover:bg-[#F15A29]/90 rounded-lg h-10 w-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={!currentAnswer.trim() || isSaving}
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        
        <div className="mt-4 flex justify-between items-center text-sm">
          <span className="text-slate-400 font-medium">
            Question {currentIndex + 1} of {QUESTIONS.length}
          </span>
          <button 
            onClick={handleSkip}
            className="text-[#133255] font-medium hover:underline"
            disabled={isSaving}
          >
            Skip this question
          </button>
        </div>
      </div>

    </div>
  );
}
