import { db } from './index';
import { eq, sql, getTableColumns, desc, and, ilike, or, inArray, gte, lte, asc, isNull } from 'drizzle-orm';
import { cache } from 'react';
import {
  mandates, mandateCandidates, candidates, floats, floatReferences,
  floatFollowUps, floatActivities, frameworks, frameworkCategories,
  frameworkCriteria, platformUsers, candidateReports, candidateFiles, clients,
  userPreferences
} from './schema';


// ─── PLATFORM USERS ──────────────────────────────────────
export const getConsultants = cache(async () => {
  const users = await db.select({ name: platformUsers.name }).from(platformUsers).where(inArray(platformUsers.role, ["admin", "consultant"]));
  const uniqueNames = Array.from(new Set(users.map(u => u.name).filter(Boolean)));
  return uniqueNames as string[];
});

// ─── MANDATES ────────────────────────────────────────────
export const getMandates = cache(async () => {
  const rows = await db.query.mandates.findMany({
    where: eq(mandates.isDeleted, false),
    orderBy: desc(mandates.id),
    columns: {
      jdText: false,
      interviewNotesText: false,
      searchNotes: false,
      additionalDocsText: false,
      openQuestions: false,
    },
    with: { 
      candidates: {
        columns: {
          id: true,
          stage: true,
          score: true,
          hasReport: true,
          mandateId: true,
          isSentToClient: true,
          candId: true
        },
        with: {
          candidate: {
            columns: {
              name: true,
              initials: true
            },
            with: {
              verification: true
            }
          }
        }
      } 
    },
  });
  return rows.map(m => ({
    ...m,
    sectors: (m.sectors ?? []) as string[],
    candidates: m.candidates.map((c: any) => ({
      id: c.id,
      stage: c.stage,
      score: c.score,
      hasReport: c.hasReport,
      mandateId: c.mandateId,
      isSentToClient: c.isSentToClient,
      externalId: c.candId,
      name: c.candidate?.name || "Unknown",
      initials: c.candidate?.initials || "UN",
      isVerified: c.candidate?.verification?.status === 'Verified' ? 'Verified' : 'Unverified'
    }))
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
    const sortMap: Record<string, any> = {
      id: mandates.id,
      company: mandates.company,
      role: mandates.role,
      status: mandates.status,
      internalStatus: mandates.internalStatus,
      opened: mandates.opened,
      target: mandates.target,
      consultant: mandates.consultant,
      createdAt: mandates.createdAt
    };
    const col = sortMap[sortKey];
    if (col) {
      orderByClause = sortDir === "asc" ? asc(col) : desc(col);
    }
  }

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(mandates).where(whereClause);
  const totalPages = Math.ceil(count / pageSize) || 1;

  const rows = await db.query.mandates.findMany({
    where: whereClause,
    orderBy: orderByClause,
    columns: {
      jdText: false,
      interviewNotesText: false,
      searchNotes: false,
      additionalDocsText: false,
      openQuestions: false,
    },
    with: {  
      candidates: {
        columns: {
          id: true,
          stage: true,
          score: true,
          hasReport: true,
          mandateId: true,
          isSentToClient: true,
          candId: true
        },
        with: {
          candidate: {
            columns: {
              name: true,
              initials: true
            }
          }
        }
      } 
    },
    limit: pageSize,
    offset: (Math.max(1, page) - 1) * pageSize,
  });

  return {
    data: rows.map(m => ({ 
      ...m, 
      sectors: (m.sectors ?? []) as string[],
      candidates: m.candidates.map((c: any) => ({
        id: c.id,
        stage: c.stage,
        score: c.score,
        hasReport: c.hasReport,
        mandateId: c.mandateId,
        isSentToClient: c.isSentToClient,
        externalId: c.candId,
        name: c.candidate?.name || "Unknown",
        initials: c.candidate?.initials || "UN"
      }))
    })),
    metadata: { totalCount: count, totalPages, currentPage: page }
  };
});

export const getClientsPaginated = cache(async (params: {
  page: number;
  pageSize: number;
  search?: string;
  vertical?: string;
  status?: string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
}) => {
  const { page, pageSize, search, vertical, status, sortKey, sortDir } = params;

  const conditions = [eq(clients.isDeleted, false)];

  if (search) {
    conditions.push(ilike(clients.name, `%${search}%`));
  }
  if (vertical) conditions.push(eq(clients.vertical, vertical));

  const hasMandateIn6Months = sql`EXISTS (
    SELECT 1 FROM ${mandates}
    WHERE ${mandates.company} = ${clients.name}
    AND ${mandates.createdAt} >= NOW() - INTERVAL '6 months'
    AND ${mandates.isDeleted} = false
  )`;

  if (status === 'Active') {
    conditions.push(hasMandateIn6Months);
  } else if (status === 'Inactive') {
    conditions.push(sql`NOT ${hasMandateIn6Months}`);
  }

  const whereClause = and(...conditions);

  let orderByClause = desc(clients.id);
  if (sortKey) {
    const sortMap: Record<string, any> = {
      id: clients.id,
      name: clients.name,
      vertical: clients.vertical,
      createdAt: clients.createdAt
    };
    const col = sortMap[sortKey];
    if (col) {
      orderByClause = sortDir === "asc" ? asc(col) : desc(col);
    }
  }

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(clients).where(whereClause);
  const totalPages = Math.ceil(count / pageSize) || 1;

  const statusSql = sql<string>`
    CASE 
      WHEN ${hasMandateIn6Months} THEN 'Active'
      ELSE 'Inactive'
    END
  `.as('status');

  const rows = await db.select({
    ...getTableColumns(clients),
    status: statusSql
  })
    .from(clients)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(pageSize)
    .offset((Math.max(1, page) - 1) * pageSize);

  return {
    data: rows,
    metadata: { totalCount: count, totalPages, currentPage: page }
  };
});

export const getMandateById = cache(async (id: number) => {
  const mandate = await db.query.mandates.findFirst({
    where: and(eq(mandates.id, id), eq(mandates.isDeleted, false)),
    with: { 
      candidates: {
        columns: {
          id: true,
          stage: true,
          score: true,
          hasReport: true,
          mandateId: true,
          isSentToClient: true,
          candId: true
        },
        with: {
          candidate: {
            columns: {
              name: true,
              initials: true,
              company: true,
              designation: true
            }
          }
        }
      } 
    },
  });
  if (!mandate) return null;

  const { candidateVerifications } = await import('./schema');
  const candIds = mandate.candidates.map(c => c.candId);
  const verifs = candIds.length > 0 
    ? await db.select().from(candidateVerifications).where(inArray(candidateVerifications.candId, candIds))
    : [];
  
  const verifMap = new Map(verifs.map(v => [v.candId, v]));

  return {
    ...mandate,
    sectors: (mandate.sectors ?? []) as string[],
    candidates: mandate.candidates.map((c: any) => ({
      id: c.id,
      stage: c.stage,
      score: c.score,
      hasReport: c.hasReport,
      mandateId: c.mandateId,
      isSentToClient: c.isSentToClient,
      externalId: c.candId,
      name: c.candidate?.name || "Unknown",
      initials: c.candidate?.initials || "UN",
      company: c.candidate?.company || null,
      role: c.candidate?.designation || null,
      isVerified: verifMap.get(c.candId)?.status || 'Not Started',
    }))
  };
});


export const getAllMandateCandidates = cache(async () => {
  const cands = await db.select({
    id: mandateCandidates.id,
    externalId: mandateCandidates.candId,
    name: candidates.name,
    company: candidates.company,
    role: candidates.designation,
    stage: mandateCandidates.stage,
    score: mandateCandidates.score,
    hasReport: mandateCandidates.hasReport,
    initials: candidates.initials,
    mandateId: mandateCandidates.mandateId,
    mandateRole: mandates.role,
    mandateCompany: mandates.company,
  })
  .from(mandateCandidates)
  .innerJoin(mandates, eq(mandateCandidates.mandateId, mandates.id))
  .innerJoin(candidates, eq(mandateCandidates.candId, candidates.id));
  return cands;
});

export const getMandateCandidateByExtId = cache(async (extId: string) => {
  const [cand] = await db.select({
    id: mandateCandidates.id,
    externalId: mandateCandidates.candId,
    name: candidates.name,
    company: candidates.company,
    role: candidates.designation,
    stage: mandateCandidates.stage,
    score: mandateCandidates.score,
    hasReport: mandateCandidates.hasReport,
    initials: candidates.initials,
    mandateId: mandateCandidates.mandateId,
    mandateRole: mandates.role,
    mandateCompany: mandates.company,
  })
  .from(mandateCandidates)
  .innerJoin(mandates, eq(mandateCandidates.mandateId, mandates.id))
  .innerJoin(candidates, eq(mandateCandidates.candId, candidates.id))
  .where(eq(mandateCandidates.candId, extId));
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
        mc.cand_id as "externalId",
        c.name,
        c.company,
        c.designation as "role",
        mc.stage,
        mc.score,
        mc.has_report as "hasReport",
        c.initials,
        m.role as "mandateRole",
        m.company as "mandateCompany",
        m.id as "mandateId",
        false as "isFloatOnly",
        mc.created_at as "createdAt"
      FROM mandate_candidates mc
      INNER JOIN mandates m ON mc.mandate_id = m.id
      INNER JOIN candidates c ON mc.cand_id = c.id
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
  locations?: string[];
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
  const { page = 1, limit = 20, search, companies, designations, statuses, locations, minExp, maxExp, minTenure, maxTenure, minCtc, maxCtc, sortKey, sortDir } = params;
  
  const conditions: any[] = [
    sql`COALESCE(${candidates.isDeleted}, false) = false`,
    sql`COALESCE(metadata->>'isPlaceholder', 'false') != 'true'`
  ];
  
  if (search && search.trim()) {
    const searchPattern = `%${search.trim()}%`;
    conditions.push(or(
      ilike(candidates.id, searchPattern),
      ilike(candidates.name, searchPattern),
      ilike(candidates.company, searchPattern),
      ilike(candidates.designation, searchPattern),
      ilike(candidates.email, searchPattern),
      ilike(candidates.mobile, searchPattern),
      ilike(candidates.location, searchPattern),
      ilike(candidates.notes, searchPattern),
      ilike(candidates.cvText, searchPattern)
    ));
  }
  
  if (companies && companies.length > 0) conditions.push(inArray(candidates.company, companies));
  if (designations && designations.length > 0) conditions.push(inArray(candidates.designation, designations));
  if (statuses && statuses.length > 0) conditions.push(inArray(candidates.status, statuses));
  if (locations && locations.length > 0) conditions.push(inArray(candidates.location, locations));
  
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
    const sortMap: Record<string, any> = {
      id: candidates.id,
      name: candidates.name,
      company: candidates.company,
      designation: candidates.designation,
      score: candidates.score,
      status: candidates.status,
      location: candidates.location,
      exp: candidates.exp,
      tenure: candidates.tenure,
      ctc: candidates.ctc,
      fixedCtc: candidates.fixedCtc,
      variableCtc: candidates.variableCtc,
      expected: candidates.expected,
      esops: candidates.esops,
      notice: candidates.notice,
      createdAt: candidates.createdAt,
      updatedAt: candidates.updatedAt
    };
    const col = sortMap[sortKey];
    if (col) {
      orderClause = sortDir === 'asc' ? asc(col) : desc(col);
    }
  }

  const validPage = Math.max(1, page);
  // Fetch paginated data
  const rows = await db.select(safeCols)
    .from(candidates)
    .where(whereClause)
    .orderBy(orderClause)
    .limit(limit)
    .offset((validPage - 1) * limit);
    
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
      array_agg(DISTINCT location) FILTER (WHERE location IS NOT NULL) as locations,
      MIN(exp) as min_exp,
      MAX(exp) as max_exp,
      MIN(tenure) as min_tenure,
      MAX(tenure) as max_tenure,
      MIN(ctc) as min_ctc,
      MAX(ctc) as max_ctc,
      COUNT(*) FILTER (WHERE status = 'Active') as active_count,
      COUNT(*) FILTER (WHERE status = 'Passive') as passive_count,
      COUNT(*) FILTER (WHERE status = 'Placed') as placed_count,
      AVG(ctc) as avg_ctc
    FROM candidates
    WHERE is_deleted = false AND COALESCE(metadata->>'isPlaceholder', 'false') != 'true'
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
      locations: (meta.locations || []).sort(),
      minExp: Math.floor(Number(meta.min_exp || 0)),
      maxExp: Math.max(1, Math.ceil(Number(meta.max_exp || 0))),
      minTenure: Math.floor(Number(meta.min_tenure || 0)),
      maxTenure: Math.max(1, Math.ceil(Number(meta.max_tenure || 0))),
      minCtc: Math.floor(Number(meta.min_ctc || 0)),
      maxCtc: Math.max(10, Math.ceil(Number(meta.max_ctc || 0) / 10) * 10),
      statusesCount: {
        Active: Number(meta.active_count || 0),
        Passive: Number(meta.passive_count || 0),
        Placed: Number(meta.placed_count || 0),
      },
      avgCtc: meta.avg_ctc ? Number(Number(meta.avg_ctc).toFixed(1)) : 0,
    }
  };
});


