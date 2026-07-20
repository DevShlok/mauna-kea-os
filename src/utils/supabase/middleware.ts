import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') || 
    request.nextUrl.pathname.startsWith('/client') || 
    request.nextUrl.pathname.startsWith('/candidate');

  if (user && isProtectedRoute) {
    // Whitelist check: Verify the user's email exists in platform_users
    const { data: platformUser, error } = await supabase
      .from('platform_users')
      .select('id, name')
      .eq('email', user.email)
      .limit(1)
      .single();

    if (error || !platformUser) {
      // User not in whitelist. Block access.
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
  }

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
