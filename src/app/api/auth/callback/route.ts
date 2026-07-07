import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  console.log("\n==============================");
  console.log("AUTH CALLBACK START");
  console.log("==============================");

  const url = new URL(request.url);

  console.log("Full URL:", request.url);
  console.log("Search Params:", url.search);

  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const origin = url.origin;

  console.log("Origin:", origin);
  console.log("Code:", code);
  console.log("Next:", next);

  if (!code) {
    console.log("❌ NO CODE RECEIVED");
    console.log("Redirecting to auth-code-error");

    return NextResponse.redirect(
      `${origin}/auth/auth-code-error`
    );
  }

  try {
    const cookieStore = await cookies();

    console.log("Creating Supabase Server Client...");

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
            } catch (err) {
              console.error("Cookie Error:", err);
            }
          },
        },
      }
    );

    console.log("Exchanging code for session...");

    const { data, error } =
      await supabase.auth.exchangeCodeForSession(code);

    console.log("\n===== EXCHANGE RESULT =====");
    console.log("Error:", error);
    console.log("Data:", data);
    console.log("Session Exists:", !!data?.session);

    if (error) {
      console.error("❌ EXCHANGE FAILED");
      console.error(error);

      return NextResponse.redirect(
        `${origin}/auth/auth-code-error`
      );
    }

    if (!data?.session) {
      console.error("❌ SESSION NOT CREATED");

      return NextResponse.redirect(
        `${origin}/auth/auth-code-error`
      );
    }

    console.log("✅ SESSION CREATED");

    const providerToken =
      data.session.provider_token;

    const providerRefreshToken =
      data.session.provider_refresh_token;

    console.log(
      "Provider Token Exists:",
      !!providerToken
    );

    console.log(
      "Provider Refresh Token Exists:",
      !!providerRefreshToken
    );

    const response = NextResponse.redirect(
      `${origin}${next}`
    );

    if (providerToken) {
      response.cookies.set(
        "google_provider_token",
        providerToken,
        {
          path: "/",
          maxAge: data.session.expires_in,
        }
      );

      console.log(
        "✅ Provider token cookie saved"
      );

      // Save credentials in the database integrations table
      const expires_at = Date.now() + (data.session.expires_in || 3600) * 1000;
      const { db } = await import("@/lib/db");
      try {
        await db.setGoogleCredential({
          user_id: data.session.user.id,
          provider: "google",
          access_token: providerToken,
          refresh_token: providerRefreshToken || undefined,
          expires_at,
        });
        console.log("✅ Google integration saved/updated in database");
      } catch (dbErr) {
        console.error("Failed to save google integration to DB:", dbErr);
      }
    }

    if (providerRefreshToken) {
      response.cookies.set(
        "google_provider_refresh_token",
        providerRefreshToken,
        {
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
        }
      );

      console.log(
        "✅ Refresh token cookie saved"
      );
    }

    console.log(
      "✅ Redirecting to:",
      `${origin}${next}`
    );

    return response;
  } catch (err) {
    console.error("🔥 CALLBACK CRASHED");
    console.error(err);

    return NextResponse.redirect(
      `${origin}/auth/auth-code-error`
    );
  }
}