export const getCandidateById = cache(async (id: string) => {
  const decodedId = decodeURIComponent(id || "").trim();
  if (!decodedId) return null;

  const possibleIds = [decodedId];
  if (decodedId.startsWith("CAND-")) {
    possibleIds.push(decodedId.replace("CAND-", ""));
  } else {
    possibleIds.push(`CAND-${decodedId}`);
  }

  const [cand] = await db.select().from(candidates).where(
    and(
      inArray(candidates.id, possibleIds),
      sql`COALESCE(${candidates.isDeleted}, false) = false`
    )
  );
  if (!cand) return null;
  const actualId = cand.id;

  const [activities, floatSubmissions, mCands, followUps, references, files] = await Promise.all([
    db.select().from(floatActivities).where(eq(floatActivities.candId, actualId)),
    db.select().from(floats).where(and(eq(floats.candId, actualId), eq(floats.isDeleted, false))),
    db.select({
      id: mandateCandidates.id,
      dateShared: mandateCandidates.createdAt,
      status: mandateCandidates.stage,
      client: mandates.company,
      role: mandates.role,
      consultant: sql<string>`'System'`
    })
    .from(mandateCandidates)
    .innerJoin(mandates, eq(mandateCandidates.mandateId, mandates.id))
    .where(and(eq(mandateCandidates.candId, actualId), eq(mandates.isDeleted, false))),
    db.select().from(floatFollowUps).where(eq(floatFollowUps.candId, actualId)),
    db.select().from(floatReferences).where(eq(floatReferences.candId, actualId)),
    db.select().from(candidateFiles).where(eq(candidateFiles.candId, actualId))
  ]);

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
  const rows = await db.select({
    id: floats.id,
    candId: floats.candId,
    candName: candidates.name,
    client: floats.client,
    role: floats.role,
    candCompany: candidates.company,
    candRole: candidates.designation,
    consultant: floats.consultant,
    dateShared: floats.dateShared,
    via: floats.via,
    followUp: floats.followUp,
    status: floats.status,
    response: floats.response
  })
  .from(floats)
  .leftJoin(candidates, eq(floats.candId, candidates.id))
  .where(eq(floats.isDeleted, false))
  .orderBy(desc(floats.createdAt));

  return rows.map(s => ({ 
    ...s, 
    candName: s.candName || "Unknown Candidate", 
    client: s.client || s.candCompany || "Unknown Client",
    role: s.role || s.candRole || "Unknown Role",
    via: (s.via ?? []) as string[] 
  }));
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

  // Count mandates that reference each framework directly (non-deleted)
  const mandateCounts = await db
    .select({ frameworkId: mandates.frameworkId, count: sql<number>`count(*)` })
    .from(mandates)
    .where(and(eq(mandates.isDeleted, false), sql`${mandates.frameworkId} IS NOT NULL`))
    .groupBy(mandates.frameworkId);

  const countMap = new Map(mandateCounts.map(r => [r.frameworkId, Number(r.count)]));

  return fws.map(fw => ({
    ...fw,
    usedIn: countMap.get(fw.id) ?? 0,
  }));
});

