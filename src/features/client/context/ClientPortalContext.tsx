"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type TopbarConfig = {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  showFilter?: boolean;
  filterValue?: string;
  onFilterChange?: (f: string) => void;
  showBack?: boolean;
  backUrl?: string;
  onBackClick?: () => void;
  showShare?: boolean;
  onShareClick?: () => void;
  showMore?: boolean;
  onMoreClick?: () => void;
  rightContent?: ReactNode;
};

interface ClientPortalContextType {
  topbarConfig: TopbarConfig;
  setTopbarConfig: (config: TopbarConfig) => void;
}

const ClientPortalContext = createContext<ClientPortalContextType | undefined>(undefined);

export function ClientPortalProvider({ children }: { children: ReactNode }) {
  const [topbarConfig, setTopbarConfig] = useState<TopbarConfig>({});

  return (
    <ClientPortalContext.Provider value={{ topbarConfig, setTopbarConfig }}>
      {children}
    </ClientPortalContext.Provider>
  );
}

export function useClientPortal() {
  const context = useContext(ClientPortalContext);
  if (context === undefined) {
    throw new Error("useClientPortal must be used within a ClientPortalProvider");
  }
  return context;
}
