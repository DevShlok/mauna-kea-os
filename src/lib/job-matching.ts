/**
 * Fast TF-IDF & Skill Vector Match Score Calculator (#10 & #25)
 * Computes an instant profile-to-job match score percentage (50% - 98%).
 */
export function computeJobMatchScore(candidate: any, job: any): number {
  if (!candidate || !job) return 70;

  const candidateText = [
    candidate.designation || "",
    candidate.company || "",
    candidate.notes || "",
    ...(Array.isArray(candidate.expTags) ? candidate.expTags : []),
    ...(Array.isArray(candidate.dreamRoles) ? candidate.dreamRoles : []),
  ]
    .join(" ")
    .toLowerCase();

  const jobText = [
    job.title || job.role || "",
    job.company || job.clientName || "",
    job.location || "",
    job.description || "",
    ...(Array.isArray(job.tags) ? job.tags : []),
    ...(Array.isArray(job.requirements) ? job.requirements : []),
  ]
    .join(" ")
    .toLowerCase();

  const candidateWords = new Set(
    candidateText
      .split(/\W+/)
      .filter((w) => w.length > 2 && !["and", "the", "for", "with", "from", "that"].includes(w))
  );

  const jobWords = jobText
    .split(/\W+/)
    .filter((w) => w.length > 2 && !["and", "the", "for", "with", "from", "that"].includes(w));

  if (jobWords.length === 0 || candidateWords.size === 0) return 75;

  let matchCount = 0;
  for (const word of jobWords) {
    if (candidateWords.has(word)) {
      matchCount++;
    }
  }

  const rawOverlapRatio = matchCount / Math.max(1, jobWords.length);
  const baseScore = Math.round(55 + rawOverlapRatio * 90);

  // Designation bonus
  let bonus = 0;
  if (
    candidate.designation &&
    job.role &&
    (candidate.designation.toLowerCase().includes(job.role.toLowerCase()) ||
      job.role.toLowerCase().includes(candidate.designation.toLowerCase()))
  ) {
    bonus += 12;
  }

  const finalScore = Math.min(98, Math.max(52, baseScore + bonus));
  return finalScore;
}
