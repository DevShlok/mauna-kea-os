# Contracts & Invoice Module — Phase-Wise Implementation Plan

**Last Updated:** 2026-08-11  
**Scope:** Feedback from email on Contracts + Invoice modules  
**Project Root:** `mauna-kea-os/`

---

## Status Legend
- ✅ **Implemented** — Code exists and is production-ready
- ⚠️ **Partial** — Logic exists but incomplete or incorrect
- ❌ **Not Implemented** — Not yet built
- 🔒 **Blocked** — Awaiting external info (bank details etc.)

---

## Part 1: Status Audit

### CONTRACTS MODULE

| # | Requirement | Status | File / Note |
|---|---|---|---|
| 2.1 | Auto-populate Lead Consultant from Client DB (with override) | ✅ | `ContractWizard.tsx` — `useEffect` on `clientId` change |
| 2.2 | Auto-populate Practice/Sector from Client DB (with override) | ✅ | Same `useEffect` block |
| 2.3 | CTC-wise commission slab grid (vs flat fee %) | ✅ | `ContractWizard.tsx` slab add/remove handlers |
| 2.4 | Generic Governance clauses + Add Custom Clause | ✅ | `addCustomClause / removeCustomClause` handlers present |
| 2.5 | Review & Generate → Editable Word Doc (.docx) | ✅ | Commit `872337c` — entity name fixed to "Mauna Kea International Pvt Ltd" |
| 2.6 | Signing Authorities (Client + MK) captured in form | ✅ | `signingAuthorityClient` + `signingAuthorityMK` in form state |
| 2.7 | Contract tracking table + role-restricted download | ✅ | `ContractsClient.tsx` |
| 2.8 | Default view = Contracts DB with "Add Contract" sub-option | ✅ | Commit `872337c` — nav audit confirmed |
| 2.9 | Bi-directional sync: Contract saves back to Client DB | ✅ | `createContractAction` syncs back to `clients` |
| 2.10 | Force-scroll approval before "Approve & Execute" button | ✅ | Scroll-gated button in `ContractDetailClient.tsx` |
| 2.11 | Draft Execution Email (AI-powered) | ✅ | Commit `9ab6780` — `EmailDraftModal.tsx` + `email-drafts.ts` |

### INVOICE MODULE

| # | Requirement | Status | File / Note |
|---|---|---|---|
| Inv-1 | Candidate linkage (mandate → client → contract chain) | ✅ | `RaiseInvoiceClient.tsx` |
| Inv-2 | Editable Particulars description per line | ✅ | `textarea` per line item |
| Inv-3 | Multi-placement line items | ✅ | `addLineItem` handler |
| Inv-3b | CTC-based fee slab auto-match (<50L=18%, 50L–1Cr=20%, >1Cr=25%) | ✅ | `getProposalSlabFeePct()` |
| Inv-4a | CGST/SGST split for intra-state | ✅ | `taxType === "INTRA_STATE"` |
| Inv-4b | UTGST for union territories | ✅ | `taxType === "UNION_TERRITORY"` |
| Inv-4c | IGST for inter-state | ✅ | `taxType === "INTER_STATE"` |
| Inv-5a | Legal entity: "Mauna Kea International Pvt Ltd" | ✅ | `MK_COMPANY` constant + invoice header |
| Inv-5b | MK billing address (Gurugram 122011) | ✅ | `MK_COMPANY.address` in invoice header |
| Inv-5c | MK GSTIN: `06AAUCM4115F1ZG` | ✅ | `MK_COMPANY.gstin` |
| Inv-5d | MK State + State Code (Haryana / 06) | ✅ | `MK_COMPANY.state` / `stateCode` |
| Inv-5e | MK PAN: `AAUCM4115F` | ✅ | `MK_COMPANY.pan` |
| Inv-5f | "Original for Recipient" classification | ✅ | Invoice header block |
| Inv-5g | Client full registered/billing address | ✅ | Shown from `clientSnapshot.registeredAddress` |
| Inv-5h | Client GSTIN (with warning if absent) | ✅ | Warning shown if absent |
| Inv-5i | Place of Supply + State Code | ✅ | Shown in Billed-To block |
| Inv-5j | Remove Annual CTC from printed invoice | ✅ | CTC removed from print view |
| Inv-5k | Total GST line (combined aggregation row) | ✅ | Aggregation row present |
| Inv-5l | Bank details (HDFC) | 🔒 | Placeholder in `MK_COMPANY.bank` — awaiting actual A/c No. + IFSC |
| Inv-5m | Authorised Signatory section | ✅ | Footer section present |
| Inv-5n | Certification line | ✅ | Footer section present |
| Inv-5o | Terms & Conditions section | ✅ | Footer section present |
| Inv-5p | Reverse charge declaration | ✅ | Footer section present |
| Inv-5q | Company logo/branding | ⚠️ | Styled text branding only; no logo image asset yet |
| Inv-5r | SAC code verification (998313 vs 998311) | 🔒 | Using 998313 — awaiting business confirmation |
| Inv-6 | Draft Email feature (AI-assisted) | ✅ | Commit `9ab6780` — `EmailDraftModal.tsx` |

### CLIENT MODULE

| # | Requirement | Status | File / Note |
|---|---|---|---|
| Cl-1 | GSTIN auto-lookup on New Client form | ✅ | Commit `38c2060` — `GstinLookupField.tsx` |
| Cl-2 | Auto-fill legal name, PAN, address, state from GSTIN | ✅ | `/api/gstin-lookup` route + `onLookupSuccess` callback |
| Cl-3 | GSTIN lookup on existing client edit modal | ✅ | `ClientDetailClient.tsx` edit form |
| Cl-4 | Billing & legal fields persist to DB | ✅ | `createClientAction` / `updateClientAction` — all 15 billing fields |
| Cl-5 | Billing & GST info display card on client detail view | ✅ | Conditionally rendered info card |

---

## Part 2: Remaining Open Items

| Priority | Item | Blocker |
|---|---|---|
| 🔒 Blocked | HDFC Bank Account Number | Awaiting confirmation from business |
| 🔒 Blocked | HDFC IFSC Code | Awaiting confirmation from business |
| 🔒 Blocked | SAC Code: 998313 or 998311? | Awaiting CA / business confirmation |
| 🔒 Blocked | CIN Number | From Registrar of Companies |
| ⚠️ Enhancement | Company logo on invoice | Need logo image asset |

---

## Part 3: Git Commit Log

| Commit | Phase | Description |
|---|---|---|
| `d5d78cd` | Phase 0 | Legal & Finance Module Phase 1 — DB schema + base UI |
| `e3cb0c4` | Phase 0+ | Contract wizard enhancements + CTC slabs + custom clauses |
| `f0c6a1a` | Phase 0+ | Invoice multi-line items + CGST/SGST/IGST/UTGST |
| `872337c` | Phase 2+3 | Entity name fix (`MK_COMPANY`), nav audit, .docx fix |
| `9ab6780` | Phase 4 | AI email draft modal (Gemini-powered) |
| `38c2060` | Phase 5 | GSTIN auto-lookup + billing fields + client detail card |

---

## Part 4: MK Company Constants (Pending Confirmation)

- [ ] HDFC Bank Account Number (actual)
- [ ] HDFC IFSC Code (actual)
- [ ] SAC Code confirmation: 998313 or 998311?
- [ ] CIN Number (from Registrar of Companies)
- [ ] Company logo PNG asset for invoice header
