import { db } from './index';
import { eq, sql, getTableColumns, desc, and } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import {
  mandates, mandateCandidates, candidates, floats, floatReferences,
  floatFollowUps, floatActivities, frameworks, frameworkCategories,
  frameworkCriteria, platformUsers, candidateReports, candidateFiles
} from './schema';

// ─── MANDATES ────────────────────────────────────────────
export const getMandates = async () => {
  const rows = await db.select().from(mandates).where(eq(mandates.isDeleted, false)).orderBy(desc(mandates.id));
  const cands = await db.select().from(mandateCandidates);
  return rows.map(m => ({
    ...m,
    sectors: (m.sectors ?? []) as string[],
    candidates: cands.filter(c => c.mandateId === m.id),
  }));
};

export const getMandateById = async (id: number) => {
  const [mandate] = await db.select().from(mandates).where(and(eq(mandates.id, id), eq(mandates.isDeleted, false)));
  if (!mandate) return null;
  const cands = await db.select().from(mandateCandidates).where(eq(mandateCandidates.mandateId, id));
  return {
    ...mandate,
    sectors: (mandate.sectors ?? []) as string[],
    candidates: cands,
  };
};


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
  const { cvText, profilePic, ...safeCols } = getTableColumns(candidates);
  const rows = await db.select(safeCols).from(candidates).where(eq(candidates.isDeleted, false)).orderBy(desc(candidates.createdAt));
  return rows.map(c => ({
    ...c,
    qual: (c.qual ?? []) as any[],
    dreamRoles: (c.dreamRoles ?? []) as string[],
    dreamCos: (c.dreamCos ?? []) as string[],
    expTags: (c.expTags ?? []) as string[],
  }));
};

export const getCandidateById = async (id: string) => {
  const [cand] = await db.select().from(candidates).where(and(eq(candidates.id, id), eq(candidates.isDeleted, false)));
  if (!cand) return null;
  const activities = await db.select().from(floatActivities).where(eq(floatActivities.candId, id));
  
  // Fetch float submissions
  const floatSubmissions = await db.select().from(floats).where(and(eq(floats.candId, id), eq(floats.isDeleted, false)));
  
  // Fetch mandate submissions
  const mCands = await db.select({
    id: mandateCandidates.id,
    dateShared: mandateCandidates.createdAt,
    status: mandateCandidates.stage,
    client: mandates.company,
    role: mandates.role,
    consultant: sql<string>`'System'`
  })
  .from(mandateCandidates)
  .innerJoin(mandates, eq(mandateCandidates.mandateId, mandates.id))
  .where(and(eq(mandateCandidates.externalId, id), eq(mandates.isDeleted, false)));

  const submissionsMap = new Map();

  for (const m of mCands) {
    const key = `${m.client}-${m.role}`;
    submissionsMap.set(key, { 
      id: 'mnd-' + m.id, 
      client: m.client, 
      role: m.role, 
      consultant: m.consultant, 
      dateShared: m.dateShared ? new Date(m.dateShared).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : '', 
      status: m.status, 
      via: [],
      type: "Mandate"
    });
  }

  for (const s of floatSubmissions) {
    const key = `${s.client}-${s.role}`;
    if (submissionsMap.has(key)) {
      const existing = submissionsMap.get(key);
      existing.id = s.id;
      existing.via = (s.via ?? []) as string[];
      // Keep type as "Mandate" because it matches a mandate pipeline
    } else {
      submissionsMap.set(key, { 
        id: s.id, 
        client: s.client, 
        role: s.role, 
        consultant: s.consultant, 
        dateShared: s.dateShared, 
        status: s.status, 
        via: (s.via ?? []) as string[],
        type: "Float"
      });
    }
  }

  const submissions = Array.from(submissionsMap.values());

  const followUps = await db.select().from(floatFollowUps).where(eq(floatFollowUps.candId, id));
  const references = await db.select().from(floatReferences).where(eq(floatReferences.candId, id));
  const files = await db.select().from(candidateFiles).where(eq(candidateFiles.candId, id));
  
  return {
    ...cand,
    qual: (cand.qual ?? []) as any[],
    dreamRoles: (cand.dreamRoles ?? []) as string[],
    dreamCos: (cand.dreamCos ?? []) as string[],
    expTags: (cand.expTags ?? []) as string[],
    activities,
    submissions,
    followUps,
    references,
    files,
  };
};

// ─── FLOATS (SUBMISSIONS) ────────────────────────────────
export const getFloats = async () => {
  const rows = await db.select().from(floats).where(eq(floats.isDeleted, false)).orderBy(desc(floats.dateShared));
  return rows.map(s => ({ ...s, via: (s.via ?? []) as string[] }));
};

// ─── FOLLOW-UPS ──────────────────────────────────────────
export const getFollowUps = async () => {
  return db.select().from(floatFollowUps).orderBy(floatFollowUps.dueDate);
};

// ─── FRAMEWORKS ──────────────────────────────────────────
export const getFrameworks = async () => {
  const fws = await db.select().from(frameworks).where(eq(frameworks.isDeleted, false)).orderBy(desc(frameworks.createdAt));
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
  const [fw] = await db.select().from(frameworks).where(and(eq(frameworks.id, id), eq(frameworks.isDeleted, false)));
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
  const users = await db.select().from(platformUsers).where(eq(platformUsers.isDeleted, false)).orderBy(desc(platformUsers.createdAt));
  const uniqueUsersMap = new Map();
  for (const user of users) {
    if (user.email && !uniqueUsersMap.has(user.email.toLowerCase())) {
      uniqueUsersMap.set(user.email.toLowerCase(), user);
    }
  }
  return Array.from(uniqueUsersMap.values());
};

export const getUserByEmail = async (email: string) => {
  const [user] = await db.select().from(platformUsers).where(and(eq(platformUsers.email, email), eq(platformUsers.isDeleted, false)));
  return user || null;
};

// ─── ANALYTICS ───────────────────────────────────────────
export const getAnalyticsData = async () => {
  const [mandateCount] = await db.select({ count: sql<number>`count(*)` }).from(mandates).where(eq(mandates.isDeleted, false));
  const [candCount] = await db.select({ count: sql<number>`count(*)` }).from(mandateCandidates);
  const [flCount] = await db.select({ count: sql<number>`count(*)` }).from(candidates).where(eq(candidates.isDeleted, false));
  return {
    activeMandates: Number(mandateCount?.count ?? 0),
    totalCandidates: Number(candCount?.count ?? 0),
    flTotal: Number(flCount?.count ?? 0),
  };
};
