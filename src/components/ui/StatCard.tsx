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
  const valueColor = gold
    ? 'text-yellow-600'
    : warn
    ? 'text-orange-500'
    : 'text-blue-900';

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between gap-2 relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
          {label}
        </div>
        <div className="text-blue-900 opacity-60">{icon}</div>
      </div>
      <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
      <div className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full w-max">
        {trend}
      </div>
    </div>
  );
}
