import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for admin routes
  if (request.nextUrl.pathname.startsWith('/Administrator')) {
    
    // For demo purposes, allow all access
    // In production, implement proper authentication
    const adminToken = request.cookies.get('adminToken');
    
    // Allow access if:
    // 1. Has admin token
    // 2. Development environment
    // 3. Coming from main site (referer check)
    const referer = request.headers.get('referer');
    const isFromMainSite = referer && referer.includes(request.nextUrl.origin);
    
    if (!adminToken && !isFromMainSite && process.env.NODE_ENV === 'production') {
      // In production, redirect to home if not authenticated
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/Administrator/:path*',
  ],
};
