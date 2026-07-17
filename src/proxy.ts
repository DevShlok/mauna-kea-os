import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Only redirect the root landing page (maunakea.co.in) to under-development
  if (path === "/") {
    return NextResponse.redirect(new URL("/under-development", request.url));
  }

  // Allow all other traffic (the internal OS) to proceed normally
  return await updateSession(request);
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
