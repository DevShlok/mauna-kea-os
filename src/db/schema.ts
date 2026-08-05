import { pgTable, integer as int, varchar, text, doublePrecision as float, boolean, timestamp as datetime, json, text as mediumtext, date, serial, index, unique } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

// ─── MANDATES ────────────────────────────────────────────
export const mandates = pgTable('mandates', {
  id: serial('id').primaryKey(),
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
  pocCc: json('poc_cc').$type<string[]>().default([]),
  diversity: varchar('diversity', { length: 255 }),
  targetCompanies: json('target_companies').$type<string[]>().default([]),
  jdUrl: varchar('jd_url', { length: 1000 }),
  interviewNotesUrl: varchar('interview_notes_url', { length: 1000 }),
  additionalDocsUrl: varchar('additional_docs_url', { length: 1000 }),
  jdText: text('jd_text'),
  interviewNotesText: text('interview_notes_text'),
  searchNotes: text('search_notes'),
  additionalDocsText: text('additional_docs_text'),
  openQuestions: text('open_questions'),
  frameworkId: varchar('framework_id', { length: 20 }),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: datetime('deleted_at'),
  deletedBy: varchar('deleted_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
  auditLog: json('audit_log').$type<Record<string, { updatedBy: string, updatedAt: string }>>().default({}),
  metadata: json('metadata').$type<Record<string, any>>().default({}),
}, (table) => ({
  companyIdx: index('mandates_company_idx').on(table.company),
  roleIdx: index('mandates_role_idx').on(table.role),
  statusIdx: index('mandates_status_idx').on(table.status),
  isDeletedIdx: index('mandates_is_deleted_idx').on(table.isDeleted),
}));

// ─── MANDATE CANDIDATES ──────────────────────────────────
export const mandateCandidates = pgTable('mandate_candidates', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  mandateId: int('mandate_id').notNull().references(() => mandates.id),
  stage: varchar('stage', { length: 50 }).default('universe'),
  score: float('score'),
  hasReport: boolean('has_report').default(false),
  isSentToClient: boolean('is_sent_to_client').default(false),
  createdAt: datetime('created_at').default(sql`now()`),
  addedBy: varchar('added_by', { length: 255 }),
  ranking: int('ranking'),
  competencies: json('competencies').$type<{skill: string; rating: number}[]>().default([]),
  movementProb: varchar('movement_prob', { length: 50 }),
  movementReason: varchar('movement_reason', { length: 255 }),
}, (table) => ({
  mandateIdIdx: index('mc_mandate_id_idx').on(table.mandateId),
  candIdIdx: index('mc_cand_id_idx').on(table.candId),
  stageIdx: index('mc_stage_idx').on(table.stage),
}));

