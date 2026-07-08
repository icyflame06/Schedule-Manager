"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      {/* Sidebar */}
      <aside className={`border-r border-border/40 p-4 flex flex-col justify-between relative z-10 glass transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between mb-4">
            {!isCollapsed && (
              <Link href="/dashboard" className="flex items-center group">
                <Logo showText={false} />
                <span className="font-bold text-xl ml-2">Palsa</span>
              </Link>
            )}
            {isCollapsed && (
              <Link href="/dashboard" className="flex items-center group mx-auto">
                <Logo showText={false} />
              </Link>
            )}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors absolute -right-3 top-6 bg-white border border-slate-200 shadow-sm z-20"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* User profile card */}
          <div className={`flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 shadow-sm transition-all duration-300 ${isCollapsed ? "p-2 justify-center" : "p-3"}`}>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className={`rounded-full object-cover border border-slate-300 shrink-0 ${isCollapsed ? "w-8 h-8" : "w-10 h-10"}`}
              />
            ) : (
              <div className={`rounded-full bg-[var(--primary)] flex items-center justify-center text-[#111111] font-semibold shrink-0 ${isCollapsed ? "w-8 h-8" : "w-10 h-10"}`}>
                {user.full_name.charAt(0)}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user.full_name}
                </p>
                <Link
                  href={`/${user.username}`}
                  target="_blank"
                  className="text-xs text-[var(--primary)] hover:text-[#EAA800] flex items-center gap-1 mt-0.5 transition-colors group"
                >
                  Public page <ExternalLink className="w-3 h-3 group-hover:translate-x-[1px] transition-transform" />
                </Link>
              </div>
            )}
          </div>

          {/* Menu links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer ${isCollapsed ? "justify-center" : "justify-between"} ${
                      isActive
                        ? "bg-[var(--primary)] text-[#111111] shadow-sm"
                        : "hover:bg-slate-100 text-slate-600 border border-transparent hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${isActive ? "text-[#111111]" : "text-slate-400 group-hover:text-slate-600"}`} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronRight
                        className={`w-4 h-4 transition-transform group-hover:translate-x-[2px] ${
                          isActive
                            ? "text-[#111111]"
                            : "text-slate-400 opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    )}
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
            className={`text-red-500 hover:bg-red-50 rounded-xl transition-all ${isCollapsed ? "justify-center p-2 h-10 w-10 mx-auto" : "w-full justify-start gap-3"}`}
            onClick={signOut}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
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
