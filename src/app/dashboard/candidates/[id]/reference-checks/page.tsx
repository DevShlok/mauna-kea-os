import { requireRole } from "@/lib/auth";
import { getCandidateById } from "@/db/queries";
import { db } from "@/db";
import { referenceChecks, candidateVerifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ReferenceCheckPanel } from "@/features/candidates/components/ReferenceCheckPanel";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function CandidateReferenceChecksPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { platformUser: pUser } = await requireRole(["admin", "consultant"]);
  const { id } = await params;

  const candidate = await getCandidateById(id);
  if (!candidate) {
    notFound();
  }

  const [checks, [verification]] = await Promise.all([
    db.select().from(referenceChecks).where(eq(referenceChecks.candId, id)).orderBy(desc(referenceChecks.createdAt)),
    db.select().from(candidateVerifications).where(eq(candidateVerifications.candId, id)).limit(1)
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link 
          href={`/dashboard/candidates/${id}`}
          className="neo-btn p-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="text-xs text-slate-500 font-medium">Candidate Management / Reference Checks</div>
          <h1 className="text-2xl font-serif font-bold text-[#133255]">
            Reference Checks — {candidate.name}
          </h1>
        </div>
      </div>

      <ReferenceCheckPanel
        candId={id}
        candidateName={candidate.name}
        checks={checks}
        verificationStatus={verification || null}
        currentUserName={pUser?.name || "Consultant"}
      />
    </div>
  );
}
