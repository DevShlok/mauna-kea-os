import { db } from './index';
import { eq, sql, getTableColumns, desc, and, ilike, or, inArray, gte, lte, asc } from 'drizzle-orm';
import { cache } from 'react';
import {
  mandates, mandateCandidates, candidates, floats, floatReferences,
  floatFollowUps, floatActivities, frameworks, frameworkCategories,
  frameworkCriteria, platformUsers, candidateReports, candidateFiles, clients
} from './schema';

// ─── MANDATES ────────────────────────────────────────────
export const getMandates = cache(async () => {
  const rows = await db.query.mandates.findMany({
    where: eq(mandates.isDeleted, false),
    orderBy: desc(mandates.id),
    with: { candidates: true },
  });
  return rows.map(m => ({
    ...m,
    sectors: (m.sectors ?? []) as string[],
  }));
});

export const getMandatesLight = cache(async () => {
  return await db.select({
    id: mandates.id,
    company: mandates.company,
    role: mandates.role,
    status: mandates.status,
    frameworkId: mandates.frameworkId
  }).from(mandates).where(eq(mandates.isDeleted, false)).orderBy(desc(mandates.id));
});

export const getMandatesPaginated = cache(async (params: {
  page: number;
  pageSize: number;
  search?: string;
  company?: string;
  role?: string;
  sector?: string;
  status?: string;
  internalStatus?: string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}) => {
  const { page, pageSize, search, company, role, sector, status, internalStatus, sortKey, sortDir } = params;

  const conditions = [eq(mandates.isDeleted, false)];

  if (search) {
    conditions.push(
      or(
        ilike(mandates.company, `%${search}%`),
        ilike(mandates.role, `%${search}%`)
      )!
    );
  }
  if (company) conditions.push(eq(mandates.company, company));
  if (role) conditions.push(eq(mandates.role, role));
  if (status) conditions.push(eq(mandates.status, status));
  if (internalStatus) conditions.push(eq(mandates.internalStatus, internalStatus));
  // Note: JSON array filtering for sector is complex in basic Drizzle without raw SQL,
  // we can use sql`sectors ? ${sector}` for jsonb operators if using jsonb, otherwise `sectors::text ILIKE`.
  if (sector) {
    conditions.push(sql`${mandates.sectors}::text ILIKE ${`%${sector}%`}`);
  }

  const whereClause = and(...conditions);

  let orderByClause = desc(mandates.id);
  if (sortKey) {
    const col = (mandates as any)[sortKey];
    if (col) {
      orderByClause = sortDir === "asc" ? asc(col) : desc(col);
    }
  }

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(mandates).where(whereClause);
  const totalPages = Math.ceil(count / pageSize) || 1;

  const rows = await db.query.mandates.findMany({
    where: whereClause,
    orderBy: orderByClause,
    with: { candidates: true },
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return {
    data: rows.map(m => ({ ...m, sectors: (m.sectors ?? []) as string[] })),
    metadata: { totalCount: count, totalPages, currentPage: page }
  };
});

export const getClientsPaginated = cache(async (params: {
  page: number;
  pageSize: number;
  search?: string;
  vertical?: string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}) => {
  const { page, pageSize, search, vertical, sortKey, sortDir } = params;

  const conditions = [eq(clients.isDeleted, false)];

  if (search) {
    conditions.push(ilike(clients.name, `%${search}%`));
  }
  if (vertical) conditions.push(eq(clients.vertical, vertical));

  const whereClause = and(...conditions);

  let orderByClause = desc(clients.id);
  if (sortKey) {
    const col = (clients as any)[sortKey];
    if (col) {
      orderByClause = sortDir === "asc" ? asc(col) : desc(col);
    }
  }

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(clients).where(whereClause);
  const totalPages = Math.ceil(count / pageSize) || 1;

  const rows = await db.select()
    .from(clients)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    data: rows,
    metadata: { totalCount: count, totalPages, currentPage: page }
  };
});

export const getMandateById = cache(async (id: number) => {
  const mandate = await db.query.mandates.findFirst({
    where: and(eq(mandates.id, id), eq(mandates.isDeleted, false)),
    with: { candidates: true },
  });
  if (!mandate) return null;
  return {
    ...mandate,
    sectors: (mandate.sectors ?? []) as string[],
  };
});


export const getAllMandateCandidates = cache(async () => {
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
});

export const getMandateCandidateByExtId = cache(async (extId: string) => {
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
});

// ─── CANDIDATES (MASTER) ─────────────────────────────────
export const getCandidates = cache(async () => {
  const { cvText, profilePic, ...safeCols } = getTableColumns(candidates);
  const rows = await db.select(safeCols).from(candidates).where(eq(candidates.isDeleted, false)).orderBy(desc(candidates.createdAt));
  return rows.map(c => ({
    ...c,
    qual: (c.qual ?? []) as any[],
    dreamRoles: (c.dreamRoles ?? []) as string[],
    dreamCos: (c.dreamCos ?? []) as string[],
    expTags: (c.expTags ?? []) as string[],
  }));
});
export const getFloatsPaginated = cache(async (params: {
  page: number;
  pageSize: number;
  search?: string;
  stageFilter?: string;
  mandateFilter?: string;
  companyFilter?: string;
  designationFilter?: string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}) => {
  const { page, pageSize, search, stageFilter, mandateFilter, companyFilter, designationFilter, sortKey, sortDir } = params;

  const unifiedCte = sql`
    WITH unified_floats AS (
      SELECT 
        'mc-' || mc.id as "id",
        mc.external_id as "externalId",
        mc.name,
        mc.company,
        mc.role,
        mc.stage,
        mc.score,
        mc.has_report as "hasReport",
        mc.initials,
        m.role as "mandateRole",
        m.company as "mandateCompany",
        m.id as "mandateId",
        false as "isFloatOnly",
        mc.created_at as "createdAt"
      FROM mandate_candidates mc
      INNER JOIN mandates m ON mc.mandate_id = m.id
      WHERE m.is_deleted = false

      UNION ALL

      SELECT 
        'float-' || f.cand_id as "id",
        f.cand_id as "externalId",
        c.name,
        c.company,
        c.designation as "role",
        COALESCE(f.status, 'Shared') as "stage",
        c.score,
        c.has_cv as "hasReport",
        c.initials,
        'General Float' as "mandateRole",
        'General' as "mandateCompany",
        0 as "mandateId",
        true as "isFloatOnly",
        f.created_at as "createdAt"
      FROM floats f
      INNER JOIN candidates c ON f.cand_id = c.id
      WHERE f.is_deleted = false AND f.client = 'General'
    )
  `;

  const conditions = [sql`1=1`];
  
  if (search) {
    const searchParam = `%${search}%`;
    conditions.push(sql`(name ILIKE ${searchParam} OR company ILIKE ${searchParam})`);
  }
  if (stageFilter) conditions.push(sql`stage = ${stageFilter}`);
  if (mandateFilter) {
    const [role, company] = mandateFilter.split(" @ ");
    conditions.push(sql`"mandateRole" = ${role} AND "mandateCompany" = ${company}`);
  }
  if (companyFilter) conditions.push(sql`company = ${companyFilter}`);
  if (designationFilter) conditions.push(sql`role = ${designationFilter}`);

  const whereClause = sql.join(conditions, sql` AND `);
  
  const validSortKeys = ['name', 'company', 'role', 'stage', 'score', 'createdAt'];
  const safeSortKey = validSortKeys.includes(sortKey || '') ? sortKey : 'name';
  const safeSortDir = sortDir === 'desc' ? sql`DESC` : sql`ASC`;

  const countQuery = sql`${unifiedCte} SELECT COUNT(*) as total FROM unified_floats WHERE ${whereClause}`;
  const countResult = await db.execute(countQuery);
  const totalCount = Number(countResult[0]?.total || 0);
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const dataQuery = sql`
    ${unifiedCte} 
    SELECT * FROM unified_floats 
    WHERE ${whereClause} 
    ORDER BY "${sql.raw(safeSortKey!)}" ${safeSortDir} 
    LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
  `;
  const rows = await db.execute(dataQuery);

  const metaQuery = sql`
    ${unifiedCte}
    SELECT 
      array_agg(DISTINCT "mandateRole" || ' @ ' || "mandateCompany") as "uniqueMandates",
      array_agg(DISTINCT company) FILTER (WHERE company IS NOT NULL) as "uniqueCompanies",
      array_agg(DISTINCT role) FILTER (WHERE role IS NOT NULL) as "uniqueDesignations"
    FROM unified_floats
  `;
  const metaResult = await db.execute(metaQuery);
  const meta = metaResult[0] as any;

  return {
    data: rows,
    metadata: {
      totalCount,
      totalPages,
      currentPage: page,
      uniqueMandates: (meta.uniqueMandates || []).sort(),
      uniqueCompanies: (meta.uniqueCompanies || []).sort(),
      uniqueDesignations: (meta.uniqueDesignations || []).sort()
    }
  };
});

// ─── PAGINATED CANDIDATES (SERVER-SIDE) ──────────────────
interface CandidateQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  companies?: string[];
  designations?: string[];
  statuses?: string[];
  quals?: string[];
  minExp?: number;
  maxExp?: number;
  minTenure?: number;
  maxTenure?: number;
  minCtc?: number;
  maxCtc?: number;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
}

