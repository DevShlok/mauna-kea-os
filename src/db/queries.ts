import { db } from './index';
import { eq, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import {
  mandates, mandateCandidates, candidates, floats, floatReferences,
  floatFollowUps, floatActivities, frameworks, frameworkCategories,
  frameworkCriteria, platformUsers, candidateReports
} from './schema';

// ─── MANDATES ────────────────────────────────────────────
export const getMandates = async () => {
  const rows = await db.select().from(mandates).orderBy(mandates.id);
  const cands = await db.select().from(mandateCandidates);
  return rows.map(m => ({
    ...m,
    sectors: (m.sectors ?? []) as string[],
    candidates: cands.filter(c => c.mandateId === m.id),
  }));
};

export const getMandateById = async (id: number) => {
  const [mandate] = await db.select().from(mandates).where(eq(mandates.id, id));
  if (!mandate) return null;
  const cands = await db.select().from(mandateCandidates).where(eq(mandateCandidates.mandateId, id));
  return {
    ...mandate,
    sectors: (mandate.sectors ?? []) as string[],
    candidates: cands,
  };
};

export async function updateMandateStatus(id: number, field: 'status' | 'internalStatus', value: string) {
  if (field === 'status') {
    await db.update(mandates).set({ status: value }).where(eq(mandates.id, id));
  } else {
    await db.update(mandates).set({ internalStatus: value }).where(eq(mandates.id, id));
  }
}

export async function updateCandidateStage(candId: number, newStage: string) {
  await db.update(mandateCandidates).set({ stage: newStage }).where(eq(mandateCandidates.id, candId));
}

export const getAllMandateCandidates = async () => {
  const cands = await db.select({
    id: mandateCandidates.id,
    externalId: mandateCandidates.externalId,
    name: mandateCandidates.name,
    company: mandateCandidates.company,
    role: mandateCandidates.role,
    stage: mandateCandidates.stage,
    score: mandateCandidates.score,
    hasReport: mandateCandidates.hasReport,
    initials: mandateCandidates.initials,
    cvText: mandateCandidates.cvText,
    mandateId: mandateCandidates.mandateId,
    mandateRole: mandates.role,
    mandateCompany: mandates.company,
  })
  .from(mandateCandidates)
  .innerJoin(mandates, eq(mandateCandidates.mandateId, mandates.id));
  return cands;
};

export const getMandateCandidateByExtId = async (extId: string) => {
  const [cand] = await db.select({
    id: mandateCandidates.id,
    externalId: mandateCandidates.externalId,
    name: mandateCandidates.name,
    company: mandateCandidates.company,
    role: mandateCandidates.role,
    stage: mandateCandidates.stage,
    score: mandateCandidates.score,
    hasReport: mandateCandidates.hasReport,
    initials: mandateCandidates.initials,
    cvText: mandateCandidates.cvText,
    mandateId: mandateCandidates.mandateId,
    mandateRole: mandates.role,
    mandateCompany: mandates.company,
  })
  .from(mandateCandidates)
  .innerJoin(mandates, eq(mandateCandidates.mandateId, mandates.id))
  .where(eq(mandateCandidates.externalId, extId));
  return cand ?? null;
};

// ─── CANDIDATES (MASTER) ─────────────────────────────────
export const getCandidates = async () => {
  const rows = await db.select().from(candidates).orderBy(candidates.id);
  return rows.map(c => ({
    ...c,
    qual: (c.qual ?? []) as string[],
    dreamRoles: (c.dreamRoles ?? []) as string[],
    dreamCos: (c.dreamCos ?? []) as string[],
    expTags: (c.expTags ?? []) as string[],
  }));
};

export const getCandidateById = async (id: string) => {
  const [cand] = await db.select().from(candidates).where(eq(candidates.id, id));
  if (!cand) return null;
  const activities = await db.select().from(floatActivities).where(eq(floatActivities.candId, id));
  const submissions = await db.select().from(floats).where(eq(floats.candId, id));
  const followUps = await db.select().from(floatFollowUps).where(eq(floatFollowUps.candId, id));
  const references = await db.select().from(floatReferences).where(eq(floatReferences.candId, id));
  return {
    ...cand,
    qual: (cand.qual ?? []) as string[],
    dreamRoles: (cand.dreamRoles ?? []) as string[],
    dreamCos: (cand.dreamCos ?? []) as string[],
    expTags: (cand.expTags ?? []) as string[],
    activities,
    submissions: submissions.map(s => ({ ...s, via: (s.via ?? []) as string[] })),
    followUps,
    references,
  };
};

// ─── FLOATS (SUBMISSIONS) ────────────────────────────────
export const getFloats = async () => {
  const rows = await db.select().from(floats).orderBy(floats.dateShared);
  return rows.map(s => ({ ...s, via: (s.via ?? []) as string[] }));
};

// ─── FOLLOW-UPS ──────────────────────────────────────────
export const getFollowUps = async () => {
  return db.select().from(floatFollowUps).orderBy(floatFollowUps.dueDate);
};

// ─── FRAMEWORKS ──────────────────────────────────────────
export const getFrameworks = async () => {
  const fws = await db.select().from(frameworks);
  const cats = await db.select().from(frameworkCategories);
  const crits = await db.select().from(frameworkCriteria);
  const reports = await db.select({ frameworkId: candidateReports.frameworkId, candidateId: candidateReports.candidateId }).from(candidateReports);
  const mCands = await db.select({ id: mandateCandidates.id, externalId: mandateCandidates.externalId, mandateId: mandateCandidates.mandateId }).from(mandateCandidates);

  return fws.map(fw => {
    const fwReports = reports.filter(r => r.frameworkId === fw.id);
    
    const uniqueMandates = new Set<number>();
    fwReports.forEach(r => {
      const isNum = !isNaN(Number(r.candidateId));
      const candMatch = isNum 
        ? mCands.find(mc => mc.id === Number(r.candidateId) || mc.externalId === r.candidateId)
        : mCands.find(mc => mc.externalId === r.candidateId);
        
      if (candMatch) {
        uniqueMandates.add(candMatch.mandateId);
      }
    });
    
    const actualUsedIn = uniqueMandates.size > 0 ? uniqueMandates.size : (fwReports.length > 0 ? 1 : (fw.usedIn || 0));

    return {
      ...fw,
      usedIn: actualUsedIn,
      categories: cats
        .filter(c => c.frameworkId === fw.id)
        .map(c => ({
          ...c,
          criteria: crits.filter(cr => cr.categoryId === c.id),
        })),
    };
  });
};

export const getFrameworkById = async (id: string) => {
  const [fw] = await db.select().from(frameworks).where(eq(frameworks.id, id));
  if (!fw) return null;
  const cats = await db.select().from(frameworkCategories).where(eq(frameworkCategories.frameworkId, id));
  const crits = await db.select().from(frameworkCriteria);
  return {
    ...fw,
    categories: cats.map(c => ({
      ...c,
      criteria: crits.filter(cr => cr.categoryId === c.id),
    })),
  };
};

// ─── USERS ───────────────────────────────────────────────
export const getPlatformUsers = async () => {
  return db.select().from(platformUsers);
};

// ─── ANALYTICS ───────────────────────────────────────────
export const getAnalyticsData = async () => {
  const [mandateCount] = await db.select({ count: sql<number>`count(*)` }).from(mandates);
  const [candCount] = await db.select({ count: sql<number>`count(*)` }).from(mandateCandidates);
  const [flCount] = await db.select({ count: sql<number>`count(*)` }).from(candidates);
  return {
    activeMandates: Number(mandateCount?.count ?? 0),
    totalCandidates: Number(candCount?.count ?? 0),
    flTotal: Number(flCount?.count ?? 0),
  };
};
