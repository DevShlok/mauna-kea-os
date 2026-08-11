import * as XLSX from "xlsx";

/**
 * Utility to export an array of objects to an Excel (.xlsx) file in browser
 */
export function exportToExcel(
  data: Record<string, any>[],
  filename: string = "export.xlsx",
  sheetName: string = "Data"
) {
  if (!data || data.length === 0) {
    console.warn("No data provided for Excel export.");
    return;
  }

  // Create worksheet from json
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Buffer and download
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
