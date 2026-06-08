import { STAGE_LABELS, INTERNAL_LABELS } from '@/lib/helpers';

const STAGE_COLORS: Record<string, string> = {
  interview: 'bg-green-100 text-green-800',
  'offer-accepted': 'bg-green-200 text-green-900',
  'offer-sent': 'bg-blue-100 text-blue-800',
  shortlist: 'bg-blue-100 text-blue-800',
  calllist: 'bg-yellow-100 text-yellow-800',
  longlist: 'bg-orange-100 text-orange-800',
  mapping: 'bg-purple-100 text-purple-800',
  universe: 'bg-gray-100 text-gray-600',
  closed: 'bg-red-100 text-red-700',
  'position-closed': 'bg-red-100 text-red-700',
};

const INTERNAL_COLORS: Record<string, string> = {
  contractsigned: 'bg-green-100 text-green-800',
  paymentreceived: 'bg-green-100 text-green-800',
  invoicesent: 'bg-blue-100 text-blue-800',
  contractsent: 'bg-yellow-100 text-yellow-800',
  followup: 'bg-orange-100 text-orange-800',
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
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${colorClass}`}
    >
      {label}
    </span>
  );
}
