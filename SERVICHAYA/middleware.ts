import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes and their required roles
const protectedRoutes: Record<string, string[]> = {
  '/customer': ['CUSTOMER'],
  '/provider': ['SERVICE_PROVIDER', 'CUSTOMER'], // Allow CUSTOMER to access provider onboarding
  '/admin': ['ADMIN', 'SUPER_ADMIN', 'CITY_ADMIN', 'ZONE_ADMIN'],
  '/staff': ['STAFF', 'SUPPORT_AGENT'],
}

// Routes that require authentication but allow any role (for onboarding, etc.)
const anyAuthRoutes = ['/provider/onboarding']

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/services', '/providers']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Check if route allows any authenticated user (like onboarding)
  const isAnyAuthRoute = anyAuthRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  if (isAnyAuthRoute) {
    // For onboarding, allow any authenticated user - check will be done client-side
    // Just let it through, the component will handle auth check
    return NextResponse.next()
  }
  
  // Check if route is protected
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      // Get token from cookie or header
      const token = request.cookies.get('auth_token')?.value || 
                    request.headers.get('authorization')?.replace('Bearer ', '')
      
      if (!token) {
        // Redirect to login if no token
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
      
      // Token validation will be done in the component level
      // Middleware just checks for token presence
      return NextResponse.next()
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
