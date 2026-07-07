"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, ArrowLeft, Share2, MoreVertical, Filter, X } from "lucide-react";
import { getClientNotificationsAction, markClientNotificationsAsReadAction } from "@/actions";

import { useClientPortal } from "../context/ClientPortalContext";

const FILTER_STAGES = [
  { key: "all", label: "All Candidates" },
  { key: "identified", label: "Identified" },
  { key: "screening", label: "Screening" },
  { key: "interviewed", label: "Interviewed" },
  { key: "offered", label: "Offered" },
  { key: "hired", label: "Hired" },
];

export function ClientTopbar() {
  const router = useRouter();
  const { topbarConfig } = useClientPortal();
  const [filterOpen, setFilterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setMounted(true);
    getClientNotificationsAction().then(setNotifications);
  }, []);

  const handleNotificationsClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && notifications.some(n => !n.isRead)) {
      await markClientNotificationsAsReadAction();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const {
    title,
    subtitle,
    showSearch,
    searchQuery,
    onSearchChange,
    showFilter,
    filterValue,
    onFilterChange,
    showBack,
    backUrl,
    onBackClick,
    showShare,
    onShareClick,
    showMore,
    onMoreClick,
    rightContent,
  } = topbarConfig;

  // Render a placeholder before mount to avoid hydration mismatches if needed, 
  // though the shell is largely static in structure.
  if (!mounted) {
    return (
      <header className="shrink-0 h-[77px] bg-[#0b1f3a] border-b border-[#133255] text-white flex items-center">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-8" />
      </header>
    );
  }

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <header className="shrink-0 h-[77px] bg-[#0b1f3a] border-b border-[#133255] text-white flex items-center">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-8">
        
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              className="bg-white/10 rounded-lg w-9 h-9 flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </button>
          )}

          <div>
            {subtitle && (
              <span className="text-[11px] font-semibold text-white/50 tracking-wider uppercase block">
                {subtitle}
              </span>
            )}
            {title && (
              <h1 className={`font-bold text-white leading-tight ${subtitle ? 'text-[18px]' : 'text-[20px] font-serif'}`}>
                {title}
              </h1>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {showSearch && onSearchChange && (
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search positions..."
                value={searchQuery || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-[280px] h-[38px] bg-[#162d4f] border border-[#1e3c63] rounded-xl pl-9 pr-4 text-[13px] text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:text-[#0b1f3a] transition-all"
              />
            </div>
          )}

          {showFilter && onFilterChange && (
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`h-[38px] px-3.5 rounded-xl border flex items-center gap-2 transition-all ${
                  filterValue && filterValue !== "all"
                    ? "bg-indigo-500 border-indigo-400 text-white"
                    : "bg-[#162d4f] border-[#1e3c63] text-gray-300 hover:border-gray-500"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-[13px] font-medium hidden sm:inline">Filter</span>
              </button>
              
              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                  <div className="absolute right-0 top-11 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-48 z-50">
                    {FILTER_STAGES.map((stage) => (
                      <button
                        key={stage.key}
                        onClick={() => {
                          onFilterChange(stage.key);
                          setFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${
                          filterValue === stage.key
                            ? "bg-indigo-50 text-indigo-700 font-semibold"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {showShare && (
            <button onClick={onShareClick} className="text-white/70 hover:text-white transition-colors" title="Share">
              <Share2 className="w-5 h-5" />
            </button>
          )}

          {showMore && (
            <button onClick={onMoreClick} className="text-white/70 hover:text-white transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          )}

          {/* Default bell icon if no custom right content is provided */}
          {!rightContent && !showShare && !showMore && (
            <div className="relative">
              <button 
                onClick={handleNotificationsClick}
                className="relative text-white/50 hover:text-white/80 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0b1f3a]" />
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-11 bg-white rounded-xl shadow-xl border border-gray-100 w-80 z-50 overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-900 text-[14px]">Notifications</h3>
                      <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-500">No new notifications</div>
                      ) : (
                        notifications.map(notif => {
                          const destUrl = notif.link || (notif.mandateId ? `/client/mandates/${notif.mandateId}` : "#");
                          return (
                            <div 
                              key={notif.id}
                              className={`border-b border-gray-50 last:border-b-0 ${notif.isRead ? 'bg-white' : 'bg-indigo-50/30'}`}
                            >
                              <a 
                                href={destUrl}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setShowNotifications(false);
                                  router.push(destUrl);
                                }}
                                className="block px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                              >
                                <p className="text-[13px] text-gray-800 leading-relaxed">{notif.message}</p>
                                <span className="text-[11px] text-gray-400 mt-1 block">{new Date(notif.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </a>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {rightContent}
        </div>
      </div>
    </header>
  );
}
