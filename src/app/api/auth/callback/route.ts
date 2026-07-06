import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.session) {
      // Store provider tokens (Google OAuth access/refresh tokens) if available
      const providerToken = data.session.provider_token;
      const providerRefreshToken = data.session.provider_refresh_token;

      // In production, these should be saved to your DB (e.g. google_credentials table)
      // to access their calendar when they are offline/away.
      const response = NextResponse.redirect(`${origin}${next}`);
      
      if (providerToken) {
        response.cookies.set("google_provider_token", providerToken, {
          path: "/",
          maxAge: data.session.expires_in,
        });
      }
      if (providerRefreshToken) {
        response.cookies.set("google_provider_refresh_token", providerRefreshToken, {
          path: "/",
          maxAge: 30 * 24 * 60 * 60, // 30 days
        });
      }
      
      return response;
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