// ─── CANDIDATES (MASTER) ─────────────────────────────────
export const candidates = pgTable('candidates', {
  id: varchar('id', { length: 50 }).primaryKey(),
  slug: varchar('slug', { length: 255 }).unique(),
  initials: varchar('initials', { length: 5 }),
  name: varchar('name', { length: 255 }).notNull(),
  mobile: varchar('mobile', { length: 20 }),
  email: varchar('email', { length: 255 }),
  location: varchar('location', { length: 100 }),
  company: varchar('company', { length: 255 }),
  designation: varchar('designation', { length: 255 }),
  currentCompanyStartDate: varchar('current_company_start_date', { length: 20 }),
  exp: int('exp'),
  tenure: int('tenure'),
  ctc: int('ctc'),
  fixedCtc: int('fixed_ctc'),
  variableCtc: int('variable_ctc'),
  expected: int('expected'),
  notice: int('notice'),
  status: varchar('status', { length: 50 }).default('Active'),
  qual: json('qual').$type<any[]>().default([]),
  dreamRoles: json('dream_roles').$type<string[]>().default([]),
  dreamCos: json('dream_cos').$type<string[]>().default([]),
  expTags: json('exp_tags').$type<string[]>().default([]),
  pastCompanies: json('past_companies').$type<string[]>().default([]),
  priorExperiences: json('prior_experiences').$type<any[]>().default([]),
  score: float('score'),
  assessDate: varchar('assess_date', { length: 20 }),
  linkedin: varchar('linkedin', { length: 500 }),
  linkedinPdf: varchar('linkedin_pdf', { length: 500 }),
  targetCompany: varchar('target_company', { length: 255 }),
  targetCompanies: json('target_companies').$type<string[]>().default([]),
  currency: varchar('currency', { length: 20 }).default('INR'),
  cvFileName: varchar('cv_file_name', { length: 255 }),
  notes: text('notes'),
  hasCv: boolean('has_cv').default(false),
  cvText: text('cv_text'),
  profilePic: mediumtext('profile_pic'),
  esops: int('esops'),
  esopVesting: json('esop_vesting').$type<{ years: number; distribution: number[] }>(),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: datetime('deleted_at'),
  deletedBy: varchar('deleted_by', { length: 255 }),
  dob: date('dob'),
  hometown: varchar('hometown', { length: 100 }),
  stability: json('stability').$type<{ current: string; previous: string }>(),
  relocationStatus: varchar('relocation_status', { length: 50 }),
  relocationPrefs: json('relocation_prefs').$type<string[]>(),
  createdAt: datetime('created_at').default(sql`now()`),
  updatedAt: datetime('updated_at').default(sql`now()`),
  updatedBy: varchar('updated_by', { length: 255 }),
  auditLog: json('audit_log').$type<Record<string, { updatedBy: string, updatedAt: string }>>().default({}),
  metadata: json('metadata').$type<Record<string, any>>().default({}),
  // ─── Phase 4: Candidate Onboarding ───
  profileCompletedAt: datetime('profile_completed_at'),
  onboardingSource: varchar('onboarding_source', { length: 20 }), // 'cv' | 'linkedin' | 'manual' | 'conversational'
  certifications: json('certifications').$type<any[]>().default([]),
}, (table) => ({
  nameIdx: index('candidates_name_idx').on(table.name),
  emailIdx: index('candidates_email_idx').on(table.email),
  companyIdx: index('candidates_company_idx').on(table.company),
  statusIdx: index('candidates_status_idx').on(table.status),
  isDeletedIdx: index('candidates_is_deleted_idx').on(table.isDeleted),
  statusIsDeletedIdx: index('candidates_status_is_deleted_idx').on(table.status, table.isDeleted),
}));

// ─── CANDIDATE FILES (HISTORY) ───────────────────────────
export const candidateFiles = pgTable('candidate_files', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  fileType: varchar('file_type', { length: 50 }).notNull(), // 'CV / Resume' or 'Linkedin Profile'
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: varchar('file_url', { length: 1000 }).notNull(),
  extractedText: mediumtext('extracted_text'),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('cf_cand_id_idx').on(table.candId),
}));

// ─── FLOAT REFERENCES ────────────────────────────────────
export const floatReferences = pgTable('float_references', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  type: varchar('type', { length: 50 }),
  name: varchar('name', { length: 255 }),
  org: varchar('org', { length: 255 }),
  rel: varchar('rel', { length: 255 }),
  text: text('text'),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: datetime('deleted_at'),
  deletedBy: varchar('deleted_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('fr_cand_id_idx').on(table.candId),
}));

// ─── FLOATS (SUBMISSIONS) ────────────────────────────────
export const floats = pgTable('floats', {
  id: varchar('id', { length: 50 }).primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  client: varchar('client', { length: 255 }),
  role: varchar('role', { length: 255 }),
  consultant: varchar('consultant', { length: 255 }),
  dateShared: varchar('date_shared', { length: 20 }),
  via: json('via').$type<string[]>().default([]),
  followUp: varchar('follow_up', { length: 20 }),
  status: varchar('status', { length: 50 }),
  response: text('response'),
  // ─── Phase 1: Candidate Portal structured feedback ───
  feedbackPositives: text('feedback_positives'),
  feedbackImprovements: text('feedback_improvements'),
  feedbackNextSteps: text('feedback_next_steps'),
  interviewDate: varchar('interview_date', { length: 20 }),
  nudgeSentAt: datetime('nudge_sent_at'),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: datetime('deleted_at'),
  deletedBy: varchar('deleted_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
  updatedAt: datetime('updated_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('floats_cand_id_idx').on(table.candId),
  isDeletedIdx: index('floats_is_deleted_idx').on(table.isDeleted),
  statusIdx: index('floats_status_idx').on(table.status),
}));

// ─── FLOAT FOLLOW-UPS ────────────────────────────────────
export const floatFollowUps = pgTable('float_followups', {
  id: varchar('id', { length: 50 }).primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  client: varchar('client', { length: 255 }),
  role: varchar('role', { length: 255 }),
  consultant: varchar('consultant', { length: 255 }),
  dueDate: varchar('due_date', { length: 20 }),
  status: varchar('status', { length: 20 }),
  note: text('note'),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('ff_cand_id_idx').on(table.candId),
}));

