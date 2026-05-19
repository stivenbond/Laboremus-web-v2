import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Protect all routes except public blog and api
  const isPublicPath = path === '/login' || path.startsWith('/blog') || path.startsWith('/api') || path === '/';
  
  // Basic check for session cookie (better-auth uses a session cookie)
  const sessionCookie = request.cookies.get('better-auth.session_token');
  
  if (!isPublicPath && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (path === '/login' && sessionCookie) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
