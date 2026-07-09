'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      }
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex font-sans relative overflow-hidden">
      {/* ── Animated Background ── */}
      <div className="absolute inset-0 z-0">
        {/* Deep gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#040d1a] via-[#0a1f3d] to-[#071428]" />
        
        {/* MK Circular Logo background */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "url('/login-bg-removebg.png')", backgroundSize: '55%', backgroundPosition: '40% center', backgroundRepeat: 'no-repeat' }}
        />

        {/* Animated aurora glow */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.08] blur-[120px] animate-pulse"
          style={{ background: 'radial-gradient(circle, #4a9eff, transparent 70%)', animationDuration: '8s' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[100px] animate-pulse"
          style={{ background: 'radial-gradient(circle, #2dd4bf, transparent 70%)', animationDuration: '12s' }} />
        
        {/* Subtle particle dots */}
        <div className="absolute top-[15%] left-[10%] w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-[25%] left-[30%] w-0.5 h-0.5 bg-white/15 rounded-full animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[10%] right-[20%] w-1 h-1 bg-white/10 rounded-full animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute top-[40%] right-[35%] w-0.5 h-0.5 bg-white/20 rounded-full animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute bottom-[30%] left-[15%] w-1 h-1 bg-white/10 rounded-full animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-[20%] right-[10%] w-0.5 h-0.5 bg-white/15 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
      </div>

      {/* ── Left Panel: Brand Story ── */}
      <div 
        className={`hidden lg:flex lg:w-[55%] relative z-10 flex-col justify-between p-14 transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
      >
        {/* Top: Logo area */}
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-white/5 border border-white/10">
              <img src="/login-bg.jpg" alt="MK" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-serif text-[22px] tracking-[0.2em] font-bold text-white/95">MAUNA KEA</h1>
              <p className="text-[10px] tracking-[0.25em] text-white/40 uppercase font-medium">Executive Search & Advisory</p>
            </div>
          </div>
        </div>

        {/* Center: Hero statement */}
        <div className="flex-1 flex flex-col justify-center max-w-[480px]">
          <div className="mb-8">
            <div className="w-10 h-[2px] bg-gradient-to-r from-sky-400/60 to-transparent mb-8" />
            <h2 className="text-[42px] leading-[1.15] font-serif font-light text-white/90 mb-6">
              The summit of<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-cyan-200 font-normal">
                leadership talent
              </span>
            </h2>
            <p className="text-[15px] leading-[1.8] text-white/45 max-w-[400px]">
              Powering C-suite and board-level searches for India&apos;s most ambitious organizations. Our AI-driven platform transforms how executive talent is identified, assessed, and engaged.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-10 pt-6 border-t border-white/[0.06]">
            <div>
              <div className="text-[28px] font-light text-white/80 font-serif">500+</div>
              <div className="text-[11px] text-white/35 uppercase tracking-wider mt-1">Placements</div>
            </div>
            <div>
              <div className="text-[28px] font-light text-white/80 font-serif">150+</div>
              <div className="text-[11px] text-white/35 uppercase tracking-wider mt-1">Active Clients</div>
            </div>
            <div>
              <div className="text-[28px] font-light text-white/80 font-serif">98%</div>
              <div className="text-[11px] text-white/35 uppercase tracking-wider mt-1">Retention Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div 
        className={`flex-1 flex flex-col items-center justify-center relative z-10 p-6 lg:p-12 transition-all duration-1000 ease-out delay-200 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
      >
        {/* Glassmorphism card */}
        <div className="w-full max-w-[420px]">
          
          {/* Mobile logo - only shows on small screens */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
              <img src="/login-bg.jpg" alt="MK" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-serif text-[18px] tracking-[0.2em] font-bold text-white/90">MAUNA KEA</h1>
              <p className="text-[9px] tracking-[0.2em] text-white/40 uppercase">Executive Search</p>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/[0.04] rounded-2xl border border-white/[0.08] shadow-[0_8px_60px_rgba(0,0,0,0.4)] overflow-hidden">
            
            {/* Card header */}
            <div className="px-8 pt-10 pb-2">
              <h3 className="text-[22px] font-semibold text-white/90 mb-1.5">Welcome back</h3>
              <p className="text-[13px] text-white/40">Sign in to access your dashboard</p>
            </div>

            {/* Card body */}
            <div className="px-8 pt-6 pb-8">
              {/* Google Sign In */}
              <button 
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl hover:bg-white/[0.1] hover:border-white/[0.18] transition-all duration-300 group cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-[13px] font-medium text-white/70 group-hover:text-white/90 transition-colors">Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="w-full flex items-center my-7">
                <div className="flex-1 h-px bg-white/[0.08]"></div>
                <span className="px-4 text-[10px] font-medium text-white/25 uppercase tracking-[0.15em]">or sign in with email</span>
                <div className="flex-1 h-px bg-white/[0.08]"></div>
              </div>

              {/* Email/Password Form */}
              <form className="w-full flex flex-col gap-5" onSubmit={handleSignIn}>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-white/40">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-[14px] text-white/90 focus:outline-none focus:ring-1 focus:ring-sky-400/40 focus:border-sky-400/30 transition-all placeholder-white/20"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-white/40">Password</label>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-[14px] text-white/90 focus:outline-none focus:ring-1 focus:ring-sky-400/40 focus:border-sky-400/30 transition-all placeholder-white/20"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-red-300/90 text-[13px]">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-[#0a1f3d] mt-1 transition-all duration-300 tracking-wide shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </div>

            {/* Card footer */}
            <div className="w-full border-t border-white/[0.06] px-8 py-5 flex items-center justify-center bg-white/[0.02]">
              <p className="text-[12px] text-white/35">
                Don&apos;t have an account?{' '}
                <Link href="/sign-up" className="text-sky-400/80 font-semibold hover:text-sky-300 transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
