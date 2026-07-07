"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Profile } from "@/types";
import { db } from "@/lib/db";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signInWithDemo: () => Promise<void>;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string, nextPath?: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        console.log("========== LOAD USER ==========");

        if (!isSupabaseConfigured()) {
          console.log("Supabase NOT configured");

          const profile = await db.getProfile();
          setUser(profile);
          setLoading(false);
          return;
        }

        console.log(
          "Supabase URL:",
          process.env.NEXT_PUBLIC_SUPABASE_URL
        );

        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log("Session:", session);

        if (session?.user) {
          console.log("User found:", session.user.email);

          const profile = await db.getProfile();
          setUser(profile);
        } else {
          console.log("No session found");
          setUser(null);
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("AUTH EVENT:", event);
            console.log("AUTH SESSION:", session);

            if (session?.user) {
              console.log(
                "Logged in user:",
                session.user.email
              );

              const profile = await db.getProfile();
              setUser(profile);
            } else {
              console.log("User logged out");
              setUser(null);
            }

            setLoading(false);
          }
        );

        setLoading(false);

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("AUTH LOAD ERROR:", err);
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const signInWithDemo = async () => {
    console.log("DEMO LOGIN");

    setLoading(true);

    const profile = await db.getProfile();
    setUser(profile);

    setLoading(false);
  };

  const signInWithGoogle = async (nextPath?: string) => {
    try {
      setLoading(true);

      console.log("");
      console.log("====================================");
      console.log("GOOGLE LOGIN CLICKED");
      console.log("====================================");

      console.log("Origin:", window.location.origin);

      const redirectUrl = `${window.location.origin}/api/auth/callback${
        nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""
      }`;

      console.log("Redirect URL:", redirectUrl);

      console.log(
        "NEXT_PUBLIC_SUPABASE_URL:",
        process.env.NEXT_PUBLIC_SUPABASE_URL
      );

      console.log(
        "Supabase Configured:",
        isSupabaseConfigured()
      );

      if (!isSupabaseConfigured()) {
        console.log(
          "Supabase not configured -> Demo login"
        );

        await signInWithDemo();
        return;
      }

      console.log("Starting OAuth request...");

      const result = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          scopes:
            "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      console.log("OAuth Result:");
      console.log(result);

      if (result.error) {
        console.error("OAuth Error:");
        console.error(result.error);

        setLoading(false);
      }
    } catch (err) {
      console.error("SIGN IN ERROR:");
      console.error(err);

      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string, nextPath?: string) => {
    try {
      setLoading(true);
      if (!isSupabaseConfigured()) {
        await signInWithDemo();
        return { error: null };
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setLoading(false);
        return { error };
      }
      // If we need to redirect, we could do window.location.href, but usually the component handles it
      if (nextPath) {
        window.location.href = nextPath;
      }
      return { error: null };
    } catch (err) {
      setLoading(false);
      return { error: err as Error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      setLoading(true);
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return { error: null };
      }
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      setLoading(false);
      return { error };
    } catch (err) {
      setLoading(false);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      console.log("SIGN OUT");

      setLoading(true);

      if (!isSupabaseConfigured()) {
        setUser(null);
        setLoading(false);
        return;
      }

      await supabase.auth.signOut();

      setUser(null);
      setLoading(false);
    } catch (err) {
      console.error("SIGN OUT ERROR:", err);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithDemo,
        signInWithGoogle,
        signInWithEmail,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}