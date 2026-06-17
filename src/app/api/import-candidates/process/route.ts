import { db } from "@/db";
import { candidates } from "@/db/schema";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { candidates: mappedCandidates } = await req.json();

    if (!mappedCandidates || !Array.isArray(mappedCandidates) || mappedCandidates.length === 0) {
      return NextResponse.json({ error: "No candidates provided" }, { status: 400 });
    }

    const payload = mappedCandidates.map((c: any) => {
      // Create initials from name
      let initials = "";
      if (c.name) {
        initials = c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
      }

      return {
        id: "C-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase(),
        initials: initials,
        name: c.name || "Unknown Candidate",
        mobile: c.mobile ? String(c.mobile).substring(0, 20) : null,
        email: c.email ? String(c.email).substring(0, 255) : null,
        location: c.location ? String(c.location).substring(0, 100) : null,
        company: c.company ? String(c.company).substring(0, 255) : null,
        designation: c.designation ? String(c.designation).substring(0, 255) : null,
        exp: c.exp !== null && c.exp !== undefined && !isNaN(Number(c.exp)) ? Number(c.exp) : null,
        tenure: c.tenure !== null && c.tenure !== undefined && !isNaN(Number(c.tenure)) ? Number(c.tenure) : null,
        ctc: c.ctc !== null && c.ctc !== undefined && !isNaN(Number(c.ctc)) ? Number(c.ctc) : null,
        fixedCtc: c.fixedCtc !== null && c.fixedCtc !== undefined && !isNaN(Number(c.fixedCtc)) ? Number(c.fixedCtc) : null,
        variableCtc: c.variableCtc !== null && c.variableCtc !== undefined && !isNaN(Number(c.variableCtc)) ? Number(c.variableCtc) : null,
        expected: c.expected !== null && c.expected !== undefined && !isNaN(Number(c.expected)) ? Number(c.expected) : null,
        notice: c.notice !== null && c.notice !== undefined && !isNaN(Number(c.notice)) ? Number(c.notice) : null,
        linkedin: c.linkedin ? String(c.linkedin).substring(0, 500) : null,
        notes: c.notes || null,
        status: c.status ? String(c.status).substring(0, 50) : "Active",
        qual: c.qual ? String(c.qual).split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        dreamRoles: c.dreamRoles ? String(c.dreamRoles).split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        dreamCos: c.dreamCos ? String(c.dreamCos).split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        expTags: c.expTags ? String(c.expTags).split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        score: null,
        assessDate: null,
        linkedinPdf: c.linkedinPdfDriveLink ? String(c.linkedinPdfDriveLink).substring(0, 500) : null,
        targetCompany: c.targetCompany ? String(c.targetCompany).substring(0, 255) : null,
        currency: "INR",
        cvFileName: c.cvDriveLink ? String(c.cvDriveLink).substring(0, 255) : null,
        hasCv: c.cvDriveLink ? true : false,
        cvText: null,
        profilePic: null,
      };
    });

    await db.insert(candidates).values(payload);

    return NextResponse.json({ success: true, count: payload.length });
  } catch (error) {
    console.error("Import Process Error:", error);
    return NextResponse.json({ error: "Failed to process import" }, { status: 500 });
  }
}
