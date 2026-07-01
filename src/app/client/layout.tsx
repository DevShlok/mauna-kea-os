import { requireRole } from "@/lib/auth";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce client-only access at the layout level
  await requireRole(["client"]);

  // No shared sidebar/topbar — the client portal has its own embedded nav
  return <>{children}</>;
}
