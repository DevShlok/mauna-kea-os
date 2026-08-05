import { requireRole } from "@/lib/auth";
import { getRecycleBinPaginated } from "@/db/queries";
import RecycleBinClient from "@/features/admin/components/RecycleBinClient";

export const metadata = {
  title: "Recycle Bin - Admin | Mauna Kea",
};

export default async function RecycleBinPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  await requireRole(["admin"]);

  const p = await props.searchParams;
  const page = Number(p.page) || 1;
  const limit = Number(p.pageSize) || 50;
  const search = typeof p.search === "string" ? p.search : "";
  const sortKey = typeof p.sortKey === "string" ? p.sortKey : "deletedAt";
  const sortDir = p.sortDir === "asc" ? "asc" : "desc";
  const type = typeof p.type === "string" ? p.type : "";

  const data = await getRecycleBinPaginated({ page, limit, search, sortKey, sortDir, type });

  // Normalize to the display shape that RecycleBinClient expects
  let globalId = 0;
  const items = data.rows.map((r) => ({
    id: globalId++,
    originalId: r.id,
    type: r.entityType
      ? r.entityType.charAt(0).toUpperCase() + r.entityType.slice(1) + "s"
      : "Unknown",
    name: r.displayName || r.name || r.id,
    deletedBy: r.deletedBy,
    deletedAt: r.deletedAt,
  }));

  return <RecycleBinClient items={items} metadata={data.metadata} />;
}
