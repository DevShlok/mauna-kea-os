"use client";
import React from "react";
import Link from "next/link";
import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  actionHref, 
  onAction,
  icon = <FolderOpen size={48} strokeWidth={1.5} className="text-[#a9b7da]" /> 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-[#e4e8f0] rounded-[16px] shadow-sm my-6">
      <div className="bg-[#f4f7fd] p-5 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-[18px] font-bold text-[#133255] mb-2">{title}</h3>
      <p className="text-[14px] text-[#6b7a99] max-w-md mx-auto mb-6">
        {description}
      </p>
      
      {actionHref && actionLabel && (
        <Link 
          href={actionHref}
          className="px-6 py-2.5 bg-[#D8B15B] text-[#133255] rounded-lg text-sm font-bold shadow-sm hover:bg-[#e8c97a] transition-colors"
        >
          {actionLabel}
        </Link>
      )}
      
      {onAction && actionLabel && !actionHref && (
        <button 
          onClick={onAction}
          className="px-6 py-2.5 bg-[#D8B15B] text-[#133255] rounded-lg text-sm font-bold shadow-sm hover:bg-[#e8c97a] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
