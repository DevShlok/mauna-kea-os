# Contracts & Invoice Module — Phase-Wise Implementation Plan

**Last Updated:** 2026-08-11  
**Scope:** Feedback from email on Contracts + Invoice modules  
**Project Root:** `mauna-kea-os/`

---

## Status Legend
- ✅ **Implemented** — Code exists and is production-ready
- ⚠️ **Partial** — Logic exists but incomplete or incorrect
- ❌ **Not Implemented** — Not yet built

---

## Part 1: Status Audit

### CONTRACTS MODULE

| # | Requirement | Status | File / Note |
|---|---|---|---|
| 2.1 | Auto-populate Lead Consultant from Client DB (with override) | ✅ | `ContractWizard.tsx` L88–96 — `useEffect` on `clientId` change |
| 2.2 | Auto-populate Practice/Sector from Client DB (with override) | ✅ | Same `useEffect` block |
| 2.3 | CTC-wise commission slab grid (vs flat fee %) | ✅ | `ContractWizard.tsx` L55–59 + slab add/remove handlers |
| 2.4 | Generic Governance clauses + Add Custom Clause | ✅ | `addCustomClause / removeCustomClause` handlers present |
| 2.5 | Review & Generate → Editable Word Doc (.docx) | ⚠️ | HTML-to-Word via file-saver works but uses "Mauna Kea OS" — must update legal entity to "Mauna Kea International Pvt Ltd"; docx still has gaps vs standard contract |
| 2.6 | Signing Authorities (Client + MK) captured in form | ✅ | `signingAuthorityClient` + `signingAuthorityMK` in form state |
| 2.7 | Contract tracking table + role-restricted download | ✅ | `ContractsClient.tsx` has table + export; role guard exists |
| 2.8 | Default view = Contracts DB with "Add Contract" sub-option | ⚠️ | Navigation to `/new` exists, but landing page may not have the exact split-view pattern (like Clients/Candidates) |
| 2.9 | Bi-directional sync: Contract saves back to Client DB | ✅ | `createContractAction` syncs `owner`, `vertical`, `payment_terms` back to `clients` table |
| 2.10 | Force-scroll approval before "Approve & Execute" button | ✅ | Scroll-gated button implemented in `ContractDetailClient.tsx` |
| — | Standard contract template with pre-filled clauses from contract | ⚠️ | Governance clauses exist but some standard clauses from the physical contract are not yet pre-populated |

### INVOICE MODULE

| # | Requirement | Status | File / Note |
|---|---|---|---|
| Inv-1 | Candidate linkage in Step 1 (mandate → client → contract chain) | ✅ | `RaiseInvoiceClient.tsx` — candidate selector auto-fills client/mandate |
| Inv-2 | Editable Particulars description per line | ✅ | `RaiseInvoiceClient.tsx` — `textarea` per line item |
| Inv-3 | Multi-placement line items with + icon | ✅ | `addLineItem` handler + `lineItems` state array |
| Inv-3b | CTC-based fee slab auto-match (<50L=18%, 50L–1Cr=20%, >1Cr=25%) | ✅ | `getProposalSlabFeePct()` in `RaiseInvoiceClient.tsx` |
| Inv-4a | CGST/SGST split for intra-state | ✅ | `taxType === "INTRA_STATE"` branch |
| Inv-4b | UTGST for union territories | ✅ | `taxType === "UNION_TERRITORY"` branch |
| Inv-4c | IGST for inter-state | ✅ | `taxType === "INTER_STATE"` branch |
| Inv-5a | Legal entity: "Mauna Kea International Pvt Ltd" (not "Mauna Kea OS") | ❌ | `InvoiceDetailClient.tsx` L177 still shows "MAUNA KEA OS" |
| Inv-5b | MK billing address (D6 801, Golf Course, Parshavnath, Gurugram 122011) | ❌ | Not shown in invoice layout |
| Inv-5c | MK GSTIN: `06AAUCM4115F1ZG` | ❌ | Shows "N/A" |
| Inv-5d | MK State + State Code (Haryana / 06) | ❌ | Not shown |
| Inv-5e | MK PAN: `AAUCM4115F` | ❌ | Not shown |
| Inv-5f | "Original for Recipient" classification on invoice header | ❌ | Not present |
| Inv-5g | Client full registered/billing address | ⚠️ | Shows "Address not recorded" placeholder; field exists in schema but may be empty |
| Inv-5h | Client GSTIN | ⚠️ | Shown if present, but "N/A" when absent — needs enforcement |
| Inv-5i | Place of Supply + State Code | ❌ | Not shown in invoice layout |
| Inv-5j | Remove Annual CTC from printed invoice | ❌ | Still shown in `InvoiceDetailClient.tsx` L201 |
| Inv-5k | Total GST line (combined, before split) | ❌ | Split lines exist, but no "Total GST" aggregation row |
| Inv-5l | Bank details (HDFC, Account No., IFSC) | ❌ | Not shown |
| Inv-5m | Authorised Signatory section | ❌ | Not shown |
| Inv-5n | Certification line ("Certified that particulars are true and correct") | ❌ | Not shown |
| Inv-5o | Terms & Conditions section | ❌ | Not shown |
| Inv-5p | Reverse charge declaration | ❌ | Not shown |
| Inv-5q | Company logo/branding | ❌ | Text only; no logo image |
| Inv-5r | SAC code verification (998313 vs 998311) | ⚠️ | Using 998313 — needs business confirmation |
| Inv-6 | Draft Email feature (GPT-style, parks in drafts) | ❌ | Not built |

