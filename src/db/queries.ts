import { db } from './index';
import { eq, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import {
  mandates, mandateCandidates, flCandidates, flSubmissions, flReferences,
  flFollowUps, flActivities, frameworks, frameworkCategories,
  frameworkCriteria, platformUsers, candidateReports
} from './schema';

// ─── MANDATES ────────────────────────────────────────────
export const getMandates = unstable_cache(async () => {
  const rows = await db.select().from(mandates).orderBy(mandates.id);
  const cands = await db.select().from(mandateCandidates);
  return rows.map(m => ({
    ...m,
    sectors: (m.sectors ?? []) as string[],
    candidates: cands.filter(c => c.mandateId === m.id),
  }));
}, ['getMandates'], { tags: ['dashboard-data'] });

export const getMandateById = unstable_cache(async (id: number) => {
  const [mandate] = await db.select().from(mandates).where(eq(mandates.id, id));
  if (!mandate) return null;
  const cands = await db.select().from(mandateCandidates).where(eq(mandateCandidates.mandateId, id));
  return {
    ...mandate,
    sectors: (mandate.sectors ?? []) as string[],
    candidates: cands,
  };
}, ['getMandateById'], { tags: ['dashboard-data'] });

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

export const getAllMandateCandidates = unstable_cache(async () => {
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
}, ['getAllMandateCandidates'], { tags: ['dashboard-data'] });

export const getMandateCandidateByExtId = unstable_cache(async (extId: string) => {
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
}, ['getMandateCandidateByExtId'], { tags: ['dashboard-data'] });

// ─── FLOAT LIST CANDIDATES ───────────────────────────────
export const getFlCandidates = unstable_cache(async () => {
  const rows = await db.select().from(flCandidates).orderBy(flCandidates.id);
  return rows.map(c => ({
    ...c,
    qual: (c.qual ?? []) as string[],
    dreamRoles: (c.dreamRoles ?? []) as string[],
    dreamCos: (c.dreamCos ?? []) as string[],
    expTags: (c.expTags ?? []) as string[],
  }));
}, ['getFlCandidates'], { tags: ['dashboard-data'] });

export const getFlCandidateById = unstable_cache(async (id: string) => {
  const [cand] = await db.select().from(flCandidates).where(eq(flCandidates.id, id));
  if (!cand) return null;
  const activities = await db.select().from(flActivities).where(eq(flActivities.candId, id));
  const submissions = await db.select().from(flSubmissions).where(eq(flSubmissions.candId, id));
  const followUps = await db.select().from(flFollowUps).where(eq(flFollowUps.candId, id));
  const references = await db.select().from(flReferences).where(eq(flReferences.candId, id));
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
}, ['getFlCandidateById'], { tags: ['dashboard-data'] });

// ─── SUBMISSIONS ─────────────────────────────────────────
export const getSubmissions = unstable_cache(async () => {
  const rows = await db.select().from(flSubmissions).orderBy(flSubmissions.dateShared);
  return rows.map(s => ({ ...s, via: (s.via ?? []) as string[] }));
}, ['getSubmissions'], { tags: ['dashboard-data'] });

// ─── FOLLOW-UPS ──────────────────────────────────────────
export const getFollowUps = unstable_cache(async () => {
  return db.select().from(flFollowUps).orderBy(flFollowUps.dueDate);
}, ['getFollowUps'], { tags: ['dashboard-data'] });

// ─── FRAMEWORKS ──────────────────────────────────────────
export const getFrameworks = unstable_cache(async () => {
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
}, ['getFrameworks'], { tags: ['dashboard-data'] });

export const getFrameworkById = unstable_cache(async (id: string) => {
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
}, ['getFrameworkById'], { tags: ['dashboard-data'] });

// ─── USERS ───────────────────────────────────────────────
export const getPlatformUsers = unstable_cache(async () => {
  return db.select().from(platformUsers);
}, ['getPlatformUsers'], { tags: ['dashboard-data'] });

// ─── ANALYTICS ───────────────────────────────────────────
export const getAnalyticsData = unstable_cache(async () => {
  const [mandateCount] = await db.select({ count: sql<number>`count(*)` }).from(mandates);
  const [candCount] = await db.select({ count: sql<number>`count(*)` }).from(mandateCandidates);
  const [flCount] = await db.select({ count: sql<number>`count(*)` }).from(flCandidates);
  return {
    activeMandates: Number(mandateCount?.count ?? 0),
    totalCandidates: Number(candCount?.count ?? 0),
    flTotal: Number(flCount?.count ?? 0),
  };
}, ['getAnalyticsData'], { tags: ['dashboard-data'] });
