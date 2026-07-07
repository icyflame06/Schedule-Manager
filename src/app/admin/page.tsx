"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";


export default function AdminLoginPage() {
  const { user, loading, signInWithEmail, signInWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    setSigningIn(true);
    setErrorMsg("");

    const { error } = await signInWithEmail(email, password, "/dashboard");
    
    if (error) {
      setErrorMsg(error.message);
      setSigningIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle("/dashboard");
    } catch {
      setSigningIn(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setErrorMsg("Please enter your email first to reset your password.");
      return;
    }
    
    const { supabase } = await import("@/lib/supabase/client");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard/settings`,
    });
    
    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg("Password reset email sent! Check your inbox.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative px-4">
      {/* Subtle ambient background */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Theme toggle */}
      <div className="absolute top-5 right-5">
        <Button variant="ghost" size="sm" onClick={toggleTheme} className="p-2.5 rounded-xl">
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </Button>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        <form onSubmit={handleLogin} className="glass border border-border/40 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-6 text-center">
          {/* Logo */}
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/25">
            C
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Palsa Admin
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Sign in to manage your schedule
            </p>
          </div>

          <div className="w-full flex flex-col gap-3">
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin Email"
              required
              className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {errorMsg && (
            <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg w-full">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {signingIn ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Sign In"}
          </button>

          <div className="flex items-center w-full gap-3 opacity-60">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs uppercase font-medium text-slate-500">OR</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {signingIn ? (
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {signingIn ? "Redirecting…" : "Continue with Google"}
          </button>

          <div className="flex flex-col gap-2 items-center w-full">
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer"
            >
              Forgot Password?
            </button>
            <p className="text-xs text-slate-400 dark:text-zinc-600">
              Restricted access only
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
