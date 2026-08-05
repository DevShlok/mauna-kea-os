# BRD Phase 4 — Monetization Features
> **Timeline:** 2–3 weeks · **Depends on:** Phase 2 (tier system must exist for membership gating); Phase 3 optional  
> **Goal:** Build the mentorship marketplace, deferred payment / NBFC financing integration, and candidate membership tiers that gate access to premium features.

---

## Existing Codebase Context

### Auth & User Model
- `platformUsers.role` can be `'admin' | 'consultant' | 'client' | 'candidate'`
- `platformUsers.linkedCandidateId` links a candidate portal user to their `candidates` record
- All candidate-facing pages use `requireRole(['candidate'])` guard
- `candidateBadges.badgeType` is the extensible badge/achievement system used for tier gating

### Payment Infrastructure
**None exists yet.** This phase requires introducing a payment provider. Recommended: **Razorpay** (India-first, supports INR, subscriptions, link-based payments, and NBFC buy-now-pay-later via Razorpay Capital). All payment-related secrets go in environment variables — never in source.

---

## Task 1: Candidate Membership Tiers

### Design
Three membership tiers gate access to premium features:

| Tier Name | Monthly INR | What it Unlocks |
|---|---|---|
| **Explorer** (free) | ₹0 | Applications tracker, consultant directory, jobs board |
| **Achiever** | ₹999/mo | Dream 10, guidance notes, priority representation visibility |
| **Executive** | ₹2,999/mo | Mentorship booking, assessment report PDF download, direct consultant messaging |

### New DB Schema

**File: `src/db/schema.ts`** — add:
```ts
// ─── MEMBERSHIP PLANS (Phase 4) ───────────────────────────
export const membershipPlans = pgTable('membership_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // 'Explorer' | 'Achiever' | 'Executive'
  priceInr: int('price_inr').notNull().default(0),
  features: json('features').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true),
  razorpayPlanId: varchar('razorpay_plan_id', { length: 100 }), // Razorpay recurring plan ID
  createdAt: datetime('created_at').default(sql`now()`),
});

// ─── CANDIDATE SUBSCRIPTIONS (Phase 4) ────────────────────
export const candidateSubscriptions = pgTable('candidate_subscriptions', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  planId: int('plan_id').notNull().references(() => membershipPlans.id),
  status: varchar('status', { length: 50 }).default('Active'), // 'Active' | 'Cancelled' | 'Expired' | 'Trial'
  razorpaySubscriptionId: varchar('razorpay_subscription_id', { length: 100 }),
  currentPeriodEnd: datetime('current_period_end'),
  cancelledAt: datetime('cancelled_at'),
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('cs_cand_id_idx').on(table.candId),
  statusIdx: index('cs_status_idx').on(table.status),
}));

export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type CandidateSubscription = typeof candidateSubscriptions.$inferSelect;
```

### Helper: Membership Guard
**New File: `src/lib/membership.ts`**
```ts
import { db } from '@/db';
import { candidateSubscriptions, membershipPlans } from '@/db/schema';
import { and, eq, gte } from 'drizzle-orm';

export type MembershipLevel = 'Explorer' | 'Achiever' | 'Executive';

export async function getCandidateMembership(candId: string): Promise<MembershipLevel> {
  const [sub] = await db
    .select({ planName: membershipPlans.name, status: candidateSubscriptions.status, end: candidateSubscriptions.currentPeriodEnd })
    .from(candidateSubscriptions)
    .leftJoin(membershipPlans, eq(candidateSubscriptions.planId, membershipPlans.id))
    .where(and(
      eq(candidateSubscriptions.candId, candId),
      eq(candidateSubscriptions.status, 'Active'),
      gte(candidateSubscriptions.currentPeriodEnd, new Date())
    ))
    .orderBy(candidateSubscriptions.id) // most recent
    .limit(1);

  if (!sub || !sub.planName) return 'Explorer';
  return sub.planName as MembershipLevel;
}

export function canAccess(membership: MembershipLevel, feature: string): boolean {
  const ACCESS: Record<string, MembershipLevel[]> = {
    dream_10: ['Achiever', 'Executive'],
    guidance_notes: ['Achiever', 'Executive'],
    mentorship_booking: ['Executive'],
    assessment_pdf: ['Executive'],
    direct_messaging: ['Executive'],
  };
  return ACCESS[feature]?.includes(membership) ?? true; // unknown features default open
}
```

