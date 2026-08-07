/**
 * Rubric types and scoring logic shared between server actions and client components.
 * This file is NOT a server action — it can be safely imported in both contexts.
 */

export type RubricScores = {
  B1: number; B2: number; B3: number; B4: number;
  P1: number; P2: number; P3: number; P4: number; P5: number;
  C1: number; C2: number; C3: number;
  notes: { behavioral: string; psychometric: string; culturalFit: string };
};

export function computeTier(scores: RubricScores): {
  total: number;
  tier: "A" | "B" | "C";
  breakdown: { behavioral: number; psychometric: number; culturalFit: number };
} {
  // Behavioral: 4 questions x max 5 pts x multiplier 2 = max 40
  const behavioral  = (scores.B1 + scores.B2 + scores.B3 + scores.B4) * 2;
  // Psychometric: 5 questions x max 5 pts x multiplier 1.4 = max 35
  const psychometric = (scores.P1 + scores.P2 + scores.P3 + scores.P4 + scores.P5) * 1.4;
  // Cultural Fit: C1 x2 (max 10) + C2 x1.4 (max 7) + C3 x1.6 (max 8) = max 25
  const culturalFit  = scores.C1 * 2 + scores.C2 * 1.4 + scores.C3 * 1.6;

  const total = Math.round(behavioral + psychometric + culturalFit);
  const tier: "A" | "B" | "C" = total >= 80 ? "A" : total >= 60 ? "B" : "C";

  return {
    total,
    tier,
    breakdown: {
      behavioral: Math.round(behavioral),
      psychometric: Math.round(psychometric),
      culturalFit: Math.round(culturalFit),
    },
  };
}