"use client";

import { useState, useEffect, useRef } from "react";
import { searchMasterLocationsAction, searchMasterIndustriesAction, searchMasterClientsAction } from "@/actions/searchMasterData";

export function LocationTypeahead({ value, onChange, onKeyDown, onSelect, placeholder = "e.g., Bengaluru", className = "" }: { value: string, onChange: (val: string) => void, onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void, onSelect?: (val: string) => void, placeholder?: string, className?: string }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length > 1) {
        const res = await searchMasterLocationsAction(query);
        setSuggestions(res);
      } else {
        setSuggestions([]);
      }
    };
    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={className || "w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:border-[#133255] outline-none transition-colors"}
      />
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <div 
              key={i} 
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                setQuery(s);
                onChange(s);
                if (onSelect) onSelect(s);
                setIsOpen(false);
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function IndustryTypeahead({ value, onChange, onKeyDown, onSelect, placeholder = "e.g., Technology", className = "" }: { value: string, onChange: (val: string) => void, onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void, onSelect?: (val: string) => void, placeholder?: string, className?: string }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length > 1) {
        const res = await searchMasterIndustriesAction(query);
        setSuggestions(res);
      } else {
        setSuggestions([]);
      }
    };
    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={className || "w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:border-[#133255] outline-none transition-colors"}
      />
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <div 
              key={i} 
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                setQuery(s);
                onChange(s);
                if (onSelect) onSelect(s);
                setIsOpen(false);
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ClientTypeahead({ value, onChange, onClientSelect, placeholder = "e.g., Acme Corp", className = "" }: { value: string, onChange: (val: string) => void, onClientSelect?: (clientData: any) => void, placeholder?: string, className?: string }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length > 1) {
        const res = await searchMasterClientsAction(query);
        setSuggestions(res);
      } else {
        setSuggestions([]);
      }
    };
    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={className || "w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:border-[#133255] outline-none transition-colors"}
      />
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <div 
              key={i} 
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                setQuery(s.companyName);
                onChange(s.companyName);
                if (onClientSelect) onClientSelect(s);
                setIsOpen(false);
              }}
            >
              <div className="font-medium text-[#133255]">{s.companyName}</div>
              <div className="text-xs text-gray-400">{s.industry} {s.hrLeaderName ? `• ${s.hrLeaderName}` : ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
