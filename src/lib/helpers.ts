// Shared stage labels and helpers used across the app

export const STAGE_LABELS: Record<string, string> = {
  universe: 'Universe',
  mapping: 'Mapping',
  longlist: 'Long List',
  calllist: 'Call List',
  shortlist: 'Shortlist',
  interview: 'Interview',
  'client-shortlisted': 'Candidate Shortlisted',
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
  if (status === 'client-shortlisted') return 55;
  if (status === 'shortlist') return 45;
  if (status === 'calllist') return 35;
  if (status === 'longlist') return 25;
  if (status === 'mapping') return 20;
  return 5;
}

export function parseCtcInput(val: string | number | null | undefined): number | null {
  if (val == null || val === "") return null;

  if (typeof val === "number") {
    if (isNaN(val) || val <= 0) return null;
    if (val >= 10000) return parseFloat((val / 100000).toFixed(2));
    return parseFloat(val.toFixed(2));
  }

  const str = String(val).trim().toLowerCase();
  if (!str || str === "—" || str === "-" || str === "null" || str === "undefined") return null;

  const isCr = /cr|crore/.test(str);

  const cleanStr = str.replace(/,/g, '');
  const match = cleanStr.match(/\d+(\.\d+)?/);
  if (!match) return null;

  let num = parseFloat(match[0]);
  if (isNaN(num) || num <= 0) return null;

  if (isCr) {
    return parseFloat((num * 100).toFixed(2));
  }

  if (num >= 10000) {
    return parseFloat((num / 100000).toFixed(2));
  }

  return parseFloat(num.toFixed(2));
}

export function formatMandateCtc(ctcStr: string | null | undefined): string {
  if (!ctcStr || !ctcStr.trim()) return "-";
  const str = ctcStr.trim();

  if (/cr|lacs|lakhs|lpa/i.test(str)) {
    return str;
  }

  return str.replace(/\d+(\.\d+)?/g, (match) => {
    const num = parseFloat(match);
    if (isNaN(num)) return match;
    if (num >= 10000) {
      const lacs = num / 100000;
      return lacs >= 100 ? `${(lacs / 100).toFixed(1).replace(/\.0$/, '')}Cr` : `${lacs}L`;
    }
    if (num >= 100) {
      return (num / 100).toFixed(1).replace(/\.0$/, '') + 'Cr';
    }
    return num + 'L';
  });
}

export function formatCtcValue(val: number | string | null | undefined, currencyCode: string | null = "INR"): string {
  if (val == null || val === "" || val === 0) return "—";

  let numVal: number | null = null;
  if (typeof val === "number") {
    if (isNaN(val) || val <= 0) return "—";
    numVal = val >= 10000 ? val / 100000 : val;
  } else {
    numVal = parseCtcInput(val);
  }

  if (numVal == null || numVal <= 0) return "—";

  const cur = currencyCode || "INR";

  if (numVal >= 100) {
    const cr = numVal / 100;
    const crStr = Number.isInteger(cr) ? cr.toString() : parseFloat(cr.toFixed(2)).toString();
    return `${cur} ${crStr} Cr`;
  } else {
    const lStr = Number.isInteger(numVal) ? numVal.toString() : parseFloat(numVal.toFixed(2)).toString();
    return `${cur} ${lStr} Lacs`;
  }
}

export function getCleanLinkedInUrl(val: string | null | undefined, candidateName?: string): string {
  const str = (val || "").trim();

  if (str) {
    if (str.includes("google.com/search") || str.includes("google.co.in/search")) {
      try {
        const urlObj = new URL(str.startsWith("http") ? str : `https://${str}`);
        const q = urlObj.searchParams.get("q") || candidateName || "";
        const cleanQ = q.replace(/\b(linkedin|profile)\b/gi, "").trim();
        return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(cleanQ || q)}`;
      } catch (e) {
        // fallthrough
      }
    }

    if (str.includes("linkedin.com")) {
      return str.startsWith("http") ? str : `https://${str}`;
    }

    if (str.startsWith("http://") || str.startsWith("https://")) {
      return str;
    }

    if (!str.includes(" ") && !str.includes("/")) {
      return `https://www.linkedin.com/in/${str.replace(/^@/, '')}`;
    }

    return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(str)}`;
  }

  if (candidateName && candidateName.trim()) {
    return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(candidateName.trim())}`;
  }

  return "https://www.linkedin.com";
}
