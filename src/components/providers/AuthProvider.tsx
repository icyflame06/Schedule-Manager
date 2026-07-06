"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Profile } from "@/types";
import { db } from "@/lib/db";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signInWithDemo: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        if (!isSupabaseConfigured()) {
          const profile = await db.getProfile();
          setUser(profile);
          setLoading(false);
          return;
        }

        // Supabase Auth Listener
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await db.getProfile();
          setUser(profile);
        } else {
          setUser(null);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (session?.user) {
              const profile = await db.getProfile();
              setUser(profile);
            } else {
              setUser(null);
            }
            setLoading(false);
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("Auth error", err);
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const signInWithDemo = async () => {
    setLoading(true);
    // Create default profile in local storage
    const profile = await db.getProfile();
    setUser(profile);
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    if (!isSupabaseConfigured()) {
      await signInWithDemo();
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        scopes: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
      },
    });
    if (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    if (!isSupabaseConfigured()) {
      setUser(null);
      setLoading(false);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithDemo, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
