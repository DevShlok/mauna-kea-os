"use client";

import { useState } from "react";
import { MessageSquare, Send, Loader2, Sparkles, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { saveConversationalAnswersAction } from "@/actions/candidate-onboarding";

interface QuestionConfig {
  id: string;
  text: string;
  type: "text" | "textarea";
  placeholder?: string;
  options?: string[];
}

const QUESTIONS: QuestionConfig[] = [
  { 
    id: "name", 
    text: "What's your full name?", 
    type: "text",
    placeholder: "Enter your full name" 
  },
  { 
    id: "company", 
    text: "Which company are you currently working with?", 
    type: "text",
    placeholder: "e.g. Acme Corp / Stealth Startup" 
  },
  { 
    id: "designation", 
    text: "What is your current role or designation?", 
    type: "text",
    placeholder: "e.g. Senior Product Manager / VP Engineering" 
  },
  { 
    id: "experienceSummary", 
    text: "Tell us about your overall professional experience.", 
    type: "textarea", 
    placeholder: "e.g. 8+ years leading engineering teams in high-growth fintech...",
    options: [
      "5–8 Years Senior Track",
      "8–12 Years Management",
      "12–15+ Years Executive",
      "15+ Years Industry Leader"
    ]
  },
  { 
    id: "achievements", 
    text: "What are your top business impacts or achievements in your current role?", 
    type: "textarea", 
    placeholder: "e.g. Scaled platform traffic 3x, managed team of 15, reduced AWS costs by 25%...",
    options: [
      "Scaled business revenues / ARR 2x+",
      "Built & managed 10+ person cross-functional team",
      "Led digital transformation & infrastructure migration",
      "Expanded product footprint across international markets"
    ]
  },
  { 
    id: "dreamRoles", 
    text: "What type of leadership or career opportunities are you looking for?", 
    type: "textarea", 
    placeholder: "e.g. VP of Product, Head of Engineering in Series B+ startups...",
    options: [
      "C-Suite / Founder Track",
      "VP / Head of Department",
      "Director / Senior Leader",
      "Principal Specialist / Staff Engineer"
    ]
  },
  { 
    id: "ctc", 
    text: "What is your current CTC (in INR)?", 
    type: "text", 
    placeholder: "e.g. 35,00,000" 
  },
  { 
    id: "expected", 
    text: "What is your expected CTC (in INR)?", 
    type: "text", 
    placeholder: "e.g. 45,00,000" 
  },
  { 
    id: "notice", 
    text: "What is your notice period?", 
    type: "text", 
    placeholder: "Select or type notice period",
    options: [
      "Immediate / Serving Notice",
      "15 Days",
      "30 Days",
      "60 Days",
      "90 Days"
    ]
  },
  { 
    id: "location", 
    text: "Where are you currently located?", 
    type: "text", 
    placeholder: "Select or type location",
    options: [
      "Bangalore, India",
      "Mumbai, India",
      "Delhi NCR, India",
      "Hyderabad, India",
      "Remote / Flexible"
    ]
  }
];

export function Step3_Conversational({ candId, onNext, onBack }: { candId: string; onNext: (data?: any) => void; onBack?: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const q = QUESTIONS[currentIndex];
  const progressPercent = Math.round(((currentIndex) / QUESTIONS.length) * 100);

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      const prevQ = QUESTIONS[prevIdx];
      setCurrentIndex(prevIdx);
      setCurrentAnswer(answers[prevQ.id] || "");
      setHistory(prev => prev.slice(0, Math.max(0, prev.length - 1)));
    } else if (onBack) {
      onBack();
    }
  };

  const submitAnswer = async (answerVal: string) => {
    const val = answerVal.trim();
    if (!val) return;

    const newAnswers = { ...answers, [q.id]: val };
    const newHistory = [...history, { question: q.text, answer: val }];
    setAnswers(newAnswers);
    setHistory(newHistory);
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

  const handleSend = () => {
    submitAnswer(currentAnswer);
  };

  const handleOptionClick = (optionText: string) => {
    submitAnswer(optionText);
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
    <div className="flex flex-col items-center max-w-2xl mx-auto">
      {/* Animated Header */}
      <div className="w-14 h-14 bg-gradient-to-tr from-[#133255] to-[#1d4d82] text-[#D8B15B] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#133255]/20">
        <Sparkles className="w-7 h-7" />
      </div>
      
      <h2 className="text-2xl font-extrabold text-slate-800 mb-1 text-center">Let's Build Your AI Profile</h2>
      <p className="text-slate-500 text-sm max-w-md mb-6 text-center font-medium">
        Answer or click a quick suggestion pill. Feel free to skip any question.
      </p>

      {/* Animated Progress Bar */}
      <div className="w-full max-w-xl bg-slate-200/70 h-2.5 rounded-full overflow-hidden mb-6 relative">
        <div 
          className="h-full bg-gradient-to-r from-[#133255] via-[#1d4d82] to-[#D8B15B] transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Conversational Container */}
      <div className="w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xl shadow-slate-200/50 mb-6 flex flex-col gap-5">
        
        {/* Previous Q&A Feed */}
        {history.length > 0 && (
          <div className="flex flex-col gap-3 pb-4 border-b border-slate-100 max-h-48 overflow-y-auto pr-1">
            {history.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2 text-slate-400 font-semibold">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-[#133255] flex items-center justify-center text-[10px] font-bold">MK</span>
                  <span>{item.question}</span>
                </div>
                <div className="self-end bg-[#133255]/10 text-[#133255] px-3.5 py-1.5 rounded-2xl rounded-tr-xs font-bold max-w-[85%]">
                  {item.answer}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current Active Question */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#133255] to-[#1d4d82] text-white flex items-center justify-center shrink-0 shadow-md">
            <span className="font-serif font-bold text-xs">MK</span>
          </div>
          <div className="flex-1 bg-[#f8fafc] border border-slate-200/80 p-4 rounded-2xl rounded-tl-xs text-slate-800 text-sm font-semibold shadow-xs">
            {q.text}
          </div>
        </div>

        {/* Suggestion Option Pills */}
        {q.options && q.options.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {q.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleOptionClick(opt)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#133255] bg-slate-100 hover:bg-[#133255] hover:text-white border border-slate-200 transition-all duration-200 shadow-xs flex items-center gap-1.5 cursor-pointer text-left"
              >
                <span>{opt}</span>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>
            ))}
          </div>
        )}

        {/* Input Box */}
        <div className="relative mt-1">
          {q.type === "text" ? (
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={q.placeholder || "Type your answer..."}
              className="w-full pr-14 py-3.5 pl-4 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#133255]/50 bg-slate-50 focus:bg-white transition-all"
              autoFocus
            />
          ) : (
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={q.placeholder || "Type your answer..."}
              className="w-full pr-14 py-3 pl-4 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#133255]/50 resize-none bg-slate-50 focus:bg-white transition-all"
              rows={3}
              autoFocus
            />
          )}
          <button 
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#F15A29] text-white hover:bg-[#d94819] rounded-lg h-9 w-9 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
            onClick={handleSend}
            disabled={!currentAnswer.trim() || isSaving}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Footer Stepper Controls */}
        <div className="flex justify-between items-center text-xs pt-1">
          <button
            type="button"
            onClick={handlePrevQuestion}
            className="flex items-center gap-1 font-bold text-[#133255] hover:underline cursor-pointer disabled:opacity-50"
            disabled={isSaving}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{currentIndex > 0 ? "Previous question" : "Back"}</span>
          </button>

          <span className="text-slate-400 font-bold">
            Question {currentIndex + 1} of {QUESTIONS.length} ({progressPercent}% complete)
          </span>

          <button 
            type="button"
            onClick={handleSkip}
            className="text-[#133255] font-bold hover:underline cursor-pointer disabled:opacity-50"
            disabled={isSaving}
          >
            Skip question
          </button>
        </div>
      </div>
    </div>
  );
}

