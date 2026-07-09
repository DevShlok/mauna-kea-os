'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
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
    <div className="min-h-screen flex font-sans">
      {/* Left side - Background Image */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-[#06152a] flex-col justify-end p-12">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/login-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06152a]/80 via-transparent to-transparent z-0"></div>
        <div className="relative z-10">
          <h2 className="font-serif text-[28px] tracking-[0.15em] font-bold text-white mb-1">MAUNA KEA</h2>
          <p className="text-[11px] tracking-[0.2em] text-white/60 uppercase font-semibold">Executive Search & Advisory</p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white relative p-6">
        <div className="w-full max-w-[400px] flex flex-col items-center">
          
          <img src="/mk_header.jpeg" alt="Mauna Kea" className="mb-10 w-64 object-contain" />

          <div className="w-full bg-white rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-8 pt-8 pb-6 flex flex-col items-center">
              
              <button 
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-[13px] font-semibold text-gray-700">Continue with Google</span>
              </button>
              
              <div className="w-full flex items-center my-6">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="px-3 text-[11px] font-medium text-gray-400 uppercase tracking-wide">or</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <form className="w-full flex flex-col gap-4" onSubmit={handleSignIn}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold tracking-wide uppercase text-gray-600">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all placeholder-gray-400"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold tracking-wide uppercase text-gray-600">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all placeholder-gray-400"
                  />
                </div>

                {error && <p className="text-red-500 text-[13px]">{error}</p>}

                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-sm text-[13px] font-bold text-white bg-[#30333a] hover:bg-[#1a1c20] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 mt-2 transition-colors tracking-wide"
                >
                  Continue &rsaquo;
                </button>
              </form>
            </div>
            
            <div className="w-full bg-[#f9fafb] border-t border-gray-100 px-8 py-5 flex flex-col items-center justify-center gap-3">
              <p className="text-[12px] text-gray-500">
                Don't have an account? <Link href="/sign-up" className="text-gray-900 font-bold hover:underline">Sign up</Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
