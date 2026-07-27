"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { getUserPreferenceAction, saveUserPreferenceAction, publishOrgDefaultAction } from "@/actions";

// ─── Types ────────────────────────────────────────────────

export interface WidgetState {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  collapsed: boolean;
}

const DEFAULT_LAYOUT: WidgetState[] = [
  { id: "hero-identity",  x: 0, y: 0,  w: 12, h: 4, minW: 6, minH: 3, collapsed: false },
  { id: "hero-status",    x: 0, y: 4,  w: 6,  h: 2, minW: 4, minH: 2, collapsed: false },
  { id: "hero-contact",   x: 6, y: 4,  w: 6,  h: 2, minW: 4, minH: 2, collapsed: false },
  { id: "hero-quals",     x: 0, y: 6,  w: 6,  h: 3, minW: 4, minH: 2, collapsed: false },
  { id: "hero-location",  x: 6, y: 6,  w: 6,  h: 3, minW: 4, minH: 2, collapsed: false },
  { id: "compensation",   x: 0, y: 9,  w: 6,  h: 4, minW: 4, minH: 3, collapsed: false },
  { id: "past-companies", x: 6, y: 9,  w: 6,  h: 4, minW: 4, minH: 3, collapsed: false },
  { id: "dream-jobs",     x: 0, y: 13, w: 6,  h: 3, minW: 4, minH: 2, collapsed: false },
  { id: "cv-files",       x: 6, y: 13, w: 6,  h: 3, minW: 4, minH: 2, collapsed: false },
  { id: "assessment",     x: 0, y: 16, w: 6,  h: 4, minW: 4, minH: 3, collapsed: false },
  { id: "references",     x: 6, y: 16, w: 6,  h: 4, minW: 4, minH: 3, collapsed: false },
  { id: "extra-fields",   x: 0, y: 20, w: 6,  h: 3, minW: 4, minH: 2, collapsed: false },
  { id: "submissions",    x: 0, y: 23, w: 12, h: 6, minW: 6, minH: 4, collapsed: false },
  { id: "mandates",       x: 0, y: 29, w: 12, h: 5, minW: 6, minH: 4, collapsed: false },
  { id: "activity-log",   x: 0, y: 34, w: 12, h: 5, minW: 6, minH: 4, collapsed: false },
];

function mergeLayoutWithDefaults(saved: Record<string, any>): WidgetState[] {
  if (!saved?.widgets) return DEFAULT_LAYOUT;
  const savedMap = new Map<string, any>(saved.widgets.map((w: any) => [w.id, w]));
  return DEFAULT_LAYOUT.map((d) => {
    const s = savedMap.get(d.id);
    if (!s) return d;
    return {
      ...d,
      x: s.x ?? d.x,
      y: s.y ?? d.y,
      w: s.w ?? d.w,
      h: s.h ?? d.h,
      collapsed: s.collapsed ?? d.collapsed,
    };
  });
}

// ─── Hook ─────────────────────────────────────────────────

export function useWidgetLayout(userRole?: string) {
  const [widgets, setWidgets] = useState<WidgetState[]>(DEFAULT_LAYOUT);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getUserPreferenceAction("candidateWidgetLayout")
      .then((saved) => {
        if (saved) setWidgets(mergeLayoutWithDefaults(saved));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const scheduleSave = useCallback((ws: WidgetState[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveUserPreferenceAction("candidateWidgetLayout", { widgets: ws }).catch(console.error);
    }, 1200);
  }, []);

  const onLayoutChange = useCallback((newLayout: any[]) => {
    if (isLocked) return;
    setWidgets((prev) => {
      const next = prev.map((w) => {
        const updated = newLayout.find((l) => l.i === w.id);
        if (!updated) return w;
        return {
          ...w,
          x: updated.x,
          y: updated.y,
          w: updated.w,
          h: updated.h,
        };
      });
      scheduleSave(next);
      return next;
    });
  }, [isLocked, scheduleSave]);

  const toggleCollapse = useCallback((id: string) => {
    setWidgets((prev) => {
      const next = prev.map((w) => {
        if (w.id === id) {
          const isCollapsed = !w.collapsed;
          return { ...w, collapsed: isCollapsed, h: isCollapsed ? 1 : (DEFAULT_LAYOUT.find(d => d.id === id)?.h || 4) };
        }
        return w;
      });
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const resetLayout = useCallback(() => {
    setWidgets(DEFAULT_LAYOUT);
    saveUserPreferenceAction("candidateWidgetLayout", { widgets: DEFAULT_LAYOUT }).catch(console.error);
  }, []);

  const publishAsOrgDefault = useCallback(async () => {
    await publishOrgDefaultAction("candidateWidgetLayout", { widgets });
  }, [widgets]);

  return {
    widgets,
    isLoading,
    isLocked,
    setIsLocked,
    onLayoutChange,
    toggleCollapse,
    resetLayout,
    publishAsOrgDefault,
    isAdmin: userRole === "admin",
  };
}
