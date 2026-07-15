// --- FUZZY MATCHING UTILITIES ----------------------------------------

/**
 * Normalizes a string for comparison (lowercase, trims, removes special characters depending on type).
 */
export function normalizeString(str: string | null | undefined, type: "name" | "email" | "mobile" | "company" = "name"): string {
  if (!str) return "";
  let s = str.toLowerCase().trim();
  
  if (type === "mobile") {
    // Remove all non-numeric characters for mobile
    s = s.replace(/\D/g, '');
  } else if (type === "email") {
    // Basic trim for email
  } else {
    // For name and company, remove common punctuation and extra spaces
    s = s.replace(/[.,\-_]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return s;
}

/**
 * Calculates the Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Calculates a similarity score between 0 and 100.
 */
export function calculateSimilarityScore(a: string | null | undefined, b: string | null | undefined, type: "name" | "email" | "mobile" | "company" = "name"): number {
  const normA = normalizeString(a, type);
  const normB = normalizeString(b, type);
  
  if (!normA && !normB) return 0; // Both empty doesn't mean a 100% match, it means we can't match on this
  if (!normA || !normB) return 0; // One is empty, no match

  if (normA === normB) return 100;

  const distance = levenshteinDistance(normA, normB);
  const maxLength = Math.max(normA.length, normB.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  return Math.max(0, similarity);
}

/**
 * Evaluates whether an incoming candidate is a duplicate of an existing candidate based on multiple combinations.
 * Returns an object with { isDuplicate, reason, scores }.
 */
export function evaluateCandidateMatch(incoming: any, existing: any): { isDuplicate: boolean, reason: string | null, scores: any } {
  const nameScore = calculateSimilarityScore(incoming.name, existing.name, "name");
  const emailScore = calculateSimilarityScore(incoming.email, existing.email, "email");
  const mobileScore = calculateSimilarityScore(incoming.mobile || incoming.phone, existing.mobile, "mobile");
  const companyScore = calculateSimilarityScore(incoming.company, existing.company, "company");

  const scores = { nameScore, emailScore, mobileScore, companyScore };

  // Combination A: Exact/Near-Exact Mobile
  if (mobileScore > 90) {
    return { isDuplicate: true, reason: `Matched: Mobile (${Math.round(mobileScore)}% Similarity)`, scores };
  }

  // Combination B: Exact/Near-Exact Email
  if (emailScore > 90) {
    return { isDuplicate: true, reason: `Matched: Email (${Math.round(emailScore)}% Similarity)`, scores };
  }

  // Combination C: High Name + Moderate Email
  if (nameScore > 80 && emailScore > 70) {
    return { isDuplicate: true, reason: `Matched: Name & Email`, scores };
  }

  // Combination D: High Name + Moderate Mobile
  if (nameScore > 80 && mobileScore > 70) {
    return { isDuplicate: true, reason: `Matched: Name & Mobile`, scores };
  }

  // Combination E: High Name + High Company (No contact info fallback)
  if (nameScore > 85 && companyScore > 85) {
    return { isDuplicate: true, reason: `Matched: Name & Company`, scores };
  }

  return { isDuplicate: false, reason: null, scores };
}
