# AdvancedTable Abstraction

**Component:** `src/components/ui/AdvancedTable.tsx`
**Sub-components:** `src/components/DataTable/Pagination.tsx`, `src/components/DataTable/ResizableHeader.tsx`
**Hook:** `src/hooks/useColumnPrefs.ts` (persists column config in `user_preferences`)

## Purpose
A generic, server-state-aware data table used across every list view in the internal OS (Candidates, Float List, Mandates, Clients, etc.). Extracted to avoid re-implementing sort/pagination/column-management per feature.

## Props Interface (TypeScript generic)
```ts
AdvancedTableProps<T> {
  data: T[];              // current page of rows
  total: number;          // total record count (for pagination)
  columns: ColumnDef[];   // full column spec

  // Pagination
  page: number; pageSize: number;
  setPage(); setPageSize();

  // Sorting
  sortKey: string | null; sortDir: 'asc' | 'desc'; onSort();

  // Column persistence (from useColumnPrefs)
  visibleColumns: ColumnDef[];
  setColumnWidth(); reorderColumns(); isLoadingCols?;

  // Row selection
  selectedIds?: Set<string>; onToggleRow?(); onToggleAll?();

  // Rendering
  renderCell: (row: T, col: ColumnDef) => ReactNode;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  getRowId?: (row: T) => string;
}
```

## Column Definitions (`ColumnDef`)
Defined per-feature. Includes: `key`, `label`, `width`, `visible`, `sortable`.

## Column Persistence
`useColumnPrefs(key)` hook reads/writes to [[Database/other-tables#user_preferences]]. `prefKey = 'candidateListCols'` etc. Admin can publish an org-wide default (`userId = NULL`); per-user overrides take precedence.

## Where It Is Used
- `src/features/candidates/components/CandidatesClient.tsx` — master candidate list
- Float List, Mandates, Clients — same pattern

## See Also
[[Decisions/advanced-table-abstraction]]
