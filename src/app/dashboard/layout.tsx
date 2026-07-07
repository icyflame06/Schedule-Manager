"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Calendar,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  User,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = user?.role?.trim().toLowerCase() === "admin";

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else if (!isAdmin && (pathname === "/dashboard/availability" || pathname === "/dashboard/analytics")) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router, pathname, isAdmin]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const menuItems = [
    {
      name: "Meeting Types",
      href: "/dashboard",
      icon: Clock,
    },
    ...(isAdmin ? [
      {
        name: "Availability",
        href: "/dashboard/availability",
        icon: Calendar,
      },
      {
        name: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
      }
    ] : []),
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="relative min-h-screen flex bg-background">
      {/* Background visual graphics (Removed for flat theme) */}

      {/* Sidebar */}
      <aside className="w-64 border-r border-border/40 p-6 flex flex-col justify-between relative z-10 glass">
        <div className="flex flex-col gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[var(--primary)] text-black border border-black flex items-center justify-center font-bold text-lg shadow-sm">
              P
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              Palsa
            </span>
          </Link>

          {/* User profile card */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/40 dark:bg-zinc-800/40 border border-border/20">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-10 h-10 rounded-full object-cover border border-slate-300"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-black font-semibold border border-black">
                {user.full_name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user.full_name}
              </p>
              <Link
                href={`/${user.username}`}
                target="_blank"
                className="text-xs text-[var(--accent-foreground)] hover:opacity-80 flex items-center gap-1 mt-0.5 transition-colors group"
              >
                Public page <ExternalLink className="w-3 h-3 group-hover:translate-x-[1px] transition-transform" />
              </Link>
            </div>
          </div>

          {/* Menu links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                      isActive
                        ? "bg-[var(--primary)] text-black border border-black shadow-sm"
                        : "hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform group-hover:translate-x-[2px] ${
                        isActive
                          ? "text-black"
                          : "text-slate-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100"
                      }`}
                    />
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col gap-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-xl"
            onClick={toggleTheme}
          >
            {theme === "light" ? (
              <>
                <Moon className="w-5 h-5" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-5 h-5" />
                <span>Light Mode</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-500 hover:bg-red-500/5 dark:hover:bg-red-500/10 rounded-xl"
            onClick={signOut}
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto max-h-screen relative z-10">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
