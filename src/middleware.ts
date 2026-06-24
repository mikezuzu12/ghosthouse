import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/api/register',
  '/api/login',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow auth routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Always allow public paths
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Get session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // ✅ Keep original case from database — "Driver" or "Customer"
  const userRole = (token?.role as string) || 'Customer';
  const userId = token?.id as string;

  console.log(`🔐 Middleware: ${pathname} | Auth: ${isAuthenticated} | Role: ${userRole}`);

  // ── 1. Redirect unauthenticated users ──
  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 2. Redirect logged in users away from login/register ──
  if (pathname === '/login' || pathname === '/register') {
    if (userRole === 'Driver') {
      return NextResponse.redirect(new URL('/driver/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── 3. Protect driver routes — only drivers allowed ──
  if (pathname.startsWith('/driver')) {
    if (userRole !== 'Driver') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // ── 4. Protect customer routes — only customers allowed ──
  if (pathname.startsWith('/customer')) {
    if (userRole !== 'Customer') {
      return NextResponse.redirect(new URL('/driver/dashboard', request.url));
    }
  }

  // ── 5. Protect admin routes ──
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'Admin') {
      if (userRole === 'Driver') {
        return NextResponse.redirect(new URL('/driver/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (pathname.startsWith('/api/admin')) {
    if (userRole !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }
  }

  // ── 7. Protect driver API routes ──
  if (pathname.startsWith('/api/drivers')) {
    if (userRole !== 'Driver') {
      return NextResponse.json({ error: 'Unauthorized - Driver access required' }, { status: 403 });
    }
  }

  // ── 8. Protect customer API routes ──
  if (pathname.startsWith('/api/orders') || pathname.startsWith('/api/messages') || pathname.startsWith('/api/notifications')) {
    if (userRole !== 'Customer' && userRole !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }
  // ── 6. Add user info to headers ──
  const requestHeaders = new Headers(request.headers);
  if (token) {
    requestHeaders.set('x-user-id', userId);
    requestHeaders.set('x-user-role', userRole);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};