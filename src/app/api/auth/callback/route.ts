import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard';
  let authError: any = null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
    
    if (error) {
      console.error('Error exchanging code for session:', error.message);
      // Check if user is already authenticated (e.g. duplicate callback from double click or already consumed PKCE code)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/sign-in?error=AuthCallbackFailed&desc=${encodeURIComponent(authError?.message || 'unknown_error')}`);
}
