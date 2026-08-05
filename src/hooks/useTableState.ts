"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface TableStateParams {
  search?: string;
  limit?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  [key: string]: any;
}

export function useTableState(initialParams: TableStateParams, basePath: string) {
  const router = useRouter();

  const [search, setSearch] = useState(initialParams?.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [pageSize, setPageSize] = useState(initialParams?.limit || 10);
  const [sortKey, setSortKey] = useState<string | null>(initialParams?.sortKey || "createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialParams?.sortDir || "desc");
  const [page, setPage] = useState(initialParams?.page || 1);
  
  // Custom filters managed by the page
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== debouncedSearch) setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  // Sync URL State
  useEffect(() => {
    const handler = setTimeout(() => {
      const url = new URL(window.location.href);
      
      // Core params
      if (debouncedSearch) url.searchParams.set("search", debouncedSearch);
      else url.searchParams.delete("search");
      
      url.searchParams.set("limit", String(pageSize));
      url.searchParams.set("page", String(page));
      
      if (sortKey) url.searchParams.set("sortKey", sortKey);
      if (sortDir) url.searchParams.set("sortDir", sortDir);

      // Custom filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          url.searchParams.delete(key);
        } else if (Array.isArray(value)) {
          if (value.length > 0) url.searchParams.set(key, value.join(","));
          else url.searchParams.delete(key);
        } else {
          url.searchParams.set(key, String(value));
        }
      });

      const currentSearch = new URLSearchParams(window.location.search).toString();
      if (url.searchParams.toString() !== currentSearch) {
        router.push(`${basePath}?${url.searchParams.toString()}`);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [debouncedSearch, pageSize, page, sortKey, sortDir, filters, basePath, router]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else {
        setSortKey(null);
        setSortDir("desc");
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return {
    search,
    setSearch,
    debouncedSearch,
    pageSize,
    setPageSize,
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    page,
    setPage,
    filters,
    setFilters,
    toggleSort
  };
}