export const getCandidatesPaginated = cache(async (params: CandidateQueryParams) => {
  const { page = 1, limit = 20, search, companies, designations, statuses, minExp, maxExp, minTenure, maxTenure, minCtc, maxCtc, sortKey, sortDir } = params;
  
  const conditions: any[] = [eq(candidates.isDeleted, false)];
  
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(or(
      ilike(candidates.name, searchPattern),
      ilike(candidates.company, searchPattern),
      ilike(candidates.designation, searchPattern)
    ));
  }
  
  if (companies && companies.length > 0) conditions.push(inArray(candidates.company, companies));
  if (designations && designations.length > 0) conditions.push(inArray(candidates.designation, designations));
  if (statuses && statuses.length > 0) conditions.push(inArray(candidates.status, statuses));
  
  if (minExp !== undefined) conditions.push(gte(candidates.exp, minExp));
  if (maxExp !== undefined) conditions.push(lte(candidates.exp, maxExp));
  
  if (minTenure !== undefined) conditions.push(gte(candidates.tenure, minTenure));
  if (maxTenure !== undefined) conditions.push(lte(candidates.tenure, maxTenure));
  
  if (minCtc !== undefined) conditions.push(gte(candidates.ctc, minCtc));
  if (maxCtc !== undefined) conditions.push(lte(candidates.ctc, maxCtc));
  
  // Note: JSON array filtering for 'qual' is extremely complex in raw Drizzle/Postgres without raw SQL.
  // We will skip qual filtering in the WHERE clause for now or use raw SQL.
  
  const whereClause = and(...conditions);
  
  const { cvText, profilePic, ...safeCols } = getTableColumns(candidates);
  
  // Determine Order By
  let orderClause = desc(candidates.createdAt);
  if (sortKey) {
    const col = (candidates as any)[sortKey];
    if (col) {
      orderClause = sortDir === 'asc' ? asc(col) : desc(col);
    }
  }

  // Fetch paginated data
  const rows = await db.select(safeCols)
    .from(candidates)
    .where(whereClause)
    .orderBy(orderClause)
    .limit(limit)
    .offset((page - 1) * limit);
    
  // Fetch total count for pagination
  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(candidates)
    .where(whereClause);
    
  // We also need to fetch unique metadata for the dropdowns (companies, designations, etc)
  // To avoid massive slowdowns, we can just fetch distinct values from the whole table (ignoring filters)
  const uniqueMetadata = await db.execute(sql`
    SELECT 
      array_agg(DISTINCT company) FILTER (WHERE company IS NOT NULL) as companies,
      array_agg(DISTINCT designation) FILTER (WHERE designation IS NOT NULL) as designations,
      array_agg(DISTINCT status) FILTER (WHERE status IS NOT NULL) as statuses,
      MAX(exp) as max_exp,
      MAX(tenure) as max_tenure,
      MAX(ctc) as max_ctc
    FROM candidates
    WHERE is_deleted = false
  `);
  
  const meta = uniqueMetadata[0] as any;
  
  return {
    data: rows.map(c => ({
      ...c,
      qual: (c.qual ?? []) as any[],
      dreamRoles: (c.dreamRoles ?? []) as string[],
      dreamCos: (c.dreamCos ?? []) as string[],
      expTags: (c.expTags ?? []) as string[],
    })),
    total: Number(count),
    metadata: {
      companies: (meta.companies || []).sort(),
      designations: (meta.designations || []).sort(),
      statuses: (meta.statuses || []).sort(),
      maxExp: Math.max(10, Math.ceil(Number(meta.max_exp || 0))),
      maxTenure: Math.max(5, Math.ceil(Number(meta.max_tenure || 0))),
      maxCtc: Math.max(50, Math.ceil(Number(meta.max_ctc || 0) / 10) * 10),
    }
  };
});