// ─── FLOAT ACTIVITIES ────────────────────────────────────
export const floatActivities = pgTable('float_activities', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  date: varchar('date', { length: 20 }),
  time: varchar('time', { length: 20 }),
  consultant: varchar('consultant', { length: 255 }),
  note: text('note'),
  type: varchar('type', { length: 50 }),
  isPinned: boolean('is_pinned').default(false),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('fa_cand_id_idx').on(table.candId),
}));

// ─── FRAMEWORKS ──────────────────────────────────────────
export const frameworks = pgTable('frameworks', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  industry: varchar('industry', { length: 255 }),
  usedIn: int('used_in').default(0),
  lastModified: varchar('last_modified', { length: 50 }),
  reportSections: json('report_sections').$type<string[]>().default(['Relevant Experience', 'Motivation & Fit', 'Key Strengths', 'Areas to Probe', 'Mauna Kea Recommendation']),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: datetime('deleted_at'),
  deletedBy: varchar('deleted_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
});

export const frameworkCategories = pgTable('framework_categories', {
  id: serial('id').primaryKey(),
  frameworkId: varchar('framework_id', { length: 20 }).notNull().references(() => frameworks.id),
  name: varchar('name', { length: 255 }).notNull(),
  weight: int('weight').default(100),
  sortOrder: int('sort_order').default(0),
}, (table) => ({
  frameworkIdIdx: index('fc_framework_id_idx').on(table.frameworkId),
}));

export const frameworkCriteria = pgTable('framework_criteria', {
  id: serial('id').primaryKey(),
  categoryId: int('category_id').notNull().references(() => frameworkCategories.id),
  name: varchar('name', { length: 255 }).notNull(),
  weight: int('weight').default(10),
  sortOrder: int('sort_order').default(0),
}, (table) => ({
  categoryIdIdx: index('fcr_category_id_idx').on(table.categoryId),
}));

// ─── USERS ───────────────────────────────────────────────
export const platformUsers = pgTable('platform_users', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('candidate'), // admin | consultant | client | candidate
  status: varchar('status', { length: 20 }).default('Active'),
  // ─── Phase 1: Consultant profile for candidate-facing directory ───
  bio: text('bio'),
  vertical: varchar('vertical', { length: 100 }),
  expertiseTags: json('expertise_tags').$type<string[]>().default([]),
  linkedinUrl: varchar('linkedin_url', { length: 500 }),
  consultantProfilePic: text('consultant_profile_pic'),
  lastLogin: varchar('last_login', { length: 100 }),
  initials: varchar('initials', { length: 5 }),
  linkedClientId: varchar('linked_client_id', { length: 50 }), // set when role=client
  linkedCandidateId: varchar('linked_candidate_id', { length: 50 }), // set when role=candidate
  lastActive: datetime('last_active'),
  maxLeaves: int('max_leaves').default(20), // default to 20 days
  reportingManagerId: varchar('reporting_manager_id', { length: 50 }), // references another user's id
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: datetime('deleted_at'),
  deletedBy: varchar('deleted_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
  isDeletedIdx: index('users_is_deleted_idx').on(table.isDeleted),
}));

// ─── CANDIDATE REPORTS (AI WORKBENCH) ────────────────────
export const candidateReports = pgTable('candidate_reports', {
  id: varchar('id', { length: 50 }).primaryKey(),
  candidateId: varchar('candidate_id', { length: 50 }).notNull(), // Can be Candidate or MandateCandidate ID
  frameworkId: varchar('framework_id', { length: 20 }).notNull().references(() => frameworks.id),
  status: varchar('status', { length: 50 }).default('Generating'), // Generating, Completed, Failed
  reportData: json('report_data'), // The dynamic JSON output from the AI
  sharedWithClient: boolean('shared_with_client').default(false), // Indicates if the report is visible to the client
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  candidateIdIdx: index('cr_candidate_id_idx').on(table.candidateId),
  frameworkIdIdx: index('cr_framework_id_idx').on(table.frameworkId),
}));

