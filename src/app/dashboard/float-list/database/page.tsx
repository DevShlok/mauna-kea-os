import { getFlCandidates } from "@/db/queries";
import DatabaseClient from "./DatabaseClient";

export default async function FloatListDatabasePage() {
  const candidates = await getFlCandidates();
  return <DatabaseClient initialCandidates={candidates} />;
}