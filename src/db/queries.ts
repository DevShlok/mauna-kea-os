import { db } from './index';
import { eq, sql } from 'drizzle-orm';
import {
  mandates, mandateCandidates, flCandidates, flSubmissions,
  flFollowUps, flActivities, frameworks, frameworkCategories,
  frameworkCriteria, platformUsers
} from './schema';

// ─── MANDATES ────────────────────────────────────────────
export async function getMandates() {
  const rows = await db.select().from(mandates).orderBy(mandates.id);
  const cands = await db.select().from(mandateCandidates);
  return rows.map(m => ({
    ...m,
    sectors: (m.sectors ?? []) as string[],
    candidates: cands.filter(c => c.mandateId === m.id),
  }));
}

export async function getMandateById(id: number) {
  const [mandate] = await db.select().from(mandates).where(eq(mandates.id, id));
  if (!mandate) return null;
  const cands = await db.select().from(mandateCandidates).where(eq(mandateCandidates.mandateId, id));
  return {
    ...mandate,
    sectors: (mandate.sectors ?? []) as string[],
    candidates: cands,
  };
}

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

export async function getAllMandateCandidates() {
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
    mandateId: mandateCandidates.mandateId,
    mandateRole: mandates.role,
    mandateCompany: mandates.company,
  })
  .from(mandateCandidates)
  .innerJoin(mandates, eq(mandateCandidates.mandateId, mandates.id));
  return cands;
}

export async function getMandateCandidateByExtId(extId: string) {
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
    mandateId: mandateCandidates.mandateId,
    mandateRole: mandates.role,
    mandateCompany: mandates.company,
  })
  .from(mandateCandidates)
  .innerJoin(mandates, eq(mandateCandidates.mandateId, mandates.id))
  .where(eq(mandateCandidates.externalId, extId));
  return cand ?? null;
}

// ─── FLOAT LIST CANDIDATES ───────────────────────────────
export async function getFlCandidates() {
  const rows = await db.select().from(flCandidates).orderBy(flCandidates.id);
  return rows.map(c => ({
    ...c,
    qual: (c.qual ?? []) as string[],
    dreamRoles: (c.dreamRoles ?? []) as string[],
    dreamCos: (c.dreamCos ?? []) as string[],
    expTags: (c.expTags ?? []) as string[],
  }));
}

export async function getFlCandidateById(id: string) {
  const [cand] = await db.select().from(flCandidates).where(eq(flCandidates.id, id));
  if (!cand) return null;
  const activities = await db.select().from(flActivities).where(eq(flActivities.candId, id));
  const submissions = await db.select().from(flSubmissions).where(eq(flSubmissions.candId, id));
  const followUps = await db.select().from(flFollowUps).where(eq(flFollowUps.candId, id));
  return {
    ...cand,
    qual: (cand.qual ?? []) as string[],
    dreamRoles: (cand.dreamRoles ?? []) as string[],
    dreamCos: (cand.dreamCos ?? []) as string[],
    expTags: (cand.expTags ?? []) as string[],
    activities,
    submissions: submissions.map(s => ({ ...s, via: (s.via ?? []) as string[] })),
    followUps,
  };
}

// ─── SUBMISSIONS ─────────────────────────────────────────
export async function getSubmissions() {
  const rows = await db.select().from(flSubmissions).orderBy(flSubmissions.dateShared);
  return rows.map(s => ({ ...s, via: (s.via ?? []) as string[] }));
}

// ─── FOLLOW-UPS ──────────────────────────────────────────
export async function getFollowUps() {
  return db.select().from(flFollowUps).orderBy(flFollowUps.dueDate);
}

// ─── FRAMEWORKS ──────────────────────────────────────────
export async function getFrameworks() {
  const fws = await db.select().from(frameworks);
  const cats = await db.select().from(frameworkCategories);
  const crits = await db.select().from(frameworkCriteria);
  return fws.map(fw => ({
    ...fw,
    categories: cats
      .filter(c => c.frameworkId === fw.id)
      .map(c => ({
        ...c,
        criteria: crits.filter(cr => cr.categoryId === c.id),
      })),
  }));
}

export async function getFrameworkById(id: string) {
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
}

// ─── USERS ───────────────────────────────────────────────
export async function getPlatformUsers() {
  return db.select().from(platformUsers);
}

// ─── ANALYTICS ───────────────────────────────────────────
export async function getAnalyticsData() {
  const [mandateCount] = await db.select({ count: sql<number>`count(*)` }).from(mandates);
  const [candCount] = await db.select({ count: sql<number>`count(*)` }).from(mandateCandidates);
  const [flCount] = await db.select({ count: sql<number>`count(*)` }).from(flCandidates);
  return {
    activeMandates: Number(mandateCount?.count ?? 0),
    totalCandidates: Number(candCount?.count ?? 0),
    flTotal: Number(flCount?.count ?? 0),
  };
}