---

## Part 2: Phase-Wise Implementation Plan

---

### Phase 1 — Invoice Legal Layout Fix (Priority: CRITICAL)
**Goal:** Make the Tax Invoice legally compliant as per Indian GST requirements.  
**Est. Effort:** 1 day  
**Touches:** `InvoiceDetailClient.tsx`, `src/lib/constants/mk-company.ts` (new)

#### Step 1.1 — Create MK Company Constants File
**File:** `src/lib/constants/mk-company.ts` [NEW]

```typescript
export const MK_COMPANY = {
  legalName: "Mauna Kea International Pvt Ltd",
  brand: "Mauna Kea",
  tagline: "Executive Search & Advisory",
  gstin: "06AAUCM4115F1ZG",
  pan: "AAUCM4115F",
  state: "Haryana",
  stateCode: "06",
  address: "D6 801, Golf Course Street, Parshavnath Exotica Apartment, Gurugram, Haryana – 122011",
  bank: {
    name: "HDFC Bank",
    accountNo: "XXXXXXXXXX", // fill actual
    ifsc: "HDFC0XXXXXX",    // fill actual
    branch: "Gurugram",
  },
  sacCode: "998313",
  authSignatory: "Authorised Signatory",
  authSignatoryName: "Managing Partner",
  reverseCharge: "No",
};
```

#### Step 1.2 — Update InvoiceDetailClient.tsx Header Block
**File:** `src/features/legal-finance/invoices/components/InvoiceDetailClient.tsx`

Replace the header block (lines 174–187) with:
- Left side: MK Logo (image or styled text) + Legal Name + Address + GSTIN + PAN + State Code
- Right side: **TAX INVOICE** (bold) + "Original for Recipient" + Invoice Number + Date + Due Date
- Import `MK_COMPANY` constant

#### Step 1.3 — Update Billed-To Block
- Show client's complete registered address (from `clientSnapshot.registeredAddress` or `clientAddress`)
- Show client GSTIN: enforce with "Not Provided — Verify with Finance" warning if absent
- Show **Place of Supply**: `invoice.placeOfSupply` + State Code

#### Step 1.4 — Remove Annual CTC from printed view
- Remove `<p><strong>Annual CTC:</strong>...</p>` line (L201)
- Keep "Fee Structure: X% Success Fee" if contract-linked, else omit

#### Step 1.5 — Update Tax Totals Block
Add rows in order:
1. Taxable Value / Subtotal (Excl. GST)
2. CGST (9%) — if intra-state
3. SGST (9%) — if intra-state
4. UTGST (9%) — if UT
5. IGST (18%) — if inter-state
6. **Total GST** (aggregated row)
7. **Total Amount Payable** (bold, highlighted)
8. Amount in Words (existing)

#### Step 1.6 — Add Bank Details Block
Below totals:
```
Bank: HDFC Bank | A/c: XXXXXXX | IFSC: HDFC0XXXXX | Branch: Gurugram
```

