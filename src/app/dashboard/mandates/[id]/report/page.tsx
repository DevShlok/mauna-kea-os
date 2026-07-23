import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { mandates, mandateCandidates, candidateReports } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import ReportViewerClient from "@/features/mandates/components/ReportViewerClient";

export default async function ReportPage({ params, searchParams  }: { params: { id: string }, searchParams: { format?: string, cands?: string } }) {
  await requireRole(["admin", "consultant"]);;
  const format = searchParams.format || "1";
  const candIds = searchParams.cands ? searchParams.cands.split(",").map(Number) : [];

  if (candIds.length === 0) {
    return <div className="p-10 text-center">No candidates selected.</div>;
  }

  // Fetch Mandate
  const mList = await db.select().from(mandates).where(eq(mandates.id, Number(params.id)));
  if (mList.length === 0) return <div className="p-10">Mandate not found</div>;
  const mandate = mList[0];

  // Fetch Candidates
  const cands = await db.select().from(mandateCandidates).where(inArray(mandateCandidates.id, candIds));

  // Fetch Reports for these candidates
  const externalIds = cands.map(c => c.candId);
  const reports = externalIds.length > 0 
    ? await db.select().from(candidateReports).where(and(inArray(candidateReports.candidateId, externalIds), eq(candidateReports.status, "Completed")))
    : [];

  // Combine data
  const candidatesData = cands.map(c => {
    const report = reports.find(r => r.candidateId === c.candId);
    return {
      ...c,
      reportData: report?.reportData || null,
    };
  });

  return (
    <ReportViewerClient 
      mandate={mandate} 
      candidates={candidatesData} 
      format={format} 
    />
  );
}