> **Note:** The Dream 10 tier gating in Phase 3 was keyed off assessment tier (A/B/C). In Phase 4, add a second gate: membership must be ≥ Achiever. Both conditions must be true for access. Update `DreamCompaniesClient.tsx` to check both.

### New File: `src/actions/subscription.ts`
```ts
'use server';
// Razorpay subscription creation, webhook handler, cancel subscription actions
// Use Razorpay Node.js SDK: npm install razorpay

export async function createSubscriptionAction(candId: string, planId: number) {
  // 1. Fetch plan's razorpayPlanId
  // 2. Create Razorpay subscription via API
  // 3. Return checkout URL for candidate to complete payment
}

export async function cancelSubscriptionAction(candId: string) {
  // 1. Fetch active subscription
  // 2. Call Razorpay cancel API
  // 3. Update candidateSubscriptions.status = 'Cancelled', cancelledAt = now()
}
```

### Webhook Handler: `src/app/api/webhooks/razorpay/route.ts`
```ts
// Verify Razorpay webhook signature using RAZORPAY_WEBHOOK_SECRET env var
// On 'subscription.activated': update candidateSubscriptions.status = 'Active', currentPeriodEnd
// On 'subscription.cancelled' or 'subscription.completed': set status = 'Cancelled' or 'Expired'
```

### Membership UI Page

**New File: `src/app/candidate/membership/page.tsx`**
- Server-side: fetch candidate's current subscription and all active plans.
- Pass to `MembershipClient`.

**New File: `src/features/candidate-portal/components/MembershipClient.tsx`**
- 3 plan cards (Explorer / Achiever / Executive) with feature lists.
- Current plan highlighted.
- "Upgrade" button → triggers `createSubscriptionAction` → Razorpay checkout redirect.
- "Cancel" button for active paid plans.

---

## Task 2: Mentorship Marketplace

### Design
Consultants (or external mentors added by admin) can list mentorship slots. Candidates with `Executive` membership can book a session.

### New DB Schema

**File: `src/db/schema.ts`** — add:
```ts
// ─── MENTORS (Phase 4) ────────────────────────────────────
export const mentors = pgTable('mentors', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 50 }).references(() => platformUsers.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }),
  bio: text('bio'),
  expertiseTags: json('expertise_tags').$type<string[]>().default([]),
  pricePerSession: int('price_per_session').default(0), // INR
  sessionDurationMins: int('session_duration_mins').default(60),
  calendlyUrl: varchar('calendly_url', { length: 500 }), // OR use in-app booking
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').default(sql`now()`),
});

// ─── MENTORSHIP BOOKINGS (Phase 4) ────────────────────────
export const mentorshipBookings = pgTable('mentorship_bookings', {
  id: serial('id').primaryKey(),
  candId: varchar('cand_id', { length: 50 }).notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  mentorId: int('mentor_id').notNull().references(() => mentors.id),
  scheduledAt: datetime('scheduled_at').notNull(),
  status: varchar('status', { length: 50 }).default('Scheduled'), // Scheduled | Completed | Cancelled | No-Show
  paymentStatus: varchar('payment_status', { length: 50 }).default('Pending'), // Pending | Paid | Refunded
  razorpayOrderId: varchar('razorpay_order_id', { length: 100 }),
  notes: text('notes'), // post-session notes by mentor
  createdAt: datetime('created_at').default(sql`now()`),
}, (table) => ({
  candIdIdx: index('mb_cand_id_idx').on(table.candId),
  mentorIdIdx: index('mb_mentor_id_idx').on(table.mentorId),
}));

export type Mentor = typeof mentors.$inferSelect;
export type MentorshipBooking = typeof mentorshipBookings.$inferSelect;
```

### Routes

