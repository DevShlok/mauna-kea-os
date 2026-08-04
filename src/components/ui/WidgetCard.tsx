"use client";
import React from "react";
import { Minus, Plus, GripVertical } from "lucide-react";

interface WidgetCardProps {
  id: string;
  title: string;
  icon: string;
  badge?: string | number;
  collapsed: boolean;
  onCollapse: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  isLocked?: boolean;
}

/**
 * Shared chrome (header + collapsible body) wrapper for every profile widget.
 *
 * Drag handle is designated by `.draggable-handle` class for react-grid-layout.
 */
export function WidgetCard({
  id,
  title,
  icon,
  badge,
  collapsed,
  onCollapse,
  headerActions,
  children,
  isLocked = false,
}: WidgetCardProps) {
  const bodyId = `widget-body-${id}`;

  return (
    <div
      className="neo-card-sm overflow-hidden flex flex-col h-full"
    >
      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b border-gray-100 select-none ${isLocked ? '' : 'draggable-handle cursor-grab active:cursor-grabbing'}`}>
        {!isLocked && (
          <div className="text-[#ccd3df] flex-shrink-0">
            <GripVertical size={16} />
          </div>
        )}

        {/* Icon + title */}
        <span className="text-[15px] flex-shrink-0 pointer-events-none">{icon}</span>
        <h3 className="flex-1 text-[14px] font-bold text-[#111] tracking-tight truncate pointer-events-none">
          {title}
        </h3>

        {/* Optional badge */}
        {badge !== undefined && (
          <span className="text-[11px] font-bold bg-[#DCE5F4] text-[#133255] rounded-full px-2.5 py-0.5 flex-shrink-0 pointer-events-none">
            {badge}
          </span>
        )}

        {/* Custom header actions slot */}
        <div className="cursor-default" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
          {headerActions}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onCollapse(); }}
          onPointerDown={e => e.stopPropagation()}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          title={collapsed ? "Expand" : "Collapse"}
          aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          className="text-[#94a3b8] hover:text-[#133255] transition-colors p-1 rounded-md hover:bg-[#f0f5ff] flex-shrink-0 cursor-pointer z-10 relative"
        >
          {collapsed ? <Plus size={13} /> : <Minus size={13} />}
        </button>
      </div>

      {/* Body — height controlled by grid layout naturally, but overflow hidden for smooth collapse */}
      <div
        id={bodyId}
        role="region"
        aria-label={title}
        className="flex-1 flex flex-col"
        style={{
          display: collapsed ? 'none' : 'flex',
          overflow: "auto",
        }}
      >
        <div className="p-4 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