export const getFrameworksPaginated = cache(async ({
  page = 1,
  limit = 50,
  search = '',
  sortKey = 'createdAt',
  sortDir = 'desc' as 'asc' | 'desc',
} = {}) => {
  const offset = (page - 1) * limit;

  const searchCondition = search
    ? or(
        ilike(frameworks.name, `%${search}%`),
        ilike(frameworks.industry, `%${search}%`)
      )
    : undefined;

  const baseWhere = and(eq(frameworks.isDeleted, false), searchCondition);

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(frameworks)
    .where(baseWhere);

  const totalCount = Number(totalResult?.count ?? 0);

  const validSortKeys: Record<string, any> = {
    name: frameworks.name,
    industry: frameworks.industry,
    createdAt: frameworks.createdAt,
    lastModified: frameworks.lastModified,
  };
  const sortCol = validSortKeys[sortKey] ?? frameworks.createdAt;
  const orderFn = sortDir === 'asc' ? asc : desc;

  const fws = await db.query.frameworks.findMany({
    where: baseWhere,
    orderBy: orderFn(sortCol),
    limit,
    offset,
    with: {
      categories: {
        orderBy: (cats, { asc }) => [asc(cats.sortOrder)],
        with: { criteria: { orderBy: (crits, { asc }) => [asc(crits.sortOrder)] } }
      }
    }
  });


  // Simpler: just fetch all mandate counts and filter in JS (small overhead for frameworks page)
  const allMandateCounts = await db
    .select({ frameworkId: mandates.frameworkId, count: sql<number>`count(*)` })
    .from(mandates)
    .where(and(eq(mandates.isDeleted, false), sql`${mandates.frameworkId} IS NOT NULL`))
    .groupBy(mandates.frameworkId);

  const countMap = new Map(allMandateCounts.map(r => [r.frameworkId, Number(r.count)]));

  return {
    rows: fws.map(fw => ({ ...fw, usedIn: countMap.get(fw.id) ?? 0 })),
    metadata: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    }
  };
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

// ─── USER PREFERENCES ────────────────────────────────────
/**
 * Fetches a preference for a given user.
 * Priority: own saved pref → admin org default → null
 */
export async function getUserPreference(userId: string, prefKey: string): Promise<Record<string, any> | null> {
  const rows = await db
    .select()
    .from(userPreferences)
    .where(
      and(
        or(
          eq(userPreferences.userId, userId),
          isNull(userPreferences.userId)
        ),
        eq(userPreferences.prefKey, prefKey)
      )
    )
    .orderBy(desc(sql`(user_id IS NOT NULL)`))
    .limit(1);
  return (rows[0]?.prefValue as Record<string, any>) ?? null;
}

// ─── USERS PAGINATED ─────────────────────────────────────
export const getUsersPaginated = cache(async ({
  page = 1,
  limit = 50,
  search = '',
  sortKey = 'createdAt',
  sortDir = 'desc' as 'asc' | 'desc',
  role = '',
} = {}) => {
  const offset = (page - 1) * limit;

  const searchCondition = search
    ? or(
        ilike(platformUsers.name, `%${search}%`),
        ilike(platformUsers.email, `%${search}%`),
        ilike(platformUsers.role, `%${search}%`)
      )
    : undefined;

  const roleCondition = role ? eq(platformUsers.role, role) : undefined;
  const baseWhere = and(eq(platformUsers.isDeleted, false), searchCondition, roleCondition);

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(platformUsers)
    .where(baseWhere);

  const totalCount = Number(totalResult?.count ?? 0);

  const validSortKeys: Record<string, any> = {
    name: platformUsers.name,
    email: platformUsers.email,
    role: platformUsers.role,
    status: platformUsers.status,
    createdAt: platformUsers.createdAt,
    lastActive: platformUsers.lastActive,
  };
  const sortCol = validSortKeys[sortKey] ?? platformUsers.createdAt;
  const orderFn = sortDir === 'asc' ? asc : desc;

  const rows = await db
    .select()
    .from(platformUsers)
    .where(baseWhere)
    .orderBy(orderFn(sortCol))
    .limit(limit)
    .offset(offset);

  // Deduplicate by email (same logic as existing getPlatformUsers)
  const uniqueMap = new Map<string, typeof rows[0]>();
  for (const u of rows) {
    if (u.email && !uniqueMap.has(u.email.toLowerCase())) {
      uniqueMap.set(u.email.toLowerCase(), u);
    }
  }

  return {
    rows: Array.from(uniqueMap.values()),
    metadata: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    }
  };
});

