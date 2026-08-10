# Database Table: candidate_profile_change_requests

**Purpose:** Tracks candidate profile edit requests for sensitive fields (compensation, work history, notice period, designation, education) that require consultant/admin approval before updating master database records.

## Table Schema

| Column | Type | Description |
|---|---|---|
| `id` | `serial` | Primary Key |
| `cand_id` | `varchar(50)` | Foreign Key to `[[Database/candidates|candidates.id]]` |
| `status` | `varchar(20)` | Request status: `'Pending'`, `'Approved'`, `'Rejected'` |
| `sensitive_changes` | `jsonb` | Map of field changes: `{ [field]: { label, current, proposed } }` |
| `review_notes` | `text` | Rejection or consultant review notes |
| `reviewed_by` | `varchar(255)` | Name of approving/rejecting consultant/admin |
| `reviewed_at` | `timestamp` | Timestamp of review decision |
| `created_at` | `timestamp` | Timestamp when candidate submitted the change request |

## Classification Rules

- **Immediate Updates (No Approval Needed):** `name`, `mobile`, `email`, `location`, `hometown`, `dob`, `relocationStatus`, `relocationPrefs`, `linkedin`, `dreamRoles`, `dreamCos`, `notes`, `profilePic`.
- **Sensitive Fields (Requires Approval):** `designation`, `company`, `currentCompanyStartDate`, `exp`, `expTags`, `pastCompanies`, `priorExperiences`, `ctc`, `fixedCtc`, `variableCtc`, `expectedCtc`, `esops`, `esopVesting`, `notice`, `stability`, `qual`.

## Related Features
- [[Features/candidate-portal]]
- [[Features/internal-os]]
- [[Database/candidates]]
