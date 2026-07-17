import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Allow under-development page and static assets
  if (
    path.startsWith("/under-development") ||
    path.startsWith("/_next") ||
    path.match(/\.(png|jpg|jpeg|svg|ico)$/i)
  ) {
    return await updateSession(request);
  }

  // Redirect all other traffic to under development
  return NextResponse.redirect(new URL("/under-development", request.url));
}

export const middleware = proxy;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
