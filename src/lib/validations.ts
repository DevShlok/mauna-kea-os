import { z } from "zod";

// ─── MASTER DATA ──────────────────────────────────────────
export const masterClientSchema = z.object({
  companyName: z.string().min(1, "Company name is required").trim(),
  industry: z.string().optional().nullable(),
  accountOwner: z.string().optional().nullable(),
  hrLeaderName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  linkedInUrl: z.string().optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  sourceType: z.string().optional().nullable(),
  confidence: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const masterIndustrySchema = z.object({
  sectorName: z.string().min(1, "Sector name is required").trim(),
  includesConsolidatedFrom: z.string().optional().nullable(),
});

export const masterLocationSchema = z.object({
  rawEntry: z.string().min(1, "Raw entry is required").trim(),
  standardizedLocation: z.string().min(1, "Standardized location is required").trim(),
  mappingAction: z.string().optional().nullable(),
});

// ─── MANDATES ─────────────────────────────────────────────
export const createMandateSchema = z.object({
  role: z.string().min(1, "Role is required"),
  company: z.string().min(1, "Company is required"),
  ctc: z.string().optional().nullable(),
  exp: z.string().optional().nullable(),
  workMode: z.string().optional().nullable(),
  diversity: z.string().optional().nullable(),
  clientPOC: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable().or(z.literal("")),
  pocPhone: z.string().optional().nullable(),
  pocCc: z.array(z.string()).optional().default([]),
  sectors: z.array(z.string()).optional().default([]),
  targetCompanies: z.array(z.string()).optional().default([]),
  geography: z.string().optional().nullable(),
  consultant: z.string().optional().nullable(),
  jdUrl: z.string().optional().nullable(),
  interviewNotesUrl: z.string().optional().nullable(),
  additionalDocsUrl: z.string().optional().nullable(),
  jdText: z.string().optional().nullable(),
  interviewNotesText: z.string().optional().nullable(),
  additionalDocsText: z.string().optional().nullable(),
  searchNotes: z.string().optional().nullable(),
  openQuestions: z.string().optional().nullable(),
  frameworkId: z.string().optional().nullable(),
});

export const editMandateSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  ctc: z.string().optional().nullable(),
  exp: z.string().optional().nullable(),
  workMode: z.string().optional().nullable(),
  clientPOC: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable().or(z.literal("")),
  pocPhone: z.string().optional().nullable(),
  consultant: z.string().optional().nullable(),
  target: z.string().optional().nullable(),
  geography: z.string().optional().nullable(),
  auditLog: z.record(z.string(), z.any()).optional(),
});

// ─── FRAMEWORKS ───────────────────────────────────────────
const frameworkCriterionSchema = z.object({
  name: z.string().min(1),
  weight: z.number().optional().default(10),
});

const frameworkCategorySchema = z.object({
  name: z.string().min(1),
  weight: z.number().optional().default(100),
  criteria: z.array(frameworkCriterionSchema).optional().default([]),
});

export const frameworkSchema = z.object({
  name: z.string().min(1, "Name is required"),
  industry: z.string().optional().nullable(),
  categories: z.array(frameworkCategorySchema).optional().default([]),
});

// ─── CANDIDATES / FLOAT ENTRIES ──────────────────────────
export const candidateUpsertSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  mobile: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  exp: z.union([z.string(), z.number()]).optional().nullable(),
  tenure: z.union([z.string(), z.number()]).optional().nullable(),
  ctc: z.union([z.string(), z.number()]).optional().nullable(),
  fixedCtc: z.union([z.string(), z.number()]).optional().nullable(),
  variableCtc: z.union([z.string(), z.number()]).optional().nullable(),
  expected: z.union([z.string(), z.number()]).optional().nullable(),
  notice: z.union([z.string(), z.number()]).optional().nullable(),
  esops: z.union([z.string(), z.number()]).optional().nullable(),
  esopVesting: z.any().optional().nullable(),
  status: z.string().optional().nullable(),
  qual: z.array(z.any()).optional().default([]),
  dreamRoles: z.array(z.string()).optional().default([]),
  dreamCos: z.array(z.string()).optional().default([]),
  expTags: z.array(z.string()).optional().default([]),
  pastCompanies: z.array(z.string()).optional().default([]),
  priorExperiences: z.array(z.any()).optional().default([]),
  currentCompanyStartDate: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  targetCompany: z.string().optional().nullable(),
  currency: z.string().optional().default("INR"),
  cvFileName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  cvText: z.string().optional().nullable(),
  profilePic: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  hometown: z.string().optional().nullable(),
  stability: z.any().optional().nullable(),
  relocationStatus: z.string().optional().nullable(),
  relocationPrefs: z.any().optional().nullable(),
  auditLog: z.record(z.string(), z.any()).optional(),
});

