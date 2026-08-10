# Decision: AdvancedTable Component Abstraction

**Status:** Active  
**Confirmed in:** `src/components/ui/AdvancedTable.tsx`, `src/features/candidates/components/CandidatesClient.tsx`

## What Was Decided
A single generic `AdvancedTable<T>` component handles pagination, sorting, column resize, column reorder, column visibility, and row selection — shared across all list views in the internal OS.

## Why Not Per-Feature Tables
Each list view (candidates, float list, mandates, clients) has the same interaction model: sortable columns, pagination, resizable headers, saved column preferences. Without extraction, this logic would be duplicated 4+ times with inevitable drift.

## What the Component Does NOT Handle
- Data fetching — caller's responsibility (keeps the component pure presentational)
- Filtering — handled by the parent client component (filter state lives outside AdvancedTable)
- Row rendering specifics — caller provides `renderCell(row, col) => ReactNode`

## Column Persistence
Saved in [[Database/other-tables#user_preferences]] via `useColumnPrefs(prefKey)` hook. Schema:
```ts
{
  key: string;     // column identifier
  label: string;   // display name
  width: number;   // px
  visible: boolean;
  sortable: boolean;
}
```
Admin can publish an org-wide default by saving with `userId = NULL`. Per-user prefs override the default.

## Alternatives Rejected
- **Per-feature table components** — rejected due to code duplication and maintenance burden
- **Third-party table library (TanStack Table, AG Grid)** — rejected to avoid bundle size overhead and to keep full control over column persistence integration with the custom `userPreferences` table
- **Server-side rendering of tables** — rejected because column preference state (reorder, resize) is inherently client-side and requires interactivity

## See Also
- [[Architecture/advanced-table]] — usage and props documentation
- [[Database/other-tables#user_preferences]]
