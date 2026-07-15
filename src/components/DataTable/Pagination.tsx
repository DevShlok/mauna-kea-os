"use client";
import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 50, 100, 200];

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRows: number;
  startIndex: number;
  endIndex: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalRows,
  startIndex,
  endIndex,
  pageSize,
  setPageSize,
  goToPage,
  goToNextPage,
  goToPrevPage,
}: PaginationProps) {
  const [pageInput, setPageInput] = useState(String(currentPage));

  // Sync input when page changes externally
  if (pageInput !== String(currentPage) && document.activeElement?.id !== "page-input") {
    setPageInput(String(currentPage));
  }

  const handlePageInputBlur = useCallback(() => {
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed)) {
      goToPage(parsed);
    } else {
      setPageInput(String(currentPage));
    }
  }, [pageInput, currentPage, goToPage]);

  const handlePageInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handlePageInputBlur();
        (e.target as HTMLInputElement).blur();
      }
    },
    [handlePageInputBlur]
  );

  if (totalRows === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#e4e8f0] bg-white">
      {/* Left: showing info */}
      <div className="text-[13px] text-[#8a93a3] font-medium">
        Showing{" "}
        <span className="text-[#133255] font-bold">{startIndex + 1}</span>–
        <span className="text-[#133255] font-bold">{endIndex}</span> of{" "}
        <span className="text-[#133255] font-bold">{totalRows}</span> results
      </div>

      {/* Center: pagination controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-[7px] border border-[#e4e8f0] text-[#4a5568] hover:bg-[#f4f7fd] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#4a5568]">
          <span>Page</span>
          <input
            id="page-input"
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={handlePageInputBlur}
            onKeyDown={handlePageInputKeyDown}
            className="w-12 text-center border border-[#e4e8f0] rounded-[7px] px-1 py-1 text-[13px] outline-none focus:border-[#133255] text-[#133255] font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span>of {totalPages}</span>
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-[7px] border border-[#e4e8f0] text-[#4a5568] hover:bg-[#f4f7fd] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right: items per page */}
      <div className="flex items-center gap-2 text-[13px] text-[#8a93a3]">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="border border-[#e4e8f0] rounded-[7px] px-2 py-1 text-[13px] text-[#133255] font-bold outline-none focus:border-[#133255] cursor-pointer bg-white hover:bg-[#f4f7fd] transition-colors"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>per page</span>
      </div>
    </div>
  );
}
