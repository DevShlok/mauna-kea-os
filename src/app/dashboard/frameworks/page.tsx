import { requireRole } from "@/lib/auth";
import { getFrameworksPaginated } from "@/db/queries";
import FrameworksClient from "@/features/frameworks/components/FrameworksClient";

export default async function FrameworksPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  await requireRole(["admin", "consultant"]);

  const p = await props.searchParams;
  const page = Number(p.page) || 1;
  const limit = Number(p.pageSize) || 50;
  const search = typeof p.search === "string" ? p.search : "";
  const sortKey = typeof p.sortKey === "string" ? p.sortKey : "createdAt";
  const sortDir = p.sortDir === "asc" ? "asc" : "desc";

  const data = await getFrameworksPaginated({ page, limit, search, sortKey, sortDir });

  return <FrameworksClient data={data.rows} metadata={data.metadata} />;
}