// ─── CLIENTS ─────────────────────────────────────────────
export const clients = pgTable('clients', {
  id: varchar('id', { length: 50 }).primaryKey(),
  slug: varchar('slug', { length: 255 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  accountId: varchar('account_id', { length: 50 }),
  vertical: varchar('vertical', { length: 100 }),
  owner: varchar('owner', { length: 255 }),
  status: varchar('status', { length: 50 }).default('Active'),
  legalEntityName: varchar('legal_entity_name', { length: 255 }),
  contacts: json('contacts').$type<{name: string; designation: string; number: string; email: string; linkedCandidateId?: string}[]>().default([]),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: datetime('deleted_at'),
  deletedBy: varchar('deleted_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
  metadata: json('metadata').$type<Record<string, any>>().default({}),
}, (table) => ({
  nameIdx: index('clients_name_idx').on(table.name),
  statusIdx: index('clients_status_idx').on(table.status),
  verticalIdx: index('clients_vertical_idx').on(table.vertical),
  isDeletedIdx: index('clients_is_deleted_idx').on(table.isDeleted),
}));

// ─── CLIENT NOTIFICATIONS ────────────────────────────────
export const clientNotifications = pgTable('client_notifications', {
  id: serial('id').primaryKey(),
  clientId: varchar('client_id', { length: 50 }).notNull().references(() => clients.id),
  mandateId: int('mandate_id').notNull().references(() => mandates.id),
  message: text('message').notNull(),
  link: varchar('link', { length: 255 }),
  isRead: boolean('is_read').default(false),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  clientIdIdx: index('cn_client_id_idx').on(table.clientId),
  mandateIdIdx: index('cn_mandate_id_idx').on(table.mandateId),
}));

// ─── CLIENT REMARKS ──────────────────────────────────────
export const clientRemarks = pgTable('client_remarks', {
  id: serial('id').primaryKey(),
  clientId: varchar('client_id', { length: 50 }).notNull().references(() => clients.id),
  mandateId: int('mandate_id').notNull().references(() => mandates.id),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  remarkText: text('remark_text').notNull(),
  status: varchar('status', { length: 50 }).default('Pending'), // Pending, Completed, Closed
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  clientIdIdx: index('crem_client_id_idx').on(table.clientId),
  mandateIdIdx: index('crem_mandate_id_idx').on(table.mandateId),
  candIdIdx: index('crem_cand_id_idx').on(table.candId),
}));

// ─── CANDIDATE NOTIFICATIONS (Phase 1) ─────────────────
export const candidateNotifications = pgTable('candidate_notifications', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  type: varchar('type', { length: 50 }), // status_update | feedback_received | nudge_ack | assessment_ready
  message: text('message').notNull(),
  link: varchar('link', { length: 255 }),
  isRead: boolean('is_read').default(false),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('cn2_cand_id_idx').on(table.candId),
}));

// ─── CONSULTANT NOTIFICATIONS ────────────────────────────
export const consultantNotifications = pgTable('consultant_notifications', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 50 }),
  targetRole: varchar('target_role', { length: 20 }),
  message: text('message').notNull(),
  link: varchar('link', { length: 255 }),
  isRead: boolean('is_read').default(false),
  createdAt: datetime('created_at').default(sql`now()`),
});

// ─── REFERENCE CHECKS (Phase 2) ─────────────────────────
export const referenceChecks = pgTable('reference_checks', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  conductedBy: varchar('conducted_by', { length: 255 }),
  refereeName: varchar('referee_name', { length: 255 }),
  refereeRelationship: varchar('referee_relationship', { length: 100 }),
  refereeCompany: varchar('referee_company', { length: 255 }),
  status: varchar('status', { length: 50 }).default('In Progress'),
  responses: json('responses').$type<Record<string, string>>().default({}),
  summaryPositives: text('summary_positives'),
  summaryImprovements: text('summary_improvements'),
  summaryNeutral: text('summary_neutral'),
  isSharedWithClient: boolean('is_shared_with_client').default(false),
  isVerified: boolean('is_verified').default(false),
  verifiedAt: datetime('verified_at'),
  verifiedBy: varchar('verified_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('rc_cand_id_idx').on(table.candId),
  statusIdx: index('rc_status_idx').on(table.status),
}));

