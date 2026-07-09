import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  if (resolvedParams.code) {
    // Supabase sometimes falls back to the Site URL (/) if the exact callback URL isn't fully whitelisted.
    // We catch it here and safely forward it to the callback route to exchange the code for a session.
    redirect(`/api/auth/callback?code=${resolvedParams.code}`);
  }
  redirect("/dashboard");
}