// ─── SUBMISSIONS / FLOATS ─────────────────────────────────
export const addSubmissionSchema = z.object({
  candId: z.string().optional().nullable(),
  candName: z.string().min(1, "Candidate name is required"),
  candCompany: z.string().optional().nullable(),
  client: z.string().min(1, "Client is required"),
  role: z.string().min(1, "Role is required"),
  consultant: z.string().optional().nullable(),
  mandateId: z.union([z.string(), z.number()]).optional().nullable(),
});

// ─── FOLLOW-UPS ───────────────────────────────────────────
export const addFollowUpSchema = z.object({
  candId: z.string().optional().nullable(),
  candName: z.string().min(1, "Candidate name is required"),
  client: z.string().min(1, "Client is required"),
  role: z.string().min(1, "Role is required"),
  consultant: z.string().optional().nullable(),
  dueDate: z.string().min(1, "Due date is required"),
  note: z.string().optional().nullable(),
});

// ─── REFERENCES ───────────────────────────────────────────
export const addReferenceSchema = z.object({
  candId: z.string().min(1, "Candidate ID is required"),
  type: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required"),
  org: z.string().optional().nullable(),
  rel: z.string().optional().nullable(),
  text: z.string().optional().nullable(),
});

// ─── CLIENTS ──────────────────────────────────────────────
export const createClientSchema = z.object({
  id: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required"),
  accountId: z.string().optional().nullable(),
  vertical: z.string().optional().nullable(),
  owner: z.string().optional().nullable(),
  status: z.string().optional().default("Active"),
  legalEntityName: z.string().optional().nullable(),
  contacts: z.array(z.any()).optional().default([]),
  // ── Legal & billing fields ──
  gstNumber:           z.string().optional().nullable(),
  panNumber:           z.string().optional().nullable(),
  cinNumber:           z.string().optional().nullable(),
  registeredAddress:   z.string().optional().nullable(),
  billingAddress:      z.string().optional().nullable(),
  city:                z.string().optional().nullable(),
  state:               z.string().optional().nullable(),
  country:             z.string().optional().default("India"),
  pinCode:             z.string().optional().nullable(),
  financeContactName:  z.string().optional().nullable(),
  financeEmail:        z.string().email().optional().nullable().or(z.literal("")),
  billingEmail:        z.string().email().optional().nullable().or(z.literal("")),
  billingPhone:        z.string().optional().nullable(),
  placeOfSupply:       z.string().optional().nullable(),
  currency:            z.string().optional().default("INR"),
  defaultPaymentTerms: z.string().optional().nullable(),
  requiresPo:          z.boolean().optional().default(false),
  vendorCode:          z.string().optional().nullable(),
  clientCode:          z.string().optional().nullable(),
  tdsApplicable:       z.boolean().optional().default(true),
  gstApplicable:       z.boolean().optional().default(true),
  gstRate:             z.number().optional().default(18),
});

export const updateClientSchema = createClientSchema.omit({ id: true });

// ─── CONTRACTS ────────────────────────────────────────────
export const createContractSchema = z.object({
  clientId:             z.string().min(1, "Client is required"),
  contractStartDate:    z.string().min(1, "Start date is required"),
  contractEndDate:      z.string().min(1, "End date is required"),
  renewalType:          z.enum(["Auto", "Manual"]).default("Manual"),
  consultant:           z.string().optional().nullable(),
  businessHead:         z.string().optional().nullable(),
  practice:             z.string().optional().nullable(),
  status:               z.enum(["Draft", "Shared", "Signed", "Expired", "Renewed", "Cancelled"]).default("Draft"),
  commercialStructure:  z.enum(["SuccessFee", "Retained", "Custom"]).optional().nullable(),
  successFeePct:        z.number().optional().nullable(),
  minFee:               z.number().optional().nullable(),
  maxFee:               z.number().optional().nullable(),
  retainerAmount:       z.number().optional().nullable(),
  replacementPeriod:    z.number().optional().nullable(),
  guaranteePeriod:      z.number().optional().nullable(),
  paymentTerms:         z.string().optional().nullable(),
  currency:             z.string().optional().default("INR"),
  billingMilestones:    z.array(z.any()).optional().default([]),
  latePaymentClause:    z.string().optional().nullable(),
  travelExpenses:       z.string().optional().nullable(),
  signingAuthorityClient: z.object({
    name: z.string().optional(),
    designation: z.string().optional(),
    email: z.string().optional(),
  }).optional().default({}),
  signingAuthorityMK: z.object({
    name: z.string().optional(),
    designation: z.string().optional(),
  }).optional().default({}),
  ctcSlabs: z.array(z.object({
    minCtc: z.number(),
    maxCtc: z.number(),
    feePct: z.number(),
  })).optional().default([]),
  customClauses: z.array(z.object({
    title: z.string(),
    text: z.string(),
  })).optional().default([]),
  exclusivity:          z.boolean().optional().default(false),
  nonPoachingMonths:    z.number().optional().default(0),
  confidentiality:      z.boolean().optional().default(true),
  notes:                z.string().optional().nullable(),
});

export const updateContractSchema = createContractSchema.partial();
