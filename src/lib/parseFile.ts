/**
 * Shared file parser for import modals.
 * Handles .csv (hand-written parser — handles quoted commas, escaped quotes, CRLF)
 * and .xlsx/.xls via ExcelJS.
 * Returns rows as string[][], where rows[0] is the header row.
 */

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let val = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        val += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(val);
      val = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(val);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      val = "";
    } else {
      val += char;
    }
  }
  if (val || row.length > 0) {
    row.push(val);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
  }
  return rows;
}

function normalizeExcelCellValue(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") {
    if ("hyperlink" in val) return String(val.hyperlink || "");
    if ("text" in val) return String(val.text || "");
    if ("result" in val) return String(val.result || "");
    if ("richText" in val && Array.isArray(val.richText)) {
      return val.richText.map((rt: any) => rt.text || "").join("");
    }
    if (val instanceof Date) return val.toISOString().split("T")[0];
  }
  return val?.toString() || "";
}

/**
 * Parse a File (CSV or Excel) into a 2D string array.
 * rows[0] = headers, rows[1..] = data rows.
 * Throws with a user-friendly message if file cannot be parsed.
 */
export async function parseFileToRows(file: File): Promise<string[][]> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isCsv =
    ext === "csv" ||
    file.type === "text/csv" ||
    file.name.toLowerCase().endsWith(".csv");

  let rows: string[][];

  if (isCsv) {
    const text = await file.text();
    rows = parseCsvText(text);
  } else {
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error("No worksheet found in Excel file.");

      rows = [];
      worksheet.eachRow((row) => {
        const rowData: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell, colIdx) => {
          rowData[colIdx - 1] = normalizeExcelCellValue(cell.value);
        });
        rows.push(rowData);
      });
    } catch (excelErr) {
      console.warn("Excel parsing failed, trying CSV fallback:", excelErr);
      const text = await file.text();
      rows = parseCsvText(text);
    }
  }

  if (rows.length < 2) {
    throw new Error(
      "File appears to be empty or has no data rows. Make sure row 1 is the header."
    );
  }

  return rows;
}
