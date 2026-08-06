import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend: string;
  icon: ReactNode;
  warn?: boolean;
  gold?: boolean;
}

export function StatCard({ label, value, trend, icon, warn, gold }: StatCardProps) {
  const accentColor = gold
    ? "#D8B15B"
    : warn
    ? "#f97316"
    : "#133255";

  const iconBg = gold
    ? "linear-gradient(135deg, #D8B15B, #f0c96a)"
    : warn
    ? "linear-gradient(135deg, #f97316, #ea580c)"
    : "linear-gradient(135deg, #133255, #1d4d82)";

  return (
    <div className="neo-card-sm p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default">
      {/* Decorative glow orb */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-25 blur-2xl pointer-events-none"
        style={{ background: accentColor }}
      />

      <div className="flex justify-between items-center relative z-10">
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white"
          style={{ background: iconBg, boxShadow: `0 4px 14px ${accentColor}40` }}
        >
          {icon}
        </div>
        {/* Trend pill */}
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 neo-card-xs px-2.5 py-1 whitespace-nowrap">
          {trend}
        </div>
      </div>

      <div className="relative z-10 mt-1">
        <div
          className="text-[30px] font-bold font-mono tracking-tight tabular-nums"
          style={{ color: accentColor }}
        >
          {value}
        </div>
        <div className="text-[13px] text-slate-500 mt-0.5 font-semibold">{label}</div>
      </div>
    </div>
  );
}
