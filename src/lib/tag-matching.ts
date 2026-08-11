/**
 * Tag Overlap Match Score Engine (#10 & Executive Search UX)
 * Computes exact match overlap between candidate tags (expTags, dreamRoles, etc.)
 * and mandate search tags (sectors, highlights, targetCompanies).
 */

export interface TagMatchResult {
  scorePct: number;
  matchedTags: string[];
  missingTags: string[];
  totalMandateTags: number;
  badgeLabel: string;
  badgeColor: string;
}

export function computeTagOverlapScore(
  candidateTags: string[] = [],
  mandateTags: string[] = []
): TagMatchResult {
  const candSet = new Set((candidateTags || []).map((t) => t.trim().toLowerCase()));
  const reqList = (mandateTags || []).map((t) => t.trim()).filter(Boolean);

  if (reqList.length === 0) {
    return {
      scorePct: 100,
      matchedTags: [],
      missingTags: [],
      totalMandateTags: 0,
      badgeLabel: "100% Eligible",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    };
  }

  const matchedTags: string[] = [];
  const missingTags: string[] = [];

  for (const tag of reqList) {
    const norm = tag.toLowerCase();
    let isMatched = false;

    // Direct string or partial match check
    for (const candTag of Array.from(candSet)) {
      if (candTag.includes(norm) || norm.includes(candTag)) {
        isMatched = true;
        break;
      }
    }

    if (isMatched) {
      matchedTags.push(tag);
    } else {
      missingTags.push(tag);
    }
  }

  const scorePct = Math.round((matchedTags.length / reqList.length) * 100);

  let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
  if (scorePct >= 80) {
    badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold";
  } else if (scorePct >= 50) {
    badgeColor = "bg-amber-50 text-amber-900 border-amber-200 font-bold";
  } else if (scorePct > 0) {
    badgeColor = "bg-sky-50 text-sky-800 border-sky-200";
  }

  return {
    scorePct,
    matchedTags,
    missingTags,
    totalMandateTags: reqList.length,
    badgeLabel: `${matchedTags.length}/${reqList.length} Tags Matched (${scorePct}%)`,
    badgeColor,
  };
}