// ─── CANDIDATE VERIFICATION STATUS (Phase 2) ───────────
export const candidateVerifications = pgTable('candidate_verifications', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).unique().notNull().references(() => candidates.id),
  status: varchar('status', { length: 50 }).default('Not Started'),
  badgeLevel: varchar('badge_level', { length: 50 }).default('none'),
  verifiedAt: datetime('verified_at'),
  verifiedBy: varchar('verified_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
  updatedAt: datetime('updated_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('cv_cand_id_idx').on(table.candId),
}));

// ─── TYPES ───────────────────────────────────────────────
export type Mandate = typeof mandates.$inferSelect;
export type MandateCandidate = typeof mandateCandidates.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type Float = typeof floats.$inferSelect;
export type FloatFollowUp = typeof floatFollowUps.$inferSelect;
export type FloatReference = typeof floatReferences.$inferSelect;
export type FloatActivity = typeof floatActivities.$inferSelect;
export type Framework = typeof frameworks.$inferSelect;
export type FrameworkCategory = typeof frameworkCategories.$inferSelect;
export type FrameworkCriterion = typeof frameworkCriteria.$inferSelect;
export type PlatformUser = typeof platformUsers.$inferSelect;
export type CandidateReport = typeof candidateReports.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type ClientNotification = typeof clientNotifications.$inferSelect;
export type ClientRemark = typeof clientRemarks.$inferSelect;
export type ConsultantNotification = typeof consultantNotifications.$inferSelect;
export type CandidateNotification = typeof candidateNotifications.$inferSelect;
export type ReferenceCheck = typeof referenceChecks.$inferSelect;
export type CandidateVerification = typeof candidateVerifications.$inferSelect;

// ─── TIME & LEAVE MANAGEMENT ─────────────────────────────
export const timeLogs = pgTable('time_logs', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 50 }).notNull().references(() => platformUsers.id),
  action: varchar('action', { length: 20 }).notNull(), // 'clock_in', 'clock_out', 'break_start', 'break_end'
  timestamp: datetime('timestamp').notNull(),
  dateString: date('date_string').notNull(), // YYYY-MM-DD for easy daily grouping
}, (table) => ({
  userIdIdx: index('tl_user_id_idx').on(table.userId),
  dateStringIdx: index('tl_date_string_idx').on(table.dateString),
}));

export const leaveRequests = pgTable('leave_requests', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 50 }).notNull().references(() => platformUsers.id),
  leaveType: varchar('leave_type', { length: 50 }).notNull(), // Sick, Casual, Privilege, etc.
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 20 }).default('Pending'), // Pending, Approved, Rejected
  adminNotes: text('admin_notes'),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  userIdIdx: index('lr_user_id_idx').on(table.userId),
}));

export type TimeLog = typeof timeLogs.$inferSelect;
export type LeaveRequest = typeof leaveRequests.$inferSelect;

// ─── MASTER DATA (DICTIONARIES / AUTOFILL) ───────────────
export const masterIndustries = pgTable('master_industries', {
  id: serial('id').primaryKey(),
  sectorName: varchar('sector_name', { length: 255 }).notNull(),
  includesConsolidatedFrom: text('includes_consolidated_from'),
  createdAt: datetime('created_at').default(sql`now()`),
});

export const masterLocations = pgTable('master_locations', {
  id: serial('id').primaryKey(),
  rawEntry: varchar('raw_entry', { length: 255 }).notNull(),
  standardizedLocation: varchar('standardized_location', { length: 255 }).notNull(),
  mappingAction: text('mapping_action'),
  createdAt: datetime('created_at').default(sql`now()`),
});

export const masterClients = pgTable('master_clients', {
  id: serial('id').primaryKey(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  industry: varchar('industry', { length: 255 }),
  accountOwner: varchar('account_owner', { length: 255 }),
  hrLeaderName: varchar('hr_leader_name', { length: 255 }),
  phone: varchar('phone', { length: 100 }),
  designation: varchar('designation', { length: 255 }),
  linkedInUrl: varchar('linkedin_url', { length: 1000 }),
  sourceUrl: varchar('source_url', { length: 1000 }),
  sourceType: varchar('source_type', { length: 100 }),
  confidence: varchar('confidence', { length: 50 }),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`now()`),
});

