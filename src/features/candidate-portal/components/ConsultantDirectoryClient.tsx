"use client";

import { useState } from "react";
import { Search, Globe, Mail, Users, MessageSquare, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { requestMentorSessionAction } from "@/actions/candidate-portal";

interface Consultant {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  vertical: string | null;
  expertiseTags: string[] | null;
  linkedinUrl: string | null;
  profilePic: string | null;
}

function ConsultantCard({
  consultant,
  onRequestSession,
}: {
  consultant: Consultant;
  onRequestSession: (c: Consultant) => void;
}) {
  const initials = consultant.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className="rounded-[32px] p-5 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 group"
      style={{
        background: "#eef2f7",
        boxShadow: "10px 10px 25px #cbd5e1, -10px -10px 25px #ffffff",
      }}
    >
      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        {consultant.profilePic ? (
          <img
            src={consultant.profilePic}
            alt={consultant.name}
            className="w-12 h-12 rounded-xl object-cover shrink-0"
            style={{ border: "2px solid #e0e5ec", boxShadow: "2px 2px 5px rgba(163,177,198,0.5)" }}
          />
        ) : (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-serif text-[15px] font-bold shrink-0 text-white"
            style={{
              background: "linear-gradient(135deg, #133255, #1d4d82)",
              boxShadow: "2px 2px 5px rgba(163,177,198,0.5)",
            }}
          >
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-slate-800 font-bold text-[15px] truncate">{consultant.name}</h3>
          {consultant.vertical && (
            <p className="text-[#133255] font-bold text-[12px] truncate">{consultant.vertical}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {consultant.bio && (
        <p className="text-slate-500 font-medium text-[13px] leading-relaxed line-clamp-2">
          {consultant.bio}
        </p>
      )}

      {/* Tags */}
      {consultant.expertiseTags && consultant.expertiseTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(consultant.expertiseTags as string[]).slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full text-slate-700"
              style={{
                background: "#eef2f7",
                boxShadow: "inset 3px 3px 6px #cbd4e1, inset -3px -3px 6px #ffffff",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-2 pt-1 mt-auto">
        <button
          type="button"
          onClick={() => onRequestSession(consultant)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold text-[#133255] bg-sky-50 border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#D8B15B]" /> Request Session
        </button>
        <a
          href={`mailto:${consultant.email}?subject=Hi ${consultant.name.split(" ")[0]}, I'm reaching out from the Mauna Kea Candidate Portal`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white transition-transform hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #133255, #1d4d82)",
            boxShadow: "2px 2px 4px rgba(163,177,198,0.5)",
          }}
        >
          <Mail className="w-3.5 h-3.5" /> Email
        </a>
      </div>
    </div>
  );
}

export function ConsultantDirectoryClient({
  consultants,
}: {
  consultants: Consultant[];
}) {
  const [search, setSearch] = useState("");
  const [filterVertical, setFilterVertical] = useState<string>("");
  const [selectedMentor, setSelectedMentor] = useState<Consultant | null>(null);
  const [sessionTopic, setSessionTopic] = useState("Career Transition & Goal Setting");
  const [sessionMessage, setSessionMessage] = useState("");
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);

  const verticals = Array.from(
    new Set(consultants.map((c) => c.vertical).filter(Boolean) as string[])
  );

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) return;

    setIsSubmittingSession(true);
    try {
      const res = await requestMentorSessionAction(
        selectedMentor.id,
        selectedMentor.name,
        sessionTopic,
        sessionMessage
      );
      if (res.success) {
        toast.success(`Guidance session request sent to ${selectedMentor.name}!`);
        setSelectedMentor(null);
        setSessionMessage("");
      } else {
        toast.error(res.error || "Failed to send request");
      }
    } catch {
      toast.error("Error submitting session request");
    } finally {
      setIsSubmittingSession(false);
    }
  };

  const filtered = consultants.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.bio && c.bio.toLowerCase().includes(search.toLowerCase())) ||
      (c.vertical && c.vertical.toLowerCase().includes(search.toLowerCase()));
    const matchVertical = !filterVertical || c.vertical === filterVertical;
    return matchSearch && matchVertical;
  });

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-16">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-slate-800 text-[22px] font-bold">My Consultants & Executive Mentors</h2>
          <p className="text-slate-500 font-medium text-[14px] mt-0.5">
            Your dedicated Mauna Kea partner directory and mentorship platform
          </p>
        </div>
        <div 
          className="flex items-center gap-2 text-[13px] text-slate-600 font-bold px-3 py-2 rounded-xl"
          style={{ background: "#e0e5ec", boxShadow: "inset 2px 2px 4px rgba(163,177,198,0.5), inset -2px -2px 4px rgba(255,255,255,0.7)" }}
        >
          <Users className="w-4 h-4 text-[#133255]" />
          {consultants.length} partners
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, sector, or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl text-[13px] text-slate-800 font-bold placeholder-slate-400 outline-none transition-all"
            style={{
              background: "#eef2f7",
              boxShadow: "inset 4px 4px 8px #cbd4e1, inset -4px -4px 8px #ffffff",
            }}
          />
        </div>
        {verticals.length > 0 && (
          <select
            value={filterVertical}
            onChange={(e) => setFilterVertical(e.target.value)}
            className="h-11 px-4 rounded-2xl text-[13px] text-slate-800 font-bold outline-none cursor-pointer"
            style={{
              background: "#eef2f7",
              boxShadow: "inset 4px 4px 8px #cbd4e1, inset -4px -4px 8px #ffffff",
            }}
          >
            <option value="">All Verticals</option>
            {verticals.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: "#e0e5ec",
            boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.7)",
          }}
        >
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#e0e5ec", boxShadow: "4px 4px 8px rgba(163,177,198,0.5), -4px -4px 8px rgba(255,255,255,0.7)" }}
          >
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 font-bold text-[14px]">No consultants found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ConsultantCard key={c.id} consultant={c} onRequestSession={(m) => setSelectedMentor(m)} />
          ))}
        </div>
      )}

      {/* Mentorship Guidance Session Request Modal (#19) */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <form onSubmit={handleSessionSubmit} className="neo-card max-w-lg w-full p-6 bg-white rounded-3xl space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#D8B15B]" />
                <h3 className="font-bold text-base text-slate-800">
                  Request Guidance Session with {selectedMentor.name}
                </h3>
              </div>
              <button type="button" onClick={() => setSelectedMentor(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              Schedule a 1-on-1 career guidance session with {selectedMentor.name} ({selectedMentor.vertical || "Mauna Kea Executive Partner"}).
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Session Focus / Topic
                </label>
                <select
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  className="w-full p-3 rounded-2xl text-xs font-bold text-slate-800 outline-none border border-slate-200 neo-inset"
                >
                  <option value="Career Transition & Goal Setting">Career Transition & Goal Setting</option>
                  <option value="CFO & Executive Mentorship">CFO & Executive Mentorship</option>
                  <option value="Mock Interview & Resume Polish">Mock Interview & Resume Polish</option>
                  <option value="Compensation & Market Positioning">Compensation & Market Positioning</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Your Inquiry / Specific Questions
                </label>
                <textarea
                  rows={4}
                  required
                  value={sessionMessage}
                  onChange={(e) => setSessionMessage(e.target.value)}
                  placeholder="Describe your current career juncture, key questions, and what you would like to cover during the session..."
                  className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs font-medium outline-none neo-inset"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedMentor(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingSession}
                className="px-5 py-2 rounded-xl bg-[#133255] text-white text-xs font-bold disabled:opacity-40 hover:bg-[#1d4d82] flex items-center gap-2 cursor-pointer"
              >
                {isSubmittingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Session Request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

