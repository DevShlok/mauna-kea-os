import { redirect } from "next/navigation";

export default async function ClientMandatesPage({ params }: { params: Promise<{ clientSlug: string }> }) {
  const resolvedParams = await params;
  redirect(`/${resolvedParams.clientSlug}`);
}
