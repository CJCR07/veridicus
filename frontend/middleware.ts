import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next.js Middleware to handle authentication and route protection.
 * Ensures that investigators are authenticated before accessing forensic dossiers.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
      cookieOptions: {
        name: "sb-v-auth-token",
      }
    }
  );

  const url = new URL(request.url);
  const isAuthPage = url.pathname.startsWith('/login') || url.pathname.startsWith('/signup');
  const isPublicFile = url.pathname.includes('.'); // Simple check for assets

  // 0. Development Bypass - Allow access if DEV_BYPASS_AUTH is set or header is present
  const devBypassHeader = request.headers.get('x-dev-bypass-auth') === 'true';
  const devBypassEnv = process.env.DEV_BYPASS_AUTH === 'true';
  
  if (devBypassEnv || devBypassHeader) {
    if (isAuthPage && !url.pathname.includes('logout')) {
      return NextResponse.redirect(new URL('/cases', request.url));
    }
    return response;
  }

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Redirect unauthenticated users to login
  if (!user && !isAuthPage && !isPublicFile) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Redirect authenticated users away from auth pages to dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/cases', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
