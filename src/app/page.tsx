import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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

  return (
    <div className="relative min-h-screen bg-[#030712] overflow-hidden selection:bg-blue-500/30">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen pointer-events-none" />

      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tighter text-white">
              Mauna Kea <span className="text-blue-500">OS</span>
            </span>
          </div>
          
          <Link 
            href="/sign-in" 
            className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium text-white transition-all duration-300 backdrop-blur-md overflow-hidden"
          >
            <span className="relative z-10">Sign In</span>
            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="relative p-12 md:p-16 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl shadow-2xl overflow-hidden flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
          
          {/* Subtle inner glow for the glass card */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Platform in Development
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4">
            Mauna Kea
          </h1>
          
          <h2 className="text-3xl md:text-5xl font-light text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600 mb-8">
            Coming Soon.
          </h2>

          <p className="max-w-md text-gray-400 text-sm md:text-base leading-relaxed">
            We are building the next generation of executive search software. 
            The intelligent operating system for elite headhunting is almost here.
          </p>

        </div>
      </main>
    </div>
  );
}