export type MasterIndustry = typeof masterIndustries.$inferSelect;
export type MasterLocation = typeof masterLocations.$inferSelect;
export type MasterClient = typeof masterClients.$inferSelect;

// ─── RELATIONS ───────────────────────────────────────────
export const mandatesRelations = relations(mandates, ({ many }) => ({
  candidates: many(mandateCandidates),
}));

export const mandateCandidatesRelations = relations(mandateCandidates, ({ one }) => ({
  mandate: one(mandates, {
    fields: [mandateCandidates.mandateId],
    references: [mandates.id],
  }),
  candidate: one(candidates, {
    fields: [mandateCandidates.candId],
    references: [candidates.id],
  }),
}));

export const candidatesRelations = relations(candidates, ({ many, one }) => ({
  mandateCandidates: many(mandateCandidates),
  verification: one(candidateVerifications, {
    fields: [candidates.id],
    references: [candidateVerifications.candId],
  }),
}));

export const frameworksRelations = relations(frameworks, ({ many }) => ({
  categories: many(frameworkCategories),
  reports: many(candidateReports),
}));

export const frameworkCategoriesRelations = relations(frameworkCategories, ({ one, many }) => ({
  framework: one(frameworks, {
    fields: [frameworkCategories.frameworkId],
    references: [frameworks.id],
  }),
  criteria: many(frameworkCriteria),
}));

export const frameworkCriteriaRelations = relations(frameworkCriteria, ({ one }) => ({
  category: one(frameworkCategories, {
    fields: [frameworkCriteria.categoryId],
    references: [frameworkCategories.id],
  }),
}));

export const candidateReportsRelations = relations(candidateReports, ({ one }) => ({
  framework: one(frameworks, {
    fields: [candidateReports.frameworkId],
    references: [frameworks.id],
  }),
}));

// ─── ENGAGEMENT LISTS (CALLING & BD) ────────────────────────
export const engagementListItems = pgTable('engagement_list_items', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 50 }).notNull().references(() => platformUsers.id),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id),
  listType: varchar('list_type', { length: 20 }).notNull(), // 'Calling', 'BD'
  status: varchar('status', { length: 50 }).default('Pending'), 
  nextFollowUp: date('next_follow_up'),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  userIdIdx: index('el_user_id_idx').on(table.userId),
  candIdIdx: index('el_cand_id_idx').on(table.candId),
}));

export const callPlans = pgTable('call_plans', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 50 }).notNull().references(() => platformUsers.id),
  type: varchar('type', { length: 20 }).notNull(), // Weekly, Daily
  date: date('date').notNull(), // Start of week or specific day
  targetCandIds: json('target_cand_ids').$type<string[]>().default([]),
  targetClientIds: json('target_client_ids').$type<string[]>().default([]),
  planText: text('plan_text'), // For Weekly plans
  isReviewed: boolean('is_reviewed').default(false),
  reviewedBy: varchar('reviewed_by', { length: 50 }),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  userIdIdx: index('cp_user_id_idx').on(table.userId),
  dateIdx: index('cp_date_idx').on(table.date),
}));

export type EngagementListItem = typeof engagementListItems.$inferSelect;
export type CallPlan = typeof callPlans.$inferSelect;

// ─── USER PREFERENCES ────────────────────────────────────
// Stores per-user layout/column preferences (cross-device)
// userId = NULL means admin-published org-wide default
export const userPreferences = pgTable('user_preferences', {
  id:        serial('id').primaryKey(),
  userId:    varchar('user_id', { length: 50 }).references(() => platformUsers.id, { onDelete: 'cascade' }),
  prefKey:   varchar('pref_key', { length: 100 }).notNull(),
  // 'candidateListCols' | 'candidateWidgetLayout'
  prefValue: json('pref_value').$type<Record<string, any>>().notNull().default({}),
  isDefault: boolean('is_default').default(false),
  updatedAt: datetime('updated_at').default(sql`now()`),
}, (t) => ({
  userIdx: index('up_user_id_idx').on(t.userId),
  keyIdx:  index('up_pref_key_idx').on(t.prefKey),
  unq: unique('up_unique_user_pref').on(t.userId, t.prefKey),
}));

