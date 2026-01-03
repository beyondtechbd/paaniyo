// middleware.ts
// Next.js Middleware - Security, Rate Limiting, and Auth

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Security headers (Helmet.js equivalent)
const securityHeaders = {
  // Strict Transport Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.sslcommerz.com https://sandbox.sslcommerz.com https://*.upstash.io",
    "frame-src 'self' https://challenges.cloudflare.com https://sandbox.sslcommerz.com https://securepay.sslcommerz.com",
    "frame-ancestors 'none'",
    "form-action 'self' https://sandbox.sslcommerz.com https://securepay.sslcommerz.com",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; '),

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // XSS Protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=(self)',
    'interest-cohort=()',
  ].join(', '),

  // DNS Prefetch Control
  'X-DNS-Prefetch-Control': 'on',

  // Download Options (IE specific)
  'X-Download-Options': 'noopen',

  // Permitted Cross-Domain Policies
  'X-Permitted-Cross-Domain-Policies': 'none',
};

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/checkout',
  '/orders',
  '/profile',
  '/settings',
];

// Routes that require specific roles
const roleRoutes: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/vendor': ['VENDOR', 'ADMIN'],
};

// Rate limited API routes (handled separately in API routes for precision)
const rateLimitedRoutes = [
  '/api/auth',
  '/api/pay',
  '/api/cart',
  '/api/orders',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response with security headers
  const response = NextResponse.next();

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Skip auth for public routes
  const isPublicRoute =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp)$/);

  if (isPublicRoute) {
    return response;
  }

  // Check authentication for protected routes
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check role-based routes
  const roleRoute = Object.entries(roleRoutes).find(([route]) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute || roleRoute) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      // Redirect to login with callback
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role permissions
    if (roleRoute) {
      const [, allowedRoles] = roleRoute;
      const userRole = token.role as string;

      if (!allowedRoles.includes(userRole)) {
        // Redirect to unauthorized page
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
  }

  // API rate limiting indicators (actual limiting in API routes)
  if (rateLimitedRoutes.some((route) => pathname.startsWith(route))) {
    response.headers.set('X-Rate-Limit-Policy', 'enabled');
  }

  // Add request ID for tracking
  const requestId = crypto.randomUUID();
  response.headers.set('X-Request-Id', requestId);

  // Locale handling
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'bn';
  response.headers.set('X-Locale', locale);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
