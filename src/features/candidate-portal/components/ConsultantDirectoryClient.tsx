"use client";

import { useState } from "react";
import { Search, Globe, Mail, Users } from "lucide-react";

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

function ConsultantCard({ consultant }: { consultant: Consultant }) {
  const initials = consultant.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 group"
      style={{
        background: "#e0e5ec",
        boxShadow: "6px 6px 12px rgba(163,177,198,0.5), -6px -6px 12px rgba(255,255,255,0.7)",
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
              className="text-[11px] font-bold px-2 py-0.5 rounded-full text-slate-600"
              style={{
                background: "#e0e5ec",
                boxShadow: "inset 2px 2px 4px rgba(163,177,198,0.5), inset -2px -2px 4px rgba(255,255,255,0.7)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center gap-2 pt-1 mt-auto">
        {consultant.linkedinUrl && (
          <a
            href={consultant.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-transform hover:-translate-y-0.5"
            style={{ background: "#e0e5ec", boxShadow: "2px 2px 4px rgba(163,177,198,0.4), -2px -2px 4px rgba(255,255,255,0.6)" }}
          >
            <Globe className="w-3.5 h-3.5" /> LinkedIn
          </a>
        )}
        <a
          href={`mailto:${consultant.email}?subject=Hi ${consultant.name.split(" ")[0]}, I'm reaching out from the Mauna Kea Candidate Portal`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white transition-transform hover:-translate-y-0.5 ml-auto"
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

  const verticals = Array.from(
    new Set(consultants.map((c) => c.vertical).filter(Boolean) as string[])
  );

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
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-slate-800 text-[22px] font-bold">My Consultants</h2>
          <p className="text-slate-500 font-medium text-[14px] mt-0.5">
            Your dedicated Mauna Kea search team
          </p>
        </div>
        <div 
          className="flex items-center gap-2 text-[13px] text-slate-600 font-bold px-3 py-2 rounded-xl"
          style={{ background: "#e0e5ec", boxShadow: "inset 2px 2px 4px rgba(163,177,198,0.5), inset -2px -2px 4px rgba(255,255,255,0.7)" }}
        >
          <Users className="w-4 h-4 text-[#133255]" />
          {consultants.length} professionals
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl text-[13px] text-slate-700 font-medium placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-[#133255]/20"
            style={{
              background: "#e0e5ec",
              boxShadow: "inset 3px 3px 6px rgba(163,177,198,0.5), inset -3px -3px 6px rgba(255,255,255,0.7)",
            }}
          />
        </div>
        {verticals.length > 0 && (
          <select
            value={filterVertical}
            onChange={(e) => setFilterVertical(e.target.value)}
            className="h-10 px-3 rounded-xl text-[13px] text-slate-600 font-bold outline-none"
            style={{
              background: "#e0e5ec",
              boxShadow: "inset 2px 2px 4px rgba(163,177,198,0.5), inset -2px -2px 4px rgba(255,255,255,0.7)",
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
            <ConsultantCard key={c.id} consultant={c} />
          ))}
        </div>
      )}
    </div>
  );
}
