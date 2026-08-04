import { STAGE_LABELS, INTERNAL_LABELS } from '@/lib/helpers';

const STAGE_COLORS: Record<string, string> = {
  universe: 'bg-gray-100 text-gray-700',
  mapping: 'bg-purple-100 text-purple-800',
  longlist: 'bg-orange-100 text-orange-800',
  calllist: 'bg-amber-100 text-amber-800',
  shortlist: 'bg-blue-100 text-[#133255]',
  interview: 'bg-emerald-100 text-emerald-800',
  'client-shortlisted': 'bg-emerald-100 text-emerald-800',
  'offer-sent': 'bg-indigo-100 text-indigo-800',
  'offer-accepted': 'bg-teal-100 text-teal-800',
  closed: 'bg-red-100 text-red-800',
  'position-closed': 'bg-rose-100 text-rose-800',
};

const INTERNAL_COLORS: Record<string, string> = {
  contractsent: 'bg-yellow-100 text-yellow-800',
  contractsigned: 'bg-green-100 text-green-800',
  invoicesent: 'bg-sky-100 text-sky-800',
  paymentreceived: 'bg-teal-100 text-teal-800',
  followup: 'bg-fuchsia-100 text-fuchsia-800',
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

  const colorClass =
    type === 'stage'
      ? STAGE_COLORS[status.toLowerCase()] || 'bg-gray-100 text-gray-600'
      : INTERNAL_COLORS[status.toLowerCase()] || 'bg-gray-100 text-gray-600';

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[13px] font-bold uppercase tracking-wider ${colorClass}`}
    >
      {label}
    </span>
  );
}

import { ShieldCheck } from 'lucide-react';

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
      className={`inline-flex items-center font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 neo-btn-sm shadow-sm ${badgeSizes[size]} ${className}`}
    >
      <ShieldCheck className={`${iconSizes[size]} text-emerald-600`} />
      <span>Verified</span>
    </span>
  );
}
