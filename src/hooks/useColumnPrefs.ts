"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { getUserPreferenceAction, saveUserPreferenceAction, publishOrgDefaultAction } from "@/actions";

// ─── Types ────────────────────────────────────────────────

export type ColumnCategory =
  | "identity"
  | "contact"
  | "role"
  | "compensation"
  | "availability"
  | "background"
  | "documents"
  | "metadata";

export type ColumnRenderer =
  | "avatar"
  | "badge"
  | "currency"
  | "tags"
  | "qual"
  | "link"
  | "boolean"
  | "date"
  | "truncated"
  | "text";

export interface ColumnDef {
  key: string;
  label: string;
  category: ColumnCategory;
  defaultVisible: boolean;
  visible: boolean;
  width: number;
  order: number;
  sortable: boolean;
  renderer: ColumnRenderer;
}

// ─── Default registry (31 columns) ───────────────────────

export const DEFAULT_COLUMNS: Omit<ColumnDef, "visible" | "order">[] = [
  // Core Identity
  { key: "name",        label: "Name",               category: "identity",     defaultVisible: true,  width: 220, sortable: true,  renderer: "avatar" },
  { key: "initials",    label: "Initials",            category: "identity",     defaultVisible: false, width: 60,  sortable: false, renderer: "avatar" },
  { key: "status",      label: "Status",              category: "identity",     defaultVisible: true,  width: 110, sortable: true,  renderer: "badge" },
  { key: "score",       label: "Score",               category: "identity",     defaultVisible: false, width: 90,  sortable: true,  renderer: "badge" },
  { key: "assessDate",  label: "Assess Date",         category: "identity",     defaultVisible: false, width: 120, sortable: false, renderer: "date" },
  // Contact
  { key: "email",       label: "Email",               category: "contact",      defaultVisible: false, width: 200, sortable: false, renderer: "link" },
  { key: "mobile",      label: "Mobile",              category: "contact",      defaultVisible: false, width: 130, sortable: false, renderer: "text" },
  { key: "linkedin",    label: "LinkedIn",            category: "contact",      defaultVisible: false, width: 100, sortable: false, renderer: "link" },
  { key: "location",    label: "Location",            category: "contact",      defaultVisible: true,  width: 130, sortable: true,  renderer: "text" },
  { key: "hometown",    label: "Hometown",            category: "contact",      defaultVisible: false, width: 130, sortable: false, renderer: "text" },
  // Current Role
  { key: "company",     label: "Current Company",     category: "role",         defaultVisible: true,  width: 180, sortable: true,  renderer: "text" },
  { key: "designation", label: "Current Designation", category: "role",         defaultVisible: true,  width: 180, sortable: true,  renderer: "text" },
  { key: "exp",         label: "Exp (yrs)",           category: "role",         defaultVisible: true,  width: 100, sortable: true,  renderer: "text" },
  { key: "tenure",      label: "Tenure (yrs)",        category: "role",         defaultVisible: false, width: 110, sortable: true,  renderer: "text" },
  // Compensation
  { key: "ctc",         label: "CTC (₹L)",            category: "compensation", defaultVisible: true,  width: 130, sortable: true,  renderer: "currency" },
  { key: "fixedCtc",    label: "Fixed CTC",           category: "compensation", defaultVisible: false, width: 110, sortable: true,  renderer: "currency" },
  { key: "variableCtc", label: "Variable CTC",        category: "compensation", defaultVisible: false, width: 110, sortable: true,  renderer: "currency" },
  { key: "expected",    label: "Expected CTC",        category: "compensation", defaultVisible: false, width: 110, sortable: true,  renderer: "currency" },
  { key: "esops",       label: "ESOPs",               category: "compensation", defaultVisible: false, width: 90,  sortable: true,  renderer: "currency" },
  { key: "currency",    label: "Currency",            category: "compensation", defaultVisible: false, width: 80,  sortable: false, renderer: "text" },
  // Availability & Preferences
  { key: "notice",            label: "Notice (days)",   category: "availability", defaultVisible: false, width: 110, sortable: true,  renderer: "text" },
  { key: "relocationStatus",  label: "Relocation",      category: "availability", defaultVisible: false, width: 130, sortable: false, renderer: "badge" },
  { key: "relocationPrefs",   label: "Reloc. Cities",   category: "availability", defaultVisible: false, width: 160, sortable: false, renderer: "tags" },
  { key: "targetCompany",     label: "Target Company",  category: "availability", defaultVisible: false, width: 160, sortable: false, renderer: "text" },
  { key: "dob",               label: "Date of Birth",   category: "availability", defaultVisible: false, width: 120, sortable: false, renderer: "date" },
  // Background
  { key: "qual",         label: "Qualifications",    category: "background", defaultVisible: true,  width: 160, sortable: false, renderer: "qual" },
  { key: "expTags",      label: "Prior Experience",  category: "background", defaultVisible: true,  width: 160, sortable: false, renderer: "tags" },
  { key: "pastCompanies",label: "Past Companies",    category: "background", defaultVisible: false, width: 160, sortable: false, renderer: "tags" },
  { key: "dreamRoles",   label: "Dream Roles",       category: "background", defaultVisible: false, width: 160, sortable: false, renderer: "tags" },
  // Documents
  { key: "hasCv",      label: "Has CV",         category: "documents", defaultVisible: false, width: 80,  sortable: false, renderer: "boolean" },
  { key: "cvFileName", label: "CV / Resume",    category: "documents", defaultVisible: false, width: 120, sortable: false, renderer: "link" },
  // Metadata
  { key: "notes",      label: "Notes",          category: "metadata",  defaultVisible: false, width: 200, sortable: false, renderer: "truncated" },
  { key: "createdAt",  label: "Added On",       category: "metadata",  defaultVisible: false, width: 130, sortable: true,  renderer: "date" },
  { key: "updatedAt",  label: "Last Updated",   category: "metadata",  defaultVisible: false, width: 130, sortable: true,  renderer: "date" },
];

