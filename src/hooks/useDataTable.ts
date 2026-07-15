import { useState, useMemo, useCallback } from "react";

export type SortDir = "asc" | "desc" | null;

export interface UseDataTableOptions<T> {
  data: T[];
  defaultSortKey?: keyof T | null;
  defaultSortDir?: SortDir;
  defaultPageSize?: number;
}

export interface UseDataTableReturn<T> {
  paginatedData: T[];
  totalRows: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  sortKey: keyof T | null;
  sortDir: SortDir;
  toggleSort: (key: keyof T) => void;
  startIndex: number;
  endIndex: number;
}

export function useDataTable<T extends Record<string, any>>({
  data,
  defaultSortKey = null,
  defaultSortDir = "desc",
  defaultPageSize = 10,
}: UseDataTableOptions<T>): UseDataTableReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortKey ? defaultSortDir : null);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const toggleSort = useCallback((key: keyof T) => {
    setCurrentPage(1);
    setSortKey((prevKey) => {
      if (prevKey !== key) {
        setSortDir("asc");
        return key;
      }
      // Same key — cycle asc → desc → null
      setSortDir((prevDir) => {
        if (prevDir === "asc") return "desc";
        if (prevDir === "desc") {
          // Reset to null sort — will be handled by returning null key
          return null;
        }
        return "asc";
      });
      // If cycling to null, we need to clear the key too — handled via a ref trick.
      // We return key for now and let sortDir===null govern the no-sort path.
      return key;
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const aComp = typeof aVal === "string" ? aVal.toLowerCase() : aVal;
      const bComp = typeof bVal === "string" ? bVal.toLowerCase() : bVal;
      if (aComp < bComp) return sortDir === "asc" ? -1 : 1;
      if (aComp > bComp) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir]);

  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const paginatedData = useMemo(() => sortedData.slice(startIndex, endIndex), [sortedData, startIndex, endIndex]);

  const goToPage = useCallback((page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages))), [totalPages]);
  const goToNextPage = useCallback(() => setCurrentPage((p) => Math.min(p + 1, totalPages)), [totalPages]);
  const goToPrevPage = useCallback(() => setCurrentPage((p) => Math.max(p - 1, 1)), []);

  return {
    paginatedData,
    totalRows,
    currentPage: safeCurrentPage,
    totalPages,
    pageSize,
    setPageSize,
    goToPage,
    goToNextPage,
    goToPrevPage,
    sortKey,
    sortDir,
    toggleSort,
    startIndex,
    endIndex,
  };
}