// ─── RECYCLE BIN PAGINATED ───────────────────────────────
export const getRecycleBinPaginated = cache(async ({
  page = 1,
  limit = 50,
  search = '',
  sortKey = 'deletedAt',
  sortDir = 'desc' as 'asc' | 'desc',
  type = '',  // 'candidate' | 'client' | 'mandate' | 'framework' | ''
} = {}) => {
  const offset = (page - 1) * limit;

  // Fetch deleted items from each entity table, union them in JS
  // (Simple approach — acceptable since recycle bin is accessed rarely)
  const results: any[] = [];

  if (!type || type === 'candidate') {
    const rows = await db.select().from(candidates).where(eq(candidates.isDeleted, true));
    rows.forEach(r => results.push({ ...r, entityType: 'candidate', displayName: r.name }));
  }

  if (!type || type === 'client') {
    const rows = await db.select().from(clients).where(eq(clients.isDeleted, true));
    rows.forEach(r => results.push({ ...r, entityType: 'client', displayName: r.name }));
  }

  if (!type || type === 'mandate') {
    const rows = await db.select().from(mandates).where(eq(mandates.isDeleted, true));
    rows.forEach(r => results.push({ ...r, entityType: 'mandate', displayName: `${r.role} @ ${r.company}` }));
  }

  if (!type || type === 'framework') {
    const rows = await db.select().from(frameworks).where(eq(frameworks.isDeleted, true));
    rows.forEach(r => results.push({ ...r, entityType: 'framework', displayName: r.name }));
  }

  // Filter by search
  const filtered = search
    ? results.filter(r =>
        r.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        r.deletedBy?.toLowerCase().includes(search.toLowerCase())
      )
    : results;

  // Sort
  filtered.sort((a, b) => {
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    const cmp = String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalCount = filtered.length;
  const pageRows = filtered.slice(offset, offset + limit);

  return {
    rows: pageRows,
    metadata: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      uniqueTypes: Array.from(new Set(results.map(r => r.entityType))),
    }
  };
});
