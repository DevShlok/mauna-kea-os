import { STAGE_LABELS, INTERNAL_LABELS } from '@/lib/helpers';
import { ShieldCheck } from 'lucide-react';

const STAGE_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  universe:             { color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
  mapping:              { color: '#7c3aed', bg: '#f5f3ff', dot: '#a78bfa' },
  longlist:             { color: '#c2410c', bg: '#fff7ed', dot: '#fb923c' },
  calllist:             { color: '#b45309', bg: '#fefce8', dot: '#fbbf24' },
  shortlist:            { color: '#1d4ed8', bg: '#eff6ff', dot: '#60a5fa' },
  interview:            { color: '#047857', bg: '#ecfdf5', dot: '#34d399' },
  'client-shortlisted': { color: '#047857', bg: '#ecfdf5', dot: '#34d399' },
  'offer-sent':         { color: '#4338ca', bg: '#eef2ff', dot: '#818cf8' },
  'offer-accepted':     { color: '#0f766e', bg: '#f0fdfa', dot: '#2dd4bf' },
  closed:               { color: '#b91c1c', bg: '#fef2f2', dot: '#f87171' },
  'position-closed':    { color: '#9f1239', bg: '#fff1f2', dot: '#fb7185' },
};

const INTERNAL_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  contractsent:     { color: '#92400e', bg: '#fefce8', dot: '#fbbf24' },
  contractsigned:   { color: '#166534', bg: '#f0fdf4', dot: '#4ade80' },
  invoicesent:      { color: '#0369a1', bg: '#f0f9ff', dot: '#38bdf8' },
  paymentreceived:  { color: '#0f766e', bg: '#f0fdfa', dot: '#2dd4bf' },
  followup:         { color: '#7e22ce', bg: '#faf5ff', dot: '#c084fc' },
};

interface StatusBadgeProps {
  status: string;
  type?: 'stage' | 'internal';
}

export function StatusBadge({ status, type = 'stage' }: StatusBadgeProps) {
  const label =
    type === 'stage'
      ? STAGE_LABELS[status.toLowerCase()] || status
      : INTERNAL_LABELS[status.toLowerCase()] || status;

  const config =
    type === 'stage'
      ? STAGE_CONFIG[status.toLowerCase()] || { color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' }
      : INTERNAL_CONFIG[status.toLowerCase()] || { color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' };

  return (
    <span
      className="neo-card-xs inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border-l-2"
      style={{
        color: config.color,
        backgroundColor: config.bg,
        borderLeftColor: config.dot,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: config.dot }}
      />
      {label}
    </span>
  );
}

export function VerifiedBadge({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const badgeSizes = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-[11px] gap-1.5',
    lg: 'px-3.5 py-1.5 text-[13px] gap-2',
  };

  return (
    <span
      title="Verified Profile"
      className={`neo-card-xs inline-flex items-center font-bold border-l-2 ${badgeSizes[size]} ${className}`}
      style={{ color: '#047857', backgroundColor: '#ecfdf5', borderLeftColor: '#34d399' }}
    >
      <ShieldCheck className={`${iconSizes[size]} text-emerald-600`} />
      <span>Verified</span>
    </span>
  );
}
