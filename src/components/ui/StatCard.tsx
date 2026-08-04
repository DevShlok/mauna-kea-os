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
  const color = gold
    ? "#D8B15B"
    : warn
    ? "#f97316"
    : "#133255";

  return (
    <div
      className="neo-card-sm p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
    >
      {/* Decorative glow orb */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-xl pointer-events-none"
        style={{ background: color }}
      />
      <div className="flex justify-between items-center relative z-10">
        <div
          className="w-11 h-11 neo-inset flex items-center justify-center shrink-0"
          style={{
            color,
          }}
        >
          {icon}
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 neo-card-sm px-2.5 py-1">
          {trend}
        </div>
      </div>
      <div className="relative z-10 mt-1">
        <div className="text-3xl font-bold font-mono text-slate-800 tracking-tight">{value}</div>
        <div className="text-[13px] text-slate-500 mt-0.5 font-semibold">{label}</div>
      </div>
    </div>
  );
}
