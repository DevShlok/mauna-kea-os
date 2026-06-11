import { getFlCandidates, getMandateById } from "@/db/queries";
import DatabaseClient from "./DatabaseClient";

export default async function FloatListDatabasePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  const candidates = await getFlCandidates();
  
  let assignMandate = null;
  if (resolvedParams.assignToMandate) {
    const mId = Number(resolvedParams.assignToMandate);
    assignMandate = await getMandateById(mId);
  }
  
  return <DatabaseClient initialCandidates={candidates} assignMandate={assignMandate} />;
}