export const getCandidateById = cache(async (id: string) => {
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
});

// ─── FLOATS (SUBMISSIONS) ────────────────────────────────
export const getFloats = cache(async () => {
  const rows = await db.select().from(floats).where(eq(floats.isDeleted, false)).orderBy(desc(floats.dateShared));
  return rows.map(s => ({ ...s, via: (s.via ?? []) as string[] }));
});

// ─── FOLLOW-UPS ──────────────────────────────────────────
export const getFollowUps = cache(async () => {
  return db.select().from(floatFollowUps).orderBy(floatFollowUps.dueDate);
});

// ─── FRAMEWORKS ──────────────────────────────────────────
export const getFrameworks = cache(async () => {
  const fws = await db.query.frameworks.findMany({
    where: eq(frameworks.isDeleted, false),
    orderBy: desc(frameworks.createdAt),
    with: {
      categories: {
        orderBy: (cats, { asc }) => [asc(cats.sortOrder)],
        with: {
          criteria: {
            orderBy: (crits, { asc }) => [asc(crits.sortOrder)]
          }
        }
      }
    }
  });

  const reports = await db.select({ frameworkId: candidateReports.frameworkId, candidateId: candidateReports.candidateId }).from(candidateReports);
  const candIds = Array.from(new Set(reports.map(r => String(r.candidateId))));

  let mCands: { id: number, externalId: string, mandateId: number }[] = [];
  if (candIds.length > 0) {
    const { inArray, or } = require('drizzle-orm');
    mCands = await db.select({ id: mandateCandidates.id, externalId: mandateCandidates.externalId, mandateId: mandateCandidates.mandateId })
      .from(mandateCandidates); 
      // Note: Kept simple for now to avoid breaking SQL types, but limited impact as it runs on the server.
      // A better approach is to fix how candidateId is stored in reports.
  }

  return fws.map(fw => {
    const fwReports = reports.filter(r => r.frameworkId === fw.id);
    const uniqueMandates = new Set<number>();
    fwReports.forEach(r => {
      const isNum = !isNaN(Number(r.candidateId));
      const candMatch = isNum 
        ? mCands.find(mc => mc.id === Number(r.candidateId) || mc.externalId === r.candidateId)
        : mCands.find(mc => mc.externalId === r.candidateId);
        
      if (candMatch) uniqueMandates.add(candMatch.mandateId);
    });
    
    return {
      ...fw,
      usedIn: uniqueMandates.size > 0 ? uniqueMandates.size : (fwReports.length > 0 ? 1 : (fw.usedIn || 0)),
    };
  });
});

