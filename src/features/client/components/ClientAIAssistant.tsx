"use client";

import { useState } from "react";
import { Sparkles, Send, X, Bot, User } from "lucide-react";

interface ClientAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  mandate: any;
  clientName: string;
}

export default function ClientAIAssistant({
  isOpen,
  onClose,
  mandate,
  clientName,
}: ClientAIAssistantProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: `Hello ${clientName}! I am your Monaki Candidate Intelligence Assistant for the ${mandate.role} search. Ask me anything about candidate benchmarks, competency trade-offs, or search depth.`,
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  if (!isOpen) return null;

  const handleSend = (userText: string) => {
    if (!userText.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setQuery("");
    setIsThinking(true);

    setTimeout(() => {
      let aiResponse = `Based on our 360° competency benchmarks for ${mandate.role}, shortlisted candidates display high Strategic Leadership (avg 8.7/10) with strong P&L scale experience.`;

      if (userText.toLowerCase().includes("strongest")) {
        aiResponse = `Candidate A delivers the highest Transformation score (9.1/10) with proven digital turnaround experience, whereas Candidate B leads in Commercial Acumen (8.9/10).`;
      } else if (userText.toLowerCase().includes("concerns")) {
        aiResponse = `Primary considerations across the top 3 shortlist candidates are notice period buyout negotiations (avg 60 days) and ESOP structure alignment.`;
      }

      setMessages((prev) => [...prev, { sender: "ai", text: aiResponse }]);
      setIsThinking(false);
    }, 800);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-250">
      {/* Drawer Header */}
      <div className="p-4 bg-[#133255] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#D8B15B] text-[#133255] flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-white">Candidate Intelligence AI</h3>
            <span className="text-[10px] text-[#D8B15B] font-semibold">Decision Support Assistant</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-white/70 hover:text-white rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Prompts */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1.5 text-[11px]">
        <button
          onClick={() => handleSend("Why is Candidate A stronger than Candidate B?")}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-slate-700 font-medium"
        >
          Compare Candidate A vs B
        </button>
        <button
          onClick={() => handleSend("Which candidates have the strongest transformation profile?")}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-slate-700 font-medium"
        >
          Transformation Leaders
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
            {m.sender === "ai" && (
              <div className="w-7 h-7 rounded-lg bg-[#133255] text-white flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                m.sender === "user"
                  ? "bg-[#133255] text-white rounded-tr-none font-medium"
                  : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic">
            <Bot className="w-3.5 h-3.5 animate-pulse text-[#133255]" />
            <span>Analyzing candidate intelligence...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask AI about candidate profiles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(query)}
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#133255]"
        />
        <button
          onClick={() => handleSend(query)}
          className="p-2 bg-[#133255] text-white rounded-xl hover:bg-[#1a4473]"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