export const DEFAULT_CLIENT_COLUMNS: Omit<ColumnDef, "visible" | "order">[] = [
  { key: "name",       label: "Client",         category: "identity",  defaultVisible: true,  width: 250, sortable: true,  renderer: "text" },
  { key: "vertical",   label: "Industry",       category: "identity",  defaultVisible: true,  width: 180, sortable: true,  renderer: "text" },
  { key: "owner",      label: "Owner",          category: "metadata",  defaultVisible: true,  width: 150, sortable: true,  renderer: "text" },
  { key: "liveMandates", label: "Live Mandates", category: "metadata",  defaultVisible: true,  width: 150, sortable: false, renderer: "text" },
  { key: "status",     label: "Status",         category: "identity",  defaultVisible: true,  width: 130, sortable: true,  renderer: "badge" },
  { key: "actions",    label: "Actions",        category: "metadata",  defaultVisible: true,  width: 180, sortable: false, renderer: "text" },
];

export const DEFAULT_MANDATE_COLUMNS: Omit<ColumnDef, "visible" | "order">[] = [
  { key: "company",    label: "Company",        category: "role",      defaultVisible: true,  width: 200, sortable: true,  renderer: "text" },
  { key: "role",       label: "Role",           category: "role",      defaultVisible: true,  width: 200, sortable: true,  renderer: "text" },
  { key: "ctc",        label: "Budget",         category: "compensation", defaultVisible: true, width: 130, sortable: false, renderer: "currency" },
  { key: "exp",        label: "Experience",     category: "background", defaultVisible: true, width: 130, sortable: false, renderer: "text" },
  { key: "sectors",    label: "Sectors",        category: "background", defaultVisible: true, width: 220, sortable: false, renderer: "tags" },
  { key: "status",     label: "Status",         category: "metadata",  defaultVisible: true,  width: 150, sortable: true,  renderer: "badge" },
  { key: "internalStatus", label: "Internal",   category: "metadata",  defaultVisible: true,  width: 150, sortable: true,  renderer: "badge" },
  { key: "actions",    label: "Actions",        category: "metadata",  defaultVisible: true,  width: 120, sortable: false, renderer: "text" },
];

export const DEFAULT_FLOAT_COLUMNS: Omit<ColumnDef, "visible" | "order">[] = [
  { key: "name",       label: "Name",           category: "identity",  defaultVisible: true,  width: 250, sortable: true,  renderer: "avatar" },
  { key: "company",    label: "Company",        category: "role",      defaultVisible: true,  width: 180, sortable: true,  renderer: "text" },
  { key: "role",       label: "Designation",    category: "role",      defaultVisible: true,  width: 180, sortable: true,  renderer: "text" },
  { key: "mandate",    label: "Mandate",        category: "metadata",  defaultVisible: true,  width: 220, sortable: false, renderer: "text" },
  { key: "stage",      label: "Stage",          category: "metadata",  defaultVisible: true,  width: 160, sortable: true,  renderer: "badge" },
  { key: "score",      label: "Score",          category: "identity",  defaultVisible: true,  width: 120, sortable: true,  renderer: "badge" },
  { key: "actions",    label: "Actions",        category: "metadata",  defaultVisible: true,  width: 120, sortable: false, renderer: "text" },
];

export const DEFAULT_FRAMEWORK_COLUMNS: Omit<ColumnDef, "visible" | "order">[] = [
  { key: "name",         label: "Framework Name", category: "identity",  defaultVisible: true,  width: 220, sortable: true,  renderer: "text" },
  { key: "industry",     label: "Industry",       category: "background", defaultVisible: true, width: 180, sortable: true,  renderer: "text" },
  { key: "criteria",     label: "Criteria #",     category: "metadata",  defaultVisible: true,  width: 120, sortable: false, renderer: "text" },
  { key: "usedIn",       label: "Used In",        category: "metadata",  defaultVisible: true,  width: 130, sortable: false, renderer: "text" },
  { key: "lastModified", label: "Last Modified",  category: "metadata",  defaultVisible: true,  width: 160, sortable: true,  renderer: "text" },
  { key: "actions",      label: "Actions",        category: "metadata",  defaultVisible: true,  width: 140, sortable: false, renderer: "text" },
];

