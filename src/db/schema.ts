import { mysqlTable, int, varchar, text, float, boolean, datetime, json, mediumtext } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// ─── MANDATES ────────────────────────────────────────────
export const mandates = mysqlTable('mandates', {
  id: int('id').autoincrement().primaryKey(),
  company: varchar('company', { length: 255 }).notNull(),
  role: varchar('role', { length: 255 }).notNull(),
  ctc: varchar('ctc', { length: 100 }),
  exp: varchar('exp', { length: 100 }),
  sectors: json('sectors').$type<string[]>().default([]),
  status: varchar('status', { length: 50 }).default('universe'),
  internalStatus: varchar('internal_status', { length: 50 }).default('contractsent'),
  consultant: varchar('consultant', { length: 255 }),
  opened: varchar('opened', { length: 50 }),
  target: varchar('target', { length: 50 }),
  geography: varchar('geography', { length: 255 }),
  workMode: varchar('work_mode', { length: 50 }),
  clientPOC: varchar('client_poc', { length: 255 }),
  pocEmail: varchar('poc_email', { length: 255 }),
  pocPhone: varchar('poc_phone', { length: 50 }),
  jdUrl: varchar('jd_url', { length: 1000 }),
  interviewNotesUrl: varchar('interview_notes_url', { length: 1000 }),
  additionalDocsUrl: varchar('additional_docs_url', { length: 1000 }),
  jdText: text('jd_text'),
  interviewNotesText: text('interview_notes_text'),
  searchNotes: text('search_notes'),
  createdAt: datetime('created_at').default(sql`now()`),
});

// ─── MANDATE CANDIDATES ──────────────────────────────────
export const mandateCandidates = mysqlTable('mandate_candidates', {
  id: int('id').autoincrement().primaryKey(),
  externalId: varchar('external_id', { length: 20 }).notNull(),
  mandateId: int('mandate_id').notNull().references(() => mandates.id),
  name: varchar('name', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }),
  role: varchar('role', { length: 255 }),
  stage: varchar('stage', { length: 50 }).default('universe'),
  score: float('score'),
  hasReport: boolean('has_report').default(false),
  initials: varchar('initials', { length: 5 }),
  cvText: text('cv_text'),
  createdAt: datetime('created_at').default(sql`now()`),
});

// ─── FLOAT LIST CANDIDATES ───────────────────────────────
export const flCandidates = mysqlTable('fl_candidates', {
  id: varchar('id', { length: 20 }).primaryKey(),
  initials: varchar('initials', { length: 5 }),
  name: varchar('name', { length: 255 }).notNull(),
  mobile: varchar('mobile', { length: 20 }),
  email: varchar('email', { length: 255 }),
  location: varchar('location', { length: 100 }),
  company: varchar('company', { length: 255 }),
  designation: varchar('designation', { length: 255 }),
  exp: int('exp'),
  ctc: int('ctc'),
  expected: int('expected'),
  notice: int('notice'),
  status: varchar('status', { length: 50 }).default('Active'),
  qual: json('qual').$type<string[]>().default([]),
  dreamRoles: json('dream_roles').$type<string[]>().default([]),
  dreamCos: json('dream_cos').$type<string[]>().default([]),
  expTags: json('exp_tags').$type<string[]>().default([]),
  score: float('score'),
  assessDate: varchar('assess_date', { length: 20 }),
  linkedin: varchar('linkedin', { length: 500 }),
  linkedinPdf: varchar('linkedin_pdf', { length: 500 }),
  targetCompany: varchar('target_company', { length: 255 }),
  currency: varchar('currency', { length: 20 }).default('INR'),
  cvFileName: varchar('cv_file_name', { length: 255 }),
  notes: text('notes'),
  hasCv: boolean('has_cv').default(false),
  cvText: text('cv_text'),
  profilePic: mediumtext('profile_pic'),
  createdAt: datetime('created_at').default(sql`now()`),
});

// ─── FL REFERENCES ───────────────────────────────────────
export const flReferences = mysqlTable('fl_references', {
  id: int('id').autoincrement().primaryKey(),
  candId: varchar('cand_id', { length: 20 }).notNull().references(() => flCandidates.id),
  type: varchar('type', { length: 50 }),
  name: varchar('name', { length: 255 }),
  org: varchar('org', { length: 255 }),
  rel: varchar('rel', { length: 255 }),
  text: text('text'),
  createdAt: datetime('created_at').default(sql`now()`),
});

