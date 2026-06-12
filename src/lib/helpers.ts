// Shared stage labels and helpers used across the app

export const STAGE_LABELS: Record<string, string> = {
  universe: 'Universe',
  mapping: 'Mapping',
  longlist: 'Long List',
  calllist: 'Call List',
  shortlist: 'Shortlist',
  interview: 'Interview',
  'offer-sent': 'Offer Sent',
  'offer-accepted': 'Offer Accepted',
  closed: 'Closed',
  'position-closed': 'Closed',
};

export const INTERNAL_LABELS: Record<string, string> = {
  contractsent: 'Contract Sent',
  contractsigned: 'Contract Signed',
  invoicesent: 'Invoice Sent',
  paymentreceived: 'Payment Received',
  followup: 'Follow Up',
};

export const STAGE_OPTIONS = Object.entries(STAGE_LABELS)
  .filter(([k]) => k !== 'position-closed')
  .map(([value, label]) => ({ value, label }));

export const INTERNAL_OPTIONS = Object.entries(INTERNAL_LABELS).map(
  ([value, label]) => ({ value, label })
);

export function stageLabel(s: string) {
  return STAGE_LABELS[s] || s;
}

export function getDaysOpen(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 14;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export function getClosurePercent(status: string) {
  if (status === 'offer-accepted') return 90;
  if (status === 'offer-sent') return 80;
  if (status === 'interview') return 65;
  if (status === 'shortlist') return 45;
  if (status === 'calllist') return 35;
  if (status === 'longlist') return 25;
  if (status === 'mapping') return 20;
  return 5;
}

export function formatMandateCtc(ctcStr: string | null) {
  if (!ctcStr) return "-";
  if (ctcStr.toLowerCase().includes('cr')) return ctcStr; 

  // Remove any 'L' or 'lakhs' to standardize parsing
  let clean = ctcStr.replace(/lakhs?|l/ig, '').trim();
  
  return clean.replace(/\d+(\.\d+)?/g, (match) => {
    const num = parseFloat(match);
    if (num >= 100) {
      return (num / 100).toFixed(1).replace(/\.0$/, '') + 'Cr';
    }
    return num + 'L';
  });
}
