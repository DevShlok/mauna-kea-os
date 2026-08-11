import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LegalFinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin", "consultant", "finance"]);

  return <>{children}</>;
}
