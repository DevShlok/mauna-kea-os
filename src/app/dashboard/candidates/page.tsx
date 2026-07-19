import { requireRole } from "@/lib/auth";
import { getCandidatesPaginated, getMandates } from "@/db/queries";
import CandidatesClient from "@/features/candidates/components/CandidatesClient";
import { redirect } from "next/navigation";

export default async function CandidatesPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { platformUser: pUser, email } = await requireRole(["admin", "consultant"]);

  if (email) {
    if (pUser?.role === "candidate" && pUser.linkedCandidateId) {
      redirect(`/dashboard/candidates/${pUser.linkedCandidateId}`);
    }
  }

  const resolvedParams = await props.searchParams;

  const page = resolvedParams.page ? Number(resolvedParams.page) : 1;
  const limit = resolvedParams.limit ? Number(resolvedParams.limit) : 10;
  const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : undefined;
  
  const parseArrayParam = (param: string | string[] | undefined) => {
    if (!param) return undefined;
    if (Array.isArray(param)) return param;
    return param.split(',');
  };

  const companies = parseArrayParam(resolvedParams.companies);
  const designations = parseArrayParam(resolvedParams.designations);
  const statuses = parseArrayParam(resolvedParams.statuses);
  
  const minExp = resolvedParams.minExp ? Number(resolvedParams.minExp) : undefined;
  const maxExp = resolvedParams.maxExp ? Number(resolvedParams.maxExp) : undefined;
  const minTenure = resolvedParams.minTenure ? Number(resolvedParams.minTenure) : undefined;
  const maxTenure = resolvedParams.maxTenure ? Number(resolvedParams.maxTenure) : undefined;
  const minCtc = resolvedParams.minCtc ? Number(resolvedParams.minCtc) : undefined;
  const maxCtc = resolvedParams.maxCtc ? Number(resolvedParams.maxCtc) : undefined;
  
  const sortKey = typeof resolvedParams.sortKey === 'string' ? resolvedParams.sortKey : undefined;
  const sortDir = resolvedParams.sortDir === 'asc' || resolvedParams.sortDir === 'desc' ? resolvedParams.sortDir : undefined;

  const [paginatedData, mandates] = await Promise.all([
    getCandidatesPaginated({ page, limit, search, companies, designations, statuses, minExp, maxExp, minTenure, maxTenure, minCtc, maxCtc, sortKey, sortDir }),
    getMandates()
  ]);
  
  return <CandidatesClient 
    candidates={paginatedData.data} 
    total={paginatedData.total}
    metadata={paginatedData.metadata}
    mandates={mandates} 
    initialParams={{ page, limit, search, companies, designations, statuses, minExp, maxExp, minTenure, maxTenure, minCtc, maxCtc, sortKey, sortDir }}
  />;
}