export type UserPreference = typeof userPreferences.$inferSelect;

// ─── CURATED JOBS (Phase 3) ───────────────────────────────
export const candidateJobs = pgTable('candidate_jobs', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  companyDisplay: varchar('company_display', { length: 255 }),
  isConfidential: boolean('is_confidential').default(false),
  location: varchar('location', { length: 255 }),
  ctcRangeMin: int('ctc_range_min'),
  ctcRangeMax: int('ctc_range_max'),
  experienceMin: int('experience_min'),
  experienceMax: int('experience_max'),
  sector: varchar('sector', { length: 255 }),
  description: text('description'),
  highlights: json('highlights').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true),
  targetCandIds: json('target_cand_ids').$type<string[]>().default([]),
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`now()`),
  expiresAt: datetime('expires_at'),
}, (table) => ({
  isActiveIdx: index('cj_is_active_idx').on(table.isActive),
  sectorIdx: index('cj_sector_idx').on(table.sector),
}));

// ─── JOB INTEREST SIGNALS (Phase 3) ───────────────────────
export const candidateJobInterests = pgTable('candidate_job_interests', {
  id: serial('id').primaryKey(),
  jobId: int('job_id').notNull().references(() => candidateJobs.id, { onDelete: 'cascade' }),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('Shown'),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  jobCandUnique: unique('cji_job_cand_unique').on(table.jobId, table.candId),
  candIdIdx: index('cji_cand_id_idx').on(table.candId),
}));

// ─── DREAM COMPANY STATUS (Phase 3) ───────────────────────
export const dreamCompanyStatus = pgTable('dream_company_status', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('Not Started'),
  notes: text('notes'),
  updatedBy: varchar('updated_by', { length: 255 }),
  updatedAt: datetime('updated_at').default(sql`now()`),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('dcs_cand_id_idx').on(table.candId),
}));

export type CandidateJob = typeof candidateJobs.$inferSelect;
export type CandidateJobInterest = typeof candidateJobInterests.$inferSelect;
export type DreamCompanyStatus = typeof dreamCompanyStatus.$inferSelect;

// ─── CANDIDATE CAREER TIMELINE (Phase 4) ──────────────────────
export const candidateCareerTimeline = pgTable('candidate_career_timeline', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  roleTitle: varchar('role_title', { length: 255 }).notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  description: text('description'),
  isCurrent: boolean('is_current').default(false),
  sortOrder: int('sort_order').default(0),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('cct_cand_id_idx').on(table.candId),
  startDateIdx: index('cct_start_date_idx').on(table.candId, table.startDate),
}));

// ─── CANDIDATE BADGES (Phase 4) ───────────────────────────────
export const candidateBadges = pgTable('candidate_badges', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  badgeType: varchar('badge_type', { length: 50 }).notNull(),
  // 'profile_complete' | 'reference_check_complete' | 'assessment_complete' | 'ai_interview_complete'
  earnedAt: datetime('earned_at').notNull().default(sql`now()`),
  metadata: json('metadata').$type<Record<string, any>>(),
}, (table) => ({
  candIdIdx: index('cb_cand_id_idx').on(table.candId),
  uniq: unique('cb_cand_badge_uniq').on(table.candId, table.badgeType),
}));

// ─── CANDIDATE APPLICATIONS (Phase 4) ─────────────────────────
export const candidateApplications = pgTable('candidate_applications', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  source: varchar('source', { length: 50 }).default('direct'), // 'direct' | 'consultant'
  jobId: int('job_id').references(() => candidateJobs.id, { onDelete: 'set null' }),
  mandateId: int('mandate_id').references(() => mandates.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).default('Profile Submitted'),
  appliedAt: datetime('applied_at').default(sql`now()`),
  updatedAt: datetime('updated_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('ca_cand_id_idx').on(table.candId),
}));

export type CandidateCareerEntry = typeof candidateCareerTimeline.$inferSelect;
export type CandidateBadge = typeof candidateBadges.$inferSelect;
export type CandidateApplication = typeof candidateApplications.$inferSelect;
