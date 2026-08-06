"use client";

import { useState } from "react";
import { Plus, Edit3, Trash2, Calendar, MapPin, Briefcase } from "lucide-react";

function NeoCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`neo-card-sm relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function CareerTimeline({ 
  candId, 
  timeline,
  onEdit,
}: { 
  candId: string; 
  timeline: any[]; 
  onEdit?: () => void;
}) {
  const [entries, setEntries] = useState(timeline || []);
  
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-slate-800 text-lg font-bold flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[#133255]" />
          Career Timeline
        </h2>
        {onEdit && (
          <button
            className="neo-btn flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#133255]"
            onClick={onEdit}
          >
            <Plus className="w-4 h-4" /> Add Experience / Edit History
          </button>
        )}
      </div>

      <div className="relative border-l-2 border-[#133255]/20 ml-3 md:ml-4 space-y-8 pb-4">
        {entries.length === 0 && (
          <div className="pl-6 text-slate-500 text-sm">
            No career history added yet.
          </div>
        )}
        
        {entries.map((entry, idx) => (
          <div key={entry.id || idx} className="relative pl-6 md:pl-8">
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[#133255] border-4 border-[#eef2f7]"></div>
            
            <NeoCard className="p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">{entry.roleTitle || entry.position}</h3>
                  <div className="text-[#F15A29] font-medium text-sm mb-2">{entry.companyName}</div>
                  
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {entry.duration ? (
                        entry.duration
                      ) : (
                        <>
                          {entry.startDate && new Date(entry.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} 
                          {" - "} 
                          {entry.isCurrent || !entry.endDate ? "Present" : new Date(entry.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                        </>
                      )}
                    </span>
                  </div>
                  
                  {entry.description && (
                    <p className="text-slate-600 text-sm leading-relaxed mt-2">
                      {entry.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button className="p-2 text-slate-400 hover:text-[#133255] transition-colors rounded-lg hover:bg-slate-200/50">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50/50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </NeoCard>
          </div>
        ))}
      </div>
    </div>
  );
}