// ─── FL SUBMISSIONS ──────────────────────────────────────
export const flSubmissions = mysqlTable('fl_submissions', {
  id: varchar('id', { length: 20 }).primaryKey(),
  candId: varchar('cand_id', { length: 20 }).notNull().references(() => flCandidates.id),
  candName: varchar('cand_name', { length: 255 }),
  client: varchar('client', { length: 255 }),
  role: varchar('role', { length: 255 }),
  consultant: varchar('consultant', { length: 255 }),
  dateShared: varchar('date_shared', { length: 20 }),
  via: json('via').$type<string[]>().default([]),
  followUp: varchar('follow_up', { length: 20 }),
  status: varchar('status', { length: 50 }),
  response: text('response'),
  createdAt: datetime('created_at').default(sql`now()`),
});

// ─── FL FOLLOW-UPS ───────────────────────────────────────
export const flFollowUps = mysqlTable('fl_followups', {
  id: varchar('id', { length: 20 }).primaryKey(),
  candId: varchar('cand_id', { length: 20 }).notNull().references(() => flCandidates.id),
  cand: varchar('cand', { length: 255 }),
  client: varchar('client', { length: 255 }),
  role: varchar('role', { length: 255 }),
  consultant: varchar('consultant', { length: 255 }),
  dueDate: varchar('due_date', { length: 20 }),
  status: varchar('status', { length: 20 }),
  note: text('note'),
  createdAt: datetime('created_at').default(sql`now()`),
});

// ─── FL ACTIVITIES ───────────────────────────────────────
export const flActivities = mysqlTable('fl_activities', {
  id: int('id').autoincrement().primaryKey(),
  candId: varchar('cand_id', { length: 20 }).notNull().references(() => flCandidates.id),
  date: varchar('date', { length: 20 }),
  time: varchar('time', { length: 20 }),
  consultant: varchar('consultant', { length: 255 }),
  note: text('note'),
  type: varchar('type', { length: 50 }),
  createdAt: datetime('created_at').default(sql`now()`),
});

// ─── FRAMEWORKS ──────────────────────────────────────────
export const frameworks = mysqlTable('frameworks', {
  id: varchar('id', { length: 20 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  industry: varchar('industry', { length: 255 }),
  usedIn: int('used_in').default(0),
  lastModified: varchar('last_modified', { length: 50 }),
  reportSections: json('report_sections').$type<string[]>().default(['Relevant Experience', 'Motivation & Fit', 'Key Strengths', 'Areas to Probe', 'Mauna Kea Recommendation']),
  createdAt: datetime('created_at').default(sql`now()`),
});

export const frameworkCategories = mysqlTable('framework_categories', {
  id: int('id').autoincrement().primaryKey(),
  frameworkId: varchar('framework_id', { length: 20 }).notNull().references(() => frameworks.id),
  name: varchar('name', { length: 255 }).notNull(),
  sortOrder: int('sort_order').default(0),
});

export const frameworkCriteria = mysqlTable('framework_criteria', {
  id: int('id').autoincrement().primaryKey(),
  categoryId: int('category_id').notNull().references(() => frameworkCategories.id),
  name: varchar('name', { length: 255 }).notNull(),
  weight: int('weight').default(10),
  sortOrder: int('sort_order').default(0),
});

// ─── USERS ───────────────────────────────────────────────
export const platformUsers = mysqlTable('platform_users', {
  id: varchar('id', { length: 10 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }),
  status: varchar('status', { length: 20 }).default('Active'),
  lastLogin: varchar('last_login', { length: 100 }),
  initials: varchar('initials', { length: 5 }),
  createdAt: datetime('created_at').default(sql`now()`),
});

// ─── CANDIDATE REPORTS (AI WORKBENCH) ────────────────────
export const candidateReports = mysqlTable('candidate_reports', {
  id: varchar('id', { length: 20 }).primaryKey(),
  candidateId: varchar('candidate_id', { length: 20 }).notNull(), // Can be FlCandidate or MandateCandidate ID
  frameworkId: varchar('framework_id', { length: 20 }).notNull().references(() => frameworks.id),
  status: varchar('status', { length: 50 }).default('Generating'), // Generating, Completed, Failed
  reportData: json('report_data'), // The dynamic JSON output from the AI
  createdAt: datetime('created_at').default(sql`now()`),
});

// ─── TYPES ───────────────────────────────────────────────
export type Mandate = typeof mandates.$inferSelect;
export type MandateCandidate = typeof mandateCandidates.$inferSelect;
export type FlCandidate = typeof flCandidates.$inferSelect;
export type FlSubmission = typeof flSubmissions.$inferSelect;
export type FlFollowUp = typeof flFollowUps.$inferSelect;
export type FlReference = typeof flReferences.$inferSelect;
export type FlActivity = typeof flActivities.$inferSelect;
export type Framework = typeof frameworks.$inferSelect;
export type FrameworkCategory = typeof frameworkCategories.$inferSelect;
export type FrameworkCriterion = typeof frameworkCriteria.$inferSelect;
export type PlatformUser = typeof platformUsers.$inferSelect;
export type CandidateReport = typeof candidateReports.$inferSelect;