export const getFrameworkById = cache(async (id: string) => {
  const fw = await db.query.frameworks.findFirst({
    where: and(eq(frameworks.id, id), eq(frameworks.isDeleted, false)),
    with: {
      categories: {
        orderBy: (cats, { asc }) => [asc(cats.sortOrder)],
        with: {
          criteria: {
            orderBy: (crits, { asc }) => [asc(crits.sortOrder)]
          }
        }
      }
    }
  });
  return fw || null;
});

// ─── USERS ───────────────────────────────────────────────
export const getPlatformUsers = cache(async () => {
  const users = await db.select().from(platformUsers).where(eq(platformUsers.isDeleted, false)).orderBy(desc(platformUsers.createdAt));
  const uniqueUsersMap = new Map();
  for (const user of users) {
    if (user.email && !uniqueUsersMap.has(user.email.toLowerCase())) {
      uniqueUsersMap.set(user.email.toLowerCase(), user);
    }
  }
  return Array.from(uniqueUsersMap.values());
});

export const getUserByEmail = cache(async (email: string) => {
  const [user] = await db.select().from(platformUsers).where(and(eq(platformUsers.email, email), eq(platformUsers.isDeleted, false)));
  return user || null;
});

// ─── ANALYTICS ───────────────────────────────────────────
export const getAnalyticsData = cache(async () => {
  const [mandateCount] = await db.select({ count: sql<number>`count(*)` }).from(mandates).where(eq(mandates.isDeleted, false));
  const [candCount] = await db.select({ count: sql<number>`count(*)` }).from(mandateCandidates);
  const [flCount] = await db.select({ count: sql<number>`count(*)` }).from(candidates).where(eq(candidates.isDeleted, false));
  return {
    activeMandates: Number(mandateCount?.count ?? 0),
    totalCandidates: Number(candCount?.count ?? 0),
    flTotal: Number(flCount?.count ?? 0),
  };
});