#### Step 1.7 — Add Footer Sections
Three footer sections (print-safe):
1. **Authorised Signatory** — right aligned box with name + "For Mauna Kea International Pvt Ltd"
2. **Certification** — "Certified that particulars given above are true and correct"
3. **Terms & Conditions** — short standard T&C text
4. **Reverse Charge** — "Whether tax is payable under reverse charge: No"

#### Database changes needed:
```sql
-- Migration 0035
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS place_of_supply_code VARCHAR(5),
  ADD COLUMN IF NOT EXISTS client_state_code VARCHAR(5);
```

---

### Phase 2 — Contracts .docx Template Fix (Priority: HIGH)
**Goal:** Fix the Word document to use correct legal entity name, complete MK address, and match the standard physical contract format.  
**Est. Effort:** 0.5 days  
**Touches:** `ContractWizard.tsx` `handleDownloadDocx()` method

#### Step 2.1 — Update Legal Entity Reference in Docx
- Replace "Mauna Kea OS" with "Mauna Kea International Pvt Ltd" in docx template
- Update address block to include MK full address

#### Step 2.2 — Standard Contract Clause Alignment
Pre-populate all governance clauses that match the standard physical contract format:
- Exclusivity clause (if selected)
- Non-poaching (12-month default)
- Replacement guarantee
- Confidentiality
- Dispute resolution (standard)
- Late payment interest (1.5%/month)
- Travel reimbursement clause

#### Step 2.3 — Signing Authority Page in Docx
Add a proper signature page at end of docx:
```
For [Client Legal Entity Name]           For Mauna Kea International Pvt Ltd
Name: ____________________              Name: ____________________
Designation: ______________              Designation: ______________
Date: ____________________              Date: ____________________
Place: ___________________              Place: Gurugram
```

---

### Phase 3 — Invoice Navigation & Contracts Default View (Priority: MEDIUM)
**Goal:** Match navigation pattern of Clients/Candidates (database as default, "Add New" as sub-option).  
**Est. Effort:** 0.5 days

#### Step 3.1 — Contracts Page Navigation
**File:** `src/app/dashboard/legal-finance/contracts/page.tsx`

Ensure layout mirrors the Clients/Candidates pattern:
- Default route: `/dashboard/legal-finance/contracts` → Shows `ContractsClient.tsx` (database list)
- Sub-route: `/dashboard/legal-finance/contracts/new` → Shows `ContractWizard.tsx`
- In `ContractsClient.tsx`: "New Contract" button at top-right routes to `/new`

#### Step 3.2 — Invoice Page Navigation  
Similar pattern:
- Default: `/dashboard/legal-finance/invoices` → Invoice list
- Sub: `/dashboard/legal-finance/invoices/new` → `RaiseInvoiceClient.tsx`

---

### Phase 4 — Draft Email Wishlist Feature (Priority: LOW — Wishlist)
**Goal:** After generating an invoice or finalizing a contract, auto-draft a contextual email that parks in user's Gmail drafts (or can be copy-pasted).  
**Est. Effort:** 2–3 days

#### Step 4.1 — Email Draft Generation (AI-Assisted)
**File:** `src/actions/email-drafts.ts` [NEW]

Using Gemini/OpenAI API:
```typescript
// Input: invoice data / contract data + recipient info
// Output: formatted email body (subject, greeting, body, sign-off)
async function generateEmailDraft(type: "invoice" | "contract", data: any): Promise<EmailDraft>
```

#### Step 4.2 — EmailDraftModal Component
**File:** `src/features/legal-finance/components/EmailDraftModal.tsx` [NEW]

- Shows pre-filled email draft (subject + body)
- Fully editable before sending
- "Copy to Clipboard" button
- Optional: Gmail API integration via OAuth for direct "Save to Drafts"
- "Send via System" (if SMTP configured) or "Copy & Open Gmail" fallback

#### Step 4.3 — Integration Points
- In `InvoiceDetailClient.tsx`: "Draft Email for Invoice" button → triggers modal
- In `ContractDetailClient.tsx`: "Draft Execution Email" button → triggers modal

#### Step 4.4 — DB Table for Draft Emails
```sql
-- Migration 0036
CREATE TABLE IF NOT EXISTS email_drafts (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(30), -- 'invoice' | 'contract'
  entity_id VARCHAR(50),
  to_email VARCHAR(255),
  cc_emails TEXT,
  subject TEXT,
  body TEXT,
  status VARCHAR(20) DEFAULT 'Draft', -- Draft | Sent | Discarded
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP
);
```

