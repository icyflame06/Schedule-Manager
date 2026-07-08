import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import arcjet, { shield, slidingWindow } from '@arcjet/next';

// Initialize Arcjet for Rate Limiting and basic Bot Protection
// Note: Requires ARCJET_KEY in environment variables
const aj = arcjet({
  key: process.env.ARCJET_KEY || "ajkey_placeholder", // Provide fallback to prevent crash if not set yet
  characteristics: ["ip.src"], 
  rules: [
    shield({ mode: "LIVE" }),
    slidingWindow({
      mode: "LIVE",
      interval: "1m",
      max: 100, // max 100 requests per minute
    }),
  ],
});

export async function proxy(request: NextRequest) {
  // 1. Arcjet Rate Limiting
  const decision = await aj.protect(request);
  
  if (decision.isDenied()) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refreshing session
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isDashboardRoute = url.pathname.startsWith('/dashboard');
  const isAdminRoute = url.pathname.startsWith('/admin');

  if (isDashboardRoute && !user) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Simple RBAC for admin routes
  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!profile || profile.role?.trim().toLowerCase() !== 'admin') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
