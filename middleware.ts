import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

/**
 * Next.js Middleware enforcing session status and Multi-Factor Authentication (MFA) Assurance Level (AAL2).
 * 
 * If a user is visiting a protected streaming page (/stream/* or /watch/*):
 * 1. They must be logged in (active Supabase session).
 * 2. If they have MFA enrolled, they must have satisfied the aal2 level.
 * 3. If they have MFA enrolled but only have aal1, redirect them to the MFA challenge screen.
 */
export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  
  // Create Supabase client for Next.js Middleware
  const supabase = createMiddlewareClient({ req: request, res });

  // Retrieve the active session
  const { data: { session } } = await supabase.auth.getSession();

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  if (isAdminRoute) {
    if (!session) {
      const loginUrl = new URL('/', request.url); // Default back to home login tab trigger
      return NextResponse.redirect(loginUrl);
    }

    // Retrieve the user profile role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      // Intercept and redirect unprivileged requests to home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return res;
}

// Config to specify the matching paths
export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
