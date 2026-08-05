"use client";
import React, { useState } from "react";
import { Pagination } from "@/components/DataTable/Pagination";
import { ResizableHeader } from "@/components/DataTable/ResizableHeader";
import { ColumnDef } from "@/hooks/useColumnPrefs";

interface AdvancedTableProps<T> {
  data: T[];
  total: number;
  columns: ColumnDef[];
  
  // Table State
  page: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  setPage: (page: number) => void;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;

  // Column Prefs
  visibleColumns: ColumnDef[];
  setColumnWidth: (key: string, width: number) => void;
  reorderColumns: (from: number, to: number) => void;
  isLoadingCols?: boolean;

  // Selection
  selectedIds?: Set<string>;
  onToggleRow?: (id: string) => void;
  onToggleAll?: () => void;

  // Renderers
  renderCell: (row: T, col: ColumnDef) => React.ReactNode;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  
  // Custom row ID accessor (defaults to row.id)
  getRowId?: (row: T) => string;
}

export function AdvancedTable<T>({
  data,
  total,
  columns,
  page,
  pageSize,
  setPageSize,
  setPage,
  sortKey,
  sortDir,
  onSort,
  visibleColumns,
  setColumnWidth,
  reorderColumns,
  isLoadingCols,
  selectedIds = new Set(),
  onToggleRow,
  onToggleAll,
  renderCell,
  onRowClick,
  emptyState,
  getRowId = (row: any) => row.id,
}: AdvancedTableProps<T>) {
  
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [dragTargetPosition, setDragTargetPosition] = useState<"left" | "right" | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);

  const handleColumnDrop = (sourceKey: string, targetKey: string) => {
    const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
    const fromIdx = sortedColumns.findIndex((c) => c.key === sourceKey);
    let toIdx = sortedColumns.findIndex((c) => c.key === targetKey);
    
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    reorderColumns(fromIdx, toIdx);
  };

  return (
    <div className="bg-white border border-[#e4e8f0] rounded-[16px] overflow-hidden shadow-sm relative z-0 flex flex-col min-h-0 h-full">
      <div className="overflow-x-auto custom-scrollbar flex-1 pb-2">
        {isLoadingCols ? (
          <div className="w-full bg-white animate-pulse">
            <div className="flex bg-[#fafbfd] border-b-2 border-[#e4e8f0] px-4 py-3">
              <div className="w-[52px]" />
              <div className="flex-1 flex gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-[#eef1f7] rounded flex-1" />
                ))}
              </div>
            </div>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex border-b border-[#eef1f7] px-4 py-4 items-center">
                <div className="w-[52px]">
                  <div className="w-4 h-4 bg-[#eef1f7] rounded-[4px]" />
                </div>
                <div className="flex-1 flex gap-4">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="h-3.5 bg-[#eef1f7] rounded w-full opacity-60" style={{ width: `${60 + (i * 7 + j * 13) % 40}%` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-center border-collapse" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="bg-[#fafbfd]">
                {/* Fixed Checkbox Column */}
                {onToggleAll && (
                  <th className="w-[52px] min-w-[52px] max-w-[52px] px-4 py-3 border-b-2 border-r border-[#e4e8f0]">
                    <input
                      type="checkbox"
                      checked={data.length > 0 && selectedIds.size === data.length}
                      onChange={onToggleAll}
                      className="w-[18px] h-[18px] cursor-pointer rounded-[5px] border border-[#cfd6e4] bg-white appearance-none checked:bg-[#133255] checked:border-[#133255] checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20viewBox=%220%200%2014%2014%22%20fill=%22none%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath%20d=%22M3.5%207.5L6%2010.5L10.5%204%22%20stroke=%22white%22%20stroke-width=%222.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3C/svg%3E')] bg-center bg-no-repeat transition-all hover:border-[#133255] relative flex items-center justify-center m-auto"
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {/* Dynamic Columns */}
                {visibleColumns.map((col) => (
                  <ResizableHeader
                    key={col.key}
                    col={col}
                    onWidthChange={setColumnWidth}
                    sortKey={sortKey || ""}
                    sortDir={sortDir}
                    onSort={onSort}
                    dragOverKey={dragOverKey}
                    dragTargetPosition={dragTargetPosition}
                    setDragOverKey={setDragOverKey}
                    setDragTargetPosition={setDragTargetPosition}
                    onColumnDrop={handleColumnDrop}
                  >
                    {col.label}
                  </ResizableHeader>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + (onToggleAll ? 1 : 0)} className="p-0">
                    {emptyState || (
                      <div className="py-16 text-center text-[#6b7a99]">No records found.</div>
                    )}
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const id = getRowId(row);
                  return (
                    <tr
                      key={id}
                      onClick={() => onRowClick?.(row)}
                      className={`group/row border-b border-[#eef1f7] ${onRowClick ? 'cursor-pointer' : ''} relative candidate-row ${
                        selectedIds.has(id) ? "bg-[#f0f5ff] shadow-[inset_3px_0_0_#D8B15B]" : "hover:bg-[#eef3fb] hover:shadow-[inset_3px_0_0_#133255] hover:-translate-y-[1px] hover:shadow-sm z-0 hover:z-10"
                      } transition-all duration-200`}
                    >
                      {/* Checkbox */}
                      {onToggleRow && (
                        <td className="px-4 py-3 w-[52px] border-r border-[#e4e8f0]/50" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(id)}
                            onChange={() => onToggleRow(id)}
                            className="w-[18px] h-[18px] cursor-pointer rounded-[5px] border border-[#cfd6e4] bg-white appearance-none checked:bg-[#133255] checked:border-[#133255] checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20viewBox=%220%200%2014%2014%22%20fill=%22none%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath%20d=%22M3.5%207.5L6%2010.5L10.5%204%22%20stroke=%22white%22%20stroke-width=%222.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3C/svg%3E')] bg-center bg-no-repeat transition-all hover:border-[#133255] relative flex items-center justify-center m-auto"
                          />
                        </td>
                      )}
                      {/* Dynamic Cells */}
                      {visibleColumns.map((col) => (
                        <td key={col.key} className="px-4 py-3 overflow-hidden border-r border-[#e4e8f0]/50" style={{ width: col.width, maxWidth: col.width }}>
                          {renderCell(row, col)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
      {!isLoadingCols && data.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRows={total}
          startIndex={startIndex}
          endIndex={endIndex}
          pageSize={pageSize}
          setPageSize={setPageSize}
          goToPage={setPage}
          goToNextPage={() => setPage(Math.min(page + 1, totalPages))}
          goToPrevPage={() => setPage(Math.max(page - 1, 1))}
        />
      )}
    </div>
  );
}
