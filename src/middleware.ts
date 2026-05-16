import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
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

  const pathname = request.nextUrl.pathname;
  
  // Protected routes (require auth)
  const protectedRoutes = ['/shop', '/history', '/statistics'];
  const isProtectedRoute = protectedRoutes.some(r => pathname.startsWith(r));
  const isAuthRoute = ['/login', '/register', '/forgot-password'].includes(pathname);

  // Only call getUser if we are on a protected route or an auth route
  if (isProtectedRoute || isAuthRoute) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (isProtectedRoute && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
