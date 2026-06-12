import { NextResponse } from "next/server";
import { db } from "@/db";
import { candidates } from "@/db/schema";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const cands = await db.select().from(candidates);
    
    if (!cands || cands.length === 0) {
      return new NextResponse("No candidates to export", { status: 404 });
    }
    
    const headers = ["ID", "Name", "Company", "Role", "Location", "Exp (yrs)", "CTC", "Expected", "Notice (days)", "Status", "Qualifications", "LinkedIn", "Target Company"];
    const rows = cands.map(c => [
      c.id || "",
      c.name || "",
      c.company || "",
      c.designation || "",
      c.location || "",
      c.exp || "",
      c.ctc ? `${c.currency || 'INR'} ${c.ctc}L` : "",
      c.expected ? `${c.currency || 'INR'} ${c.expected}L` : "",
      c.notice || "",
      c.status || "",
      ((c.qual as string[]) || []).join("; "),
      c.linkedin || "",
      c.targetCompany || ""
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 18 }, // ID
      { wch: 25 }, // Name
      { wch: 25 }, // Company
      { wch: 30 }, // Role
      { wch: 15 }, // Location
      { wch: 10 }, // Exp
      { wch: 12 }, // CTC
      { wch: 12 }, // Expected
      { wch: 12 }, // Notice
      { wch: 15 }, // Status
      { wch: 30 }, // Quals
      { wch: 45 }, // LinkedIn
      { wch: 25 }  // Target
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");
    
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="float_list_candidates_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });
  } catch (error) {
    console.error("Export Excel Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
