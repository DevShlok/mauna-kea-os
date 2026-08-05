"use client";

import { Shield, Award, BrainCircuit, Bot, Clock } from "lucide-react";

function NeoCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl relative overflow-hidden ${className}`}
      style={{
        background: "#eef2f7",
        boxShadow: "6px 6px 12px #cbd5e1, -6px -6px 12px #ffffff",
      }}
    >
      {children}
    </div>
  );
}

export function VerificationBadgesPanel({ badges }: { badges: any[] }) {
  const badgeMap = badges.reduce((acc, b) => {
    acc[b.badgeType] = b;
    return acc;
  }, {});

  const badgeConfig = [
    {
      id: "profile_complete",
      title: "Profile Verified",
      desc: "Basic profile information is complete",
      icon: Shield,
      color: "text-blue-500",
      bg: "bg-blue-100",
    },
    {
      id: "reference_check_complete",
      title: "Reference Check",
      desc: "Professional references verified by our team",
      icon: Award,
      color: "text-green-500",
      bg: "bg-green-100",
    },
    {
      id: "assessment_complete",
      title: "Skill Assessment",
      desc: "Technical/functional skills evaluated",
      icon: BrainCircuit,
      color: "text-purple-500",
      bg: "bg-purple-100",
    },
    {
      id: "ai_interview_complete",
      title: "AI Interview",
      desc: "Completed Mauna Kea AI screening",
      icon: Bot,
      color: "text-orange-500",
      bg: "bg-orange-100",
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      {badgeConfig.map(config => {
        const earned = badgeMap[config.id];
        const Icon = config.icon;
        
        return (
          <NeoCard key={config.id} className="p-6">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${earned ? config.bg : 'bg-slate-200'}`}>
                <Icon className={`w-7 h-7 ${earned ? config.color : 'text-slate-400'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-bold text-lg ${earned ? 'text-slate-800' : 'text-slate-500'}`}>
                    {config.title}
                  </h3>
                  {earned ? (
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-green-200">
                      <Shield className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1 border border-slate-200">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-3">{config.desc}</p>
                {earned && (
                  <div className="text-xs text-slate-400 font-medium">
                    Earned on {new Date(earned.earnedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          </NeoCard>
        );
      })}
    </div>
  );
}