export const DEFAULT_USER_COLUMNS: Omit<ColumnDef, "visible" | "order">[] = [
  { key: "name",       label: "Name",        category: "identity",  defaultVisible: true,  width: 220, sortable: true,  renderer: "avatar" },
  { key: "email",      label: "Email",       category: "contact",   defaultVisible: true,  width: 260, sortable: true,  renderer: "text" },
  { key: "role",       label: "Role",        category: "metadata",  defaultVisible: true,  width: 140, sortable: true,  renderer: "badge" },
  { key: "lastActive", label: "Last Active", category: "metadata",  defaultVisible: true,  width: 180, sortable: true,  renderer: "text" },
];

export const DEFAULT_RECYCLE_COLUMNS: Omit<ColumnDef, "visible" | "order">[] = [
  { key: "type",      label: "Type",       category: "identity",  defaultVisible: true,  width: 140, sortable: true,  renderer: "badge" },
  { key: "name",      label: "Name",       category: "identity",  defaultVisible: true,  width: 280, sortable: true,  renderer: "text" },
  { key: "deletedBy", label: "Deleted By", category: "metadata",  defaultVisible: true,  width: 180, sortable: false, renderer: "text" },
  { key: "deletedAt", label: "Deleted At", category: "metadata",  defaultVisible: true,  width: 160, sortable: true,  renderer: "text" },
  { key: "expiresIn", label: "Expires In", category: "metadata",  defaultVisible: true,  width: 120, sortable: false, renderer: "badge" },
];

export const COLUMN_CATEGORIES: { key: ColumnCategory; label: string; icon: string }[] = [
  { key: "identity",     label: "Core Identity",           icon: "👤" },
  { key: "contact",      label: "Contact",                 icon: "📞" },
  { key: "role",         label: "Current Role",            icon: "💼" },
  { key: "compensation", label: "Compensation",            icon: "💰" },
  { key: "availability", label: "Availability & Prefs",   icon: "📍" },
  { key: "background",   label: "Background",              icon: "🎓" },
  { key: "documents",    label: "Documents",               icon: "📄" },
  { key: "metadata",     label: "Metadata",                icon: "🗂" },
];

// ─── Hook ─────────────────────────────────────────────────

export function useColumnPrefs(prefKey: string, defaultColumns: Omit<ColumnDef, "visible" | "order">[], userRole?: string) {
  const buildDefaultColumns = useCallback(() => {
    return defaultColumns.map((c, i) => ({
      ...c,
      visible: c.defaultVisible,
      order: i + 1,
    }));
  }, [defaultColumns]);

  const mergeWithDefaults = useCallback((saved: Record<string, any>) => {
    const defaults = buildDefaultColumns();
    if (!saved?.columns) return defaults;
    const savedMap = new Map<string, any>(saved.columns.map((c: any) => [c.key, c]));
    return defaults.map((d) => {
      const s = savedMap.get(d.key);
      if (!s) return d;
      return { ...d, visible: s.visible ?? d.visible, width: s.width ?? d.width, order: s.order ?? d.order };
    });
  }, [buildDefaultColumns]);

  const [columns, setColumns] = useState<ColumnDef[]>(buildDefaultColumns());
  const [isLoading, setIsLoading] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from server on mount
  useEffect(() => {
    setIsLoading(true);
    getUserPreferenceAction(prefKey)
      .then((saved) => {
        if (saved) setColumns(mergeWithDefaults(saved));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [prefKey, mergeWithDefaults]);

  /** Debounced server save — 1200ms after last change */
  const scheduleSave = useCallback((cols: ColumnDef[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveUserPreferenceAction(prefKey, { columns: cols }).catch(console.error);
    }, 1200);
  }, [prefKey]);

  const toggleColumn = useCallback((key: string) => {
    setColumns((prev) => {
      const next = prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c));
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const setColumnWidth = useCallback((key: string, width: number) => {
    setColumns((prev) => {
      const next = prev.map((c) => (c.key === key ? { ...c, width } : c));
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const reorderColumns = useCallback((from: number, to: number) => {
    setColumns((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const [moved] = sorted.splice(from, 1);
      sorted.splice(to, 0, moved);
      const next = sorted.map((c, i) => ({ ...c, order: i + 1 }));
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const resetToDefault = useCallback(() => {
    const defaults = buildDefaultColumns();
    setColumns(defaults);
    saveUserPreferenceAction(prefKey, { columns: defaults }).catch(console.error);
  }, [buildDefaultColumns, prefKey]);

  const publishAsOrgDefault = useCallback(async () => {
    await publishOrgDefaultAction(prefKey, { columns });
  }, [prefKey, columns]);

  const visibleColumns = [...columns]
    .filter((c) => c.visible)
    .sort((a, b) => a.order - b.order);

  return {
    columns,
    visibleColumns,
    isLoading,
    toggleColumn,
    setColumnWidth,
    reorderColumns,
    resetToDefault,
    publishAsOrgDefault,
    isAdmin: userRole === "admin",
  };
}
