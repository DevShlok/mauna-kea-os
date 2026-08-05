import { db } from "@/db";
import { masterClients } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { getCandidateById } from "@/db/queries";

export async function getSuggestedCompanies(candId: string): Promise<string[]> {
  const candidate = await getCandidateById(candId);
  if (!candidate) return [];

  const pastCos = (candidate.pastCompanies as string[]) ?? [];
  const currentCo = candidate.company;
  const expTags = (candidate.expTags as string[]) ?? [];
  const knownCompanies = [currentCo, ...pastCos].filter(Boolean) as string[];

  // Step 1: Find companies by candidate's industry/exp tags
  let byIndustryNames: string[] = [];
  if (expTags.length > 0) {
    const byIndustry = await db
      .select({ companyName: masterClients.companyName })
      .from(masterClients)
      .where(inArray(masterClients.industry, expTags))
      .limit(20);
    byIndustryNames = byIndustry.map((c) => c.companyName).filter(Boolean);
  }

  // Step 2: Find companies in the same industry as candidate's past/current companies
  let bySimilarIndustryNames: string[] = [];
  if (knownCompanies.length > 0) {
    const knownIndustries = await db
      .select({ industry: masterClients.industry })
      .from(masterClients)
      .where(inArray(masterClients.companyName, knownCompanies));

    const uniqueIndustries = Array.from(
      new Set(knownIndustries.map((c) => c.industry).filter(Boolean))
    ) as string[];

    if (uniqueIndustries.length > 0) {
      const bySimilar = await db
        .select({ companyName: masterClients.companyName })
        .from(masterClients)
        .where(inArray(masterClients.industry, uniqueIndustries))
        .limit(30);
      bySimilarIndustryNames = bySimilar.map((c) => c.companyName).filter(Boolean);
    }
  }

  // Step 3: Fallback if masterClients matching yields too few suggestions
  let generalFallback: string[] = [];
  if (byIndustryNames.length + bySimilarIndustryNames.length < 5) {
    const fallbackList = await db
      .select({ companyName: masterClients.companyName })
      .from(masterClients)
      .limit(20);
    generalFallback = fallbackList.map((c) => c.companyName).filter(Boolean);
  }

  // Step 4: Deduplicate and exclude already added dream companies and current/past companies
  const dreamCos = (candidate.dreamCos as string[]) ?? [];
  const excluded = new Set([
    ...dreamCos.map((c) => c.toLowerCase()),
    ...knownCompanies.map((c) => c.toLowerCase()),
  ]);

  const combined = [
    ...byIndustryNames,
    ...bySimilarIndustryNames,
    ...generalFallback,
  ];

  const suggestions: string[] = [];
  for (const comp of combined) {
    if (!excluded.has(comp.toLowerCase()) && !suggestions.includes(comp)) {
      suggestions.push(comp);
      if (suggestions.length >= 10) break;
    }
  }

  return suggestions;
}