| Route | Who | Purpose |
|---|---|---|
| `/candidate/mentorship` | Executive member candidate | Browse mentors, book session |
| `/dashboard/mentorship` | Admin/Consultant | Manage mentor listings, view bookings |

### Booking Flow
1. Candidate browses mentor cards at `/candidate/mentorship`
2. Clicks "Book Session" → membership guard check (Executive only)
3. Session date/time selection (inline calendar or Calendly embed via `calendlyUrl`)
4. Payment via Razorpay order API (`createRazorpayOrderAction`)
5. On payment success: `mentorshipBookings` row created, notifications sent to mentor + candidate

### Deferred Payment / NBFC Integration
For candidates who cannot pay upfront, offer "Pay in 3" via Razorpay's NBFC product:
- Show "Pay in 3 EMIs" option at checkout
- Razorpay handles underwriting and collection
- From the app's perspective: treat as a normal Razorpay order with `method: 'emi'` option
- No additional backend code required beyond standard Razorpay integration

---

## Task 3: Assessment Report PDF Download (Executive Feature)

### Design
Executive members can download their rubric assessment report as a PDF.

### Implementation
- **No new schema** — data is in `candidateReports.reportData`.
- Use a server action that generates a PDF from the report JSON using a library like `@react-pdf/renderer` or `jsPDF`.

**New File: `src/app/api/candidate/assessment-pdf/route.ts`**
```ts
import { NextRequest, NextResponse } from 'next/server';
// 1. requireRole(['candidate'])
// 2. getCandidateMembership(candId) → must be 'Executive'
// 3. Fetch candidateReports row for 'rubric-assessment'
// 4. Generate PDF from reportData JSON
// 5. Return as PDF attachment
```

---

## DB Migration Required

```sql
CREATE TABLE IF NOT EXISTS membership_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price_inr INT NOT NULL DEFAULT 0,
  features JSON DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  razorpay_plan_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candidate_subscriptions (
  id SERIAL PRIMARY KEY,
  cand_id VARCHAR(50) NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  plan_id INT NOT NULL REFERENCES membership_plans(id),
  status VARCHAR(50) DEFAULT 'Active',
  razorpay_subscription_id VARCHAR(100),
  current_period_end TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cs_cand_id_idx ON candidate_subscriptions(cand_id);

CREATE TABLE IF NOT EXISTS mentors (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES platform_users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  bio TEXT,
  expertise_tags JSON DEFAULT '[]',
  price_per_session INT DEFAULT 0,
  session_duration_mins INT DEFAULT 60,
  calendly_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mentorship_bookings (
  id SERIAL PRIMARY KEY,
  cand_id VARCHAR(50) NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  mentor_id INT NOT NULL REFERENCES mentors(id),
  scheduled_at TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'Scheduled',
  payment_status VARCHAR(50) DEFAULT 'Pending',
  razorpay_order_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mb_cand_id_idx ON mentorship_bookings(cand_id);
CREATE INDEX IF NOT EXISTS mb_mentor_id_idx ON mentorship_bookings(mentor_id);
```

Also **seed `membership_plans`**:
```sql
INSERT INTO membership_plans (name, price_inr, features, is_active) VALUES
('Explorer', 0, '["Applications tracker", "Consultant directory", "Jobs board"]', true),
('Achiever', 999, '["Dream 10 tracking", "Guidance notes", "Priority visibility"]', true),
('Executive', 2999, '["Mentorship booking", "Assessment PDF", "Direct messaging"]', true)
ON CONFLICT DO NOTHING;
```

---

## Environment Variables Required
```
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

---

## Testing Checklist
- [ ] Explorer candidate → Dream 10 shows locked (membership gate)
- [ ] Achiever candidate → Dream 10 and guidance unlocked
- [ ] Executive candidate → Mentorship, PDF download, messaging unlocked
- [ ] Razorpay checkout opens from Upgrade button
- [ ] Webhook fires subscription.activated → `candidateSubscriptions.status = 'Active'`
- [ ] Booking created → both mentor and candidate notified
- [ ] PDF download returns valid PDF for Executive member
- [ ] `npx tsc --noEmit` passes 0 errors