---

### Phase 5 — Client Address Auto-Population from GSTIN (Priority: LOW — Enhancement)
**Goal:** When a client GSTIN is entered, auto-fetch registered address via GST API.  
**Est. Effort:** 1 day

#### Step 5.1 — GST API Integration
**File:** `src/lib/gst-lookup.ts` [NEW]

Use public GST search API (e.g., `https://sheet.gstincheck.co.in/check/{apikey}/{gstin}`) or internal scrape.

```typescript
export async function lookupGSTIN(gstin: string): Promise<{ 
  legalName: string; 
  tradeName: string; 
  address: string; 
  state: string;
  stateCode: string;
  status: string; 
} | null>
```

#### Step 5.2 — Integration in Client Form
- When finance team enters GSTIN in Client Master, auto-populate:
  - Legal Entity Name
  - Registered Address
  - State + State Code
  - GST Registration Status

---

## Part 3: Immediate Implementation Order (Suggested)

| Priority | Phase | Description | Est. Time |
|---|---|---|---|
| 🔴 P0 | Phase 1 | Invoice legal compliance layout | 1 day |
| 🔴 P0 | Phase 2 | Contracts .docx entity name fix | 0.5 day |
| 🟡 P1 | Phase 3 | Navigation pattern consistency | 0.5 day |
| 🟢 P2 | Phase 4 | Draft Email (Wishlist) | 2–3 days |
| 🟢 P3 | Phase 5 | GSTIN auto-lookup | 1 day |

---

## Part 4: Files Involved (Master List)

### To Create
- `src/lib/constants/mk-company.ts` — MK legal constants
- `src/features/legal-finance/components/EmailDraftModal.tsx` — Email draft UI
- `src/actions/email-drafts.ts` — Email draft generation action
- `src/lib/gst-lookup.ts` — GSTIN API lookup
- `src/db/migrations/0035_invoice_place_of_supply.sql` — Place of supply + state code
- `src/db/migrations/0036_email_drafts.sql` — Email drafts table

### To Modify
- `src/features/legal-finance/invoices/components/InvoiceDetailClient.tsx` — Full legal layout update
- `src/features/legal-finance/contracts/components/ContractWizard.tsx` — Docx entity name fix + clauses
- `src/features/legal-finance/contracts/components/ContractDetailClient.tsx` — Email draft button
- `src/db/schema.ts` — Add `placeOfSupplyCode`, `clientStateCode` to invoices

---

## Part 5: Standard Invoice Fields Reference

Based on email feedback — all fields that MUST appear on a printed Tax Invoice:

| Field | Value / Source |
|---|---|
| Legal Entity Name | Mauna Kea International Pvt Ltd |
| Brand | Mauna Kea |
| MK Address | D6 801, Golf Course Street, Parshavnath Exotica, Gurugram, Haryana – 122011 |
| MK GSTIN | 06AAUCM4115F1ZG |
| MK State / Code | Haryana / 06 |
| MK PAN | AAUCM4115F |
| Classification | TAX INVOICE — Original for Recipient |
| Invoice Number | MK-IN-YYYY-NNNNN (existing format) |
| Client Address | From `client_snapshot.registeredAddress` |
| Client GSTIN | From `client_snapshot.gstNumber` |
| Place of Supply | From `invoices.place_of_supply` + state code |
| SAC Code | 998313 (pending business confirmation) |
| Taxable Value | `fee_before_tax` |
| CGST / SGST / IGST / UTGST | Per tax regime |
| Total GST | Sum of applicable tax components |
| Total Amount Payable | `total_amount` |
| Amount in Words | `numberToWordsINR(total_amount)` |
| Bank Details | HDFC Bank (add actuals in `mk-company.ts`) |
| Authorised Signatory | "For Mauna Kea International Pvt Ltd" |
| Reverse Charge | "No" |
| Terms & Conditions | Standard payment terms text |
| Certification | "Certified that particulars given above are true and correct" |

---

## Part 6: MK Company Constants (Pending Confirmation)

The following need confirmed values from business before going live:
- [ ] HDFC Bank Account Number (actual)
- [ ] HDFC IFSC Code (actual)
- [ ] SAC Code confirmation: 998313 or 998311?
- [ ] CIN Number (from Registrar of Companies)
