"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { Calendar, Clock, Globe, Shield, Moon, Sun, ArrowRight, Video, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, signInWithDemo, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleDemoAccess = async () => {
    await signInWithDemo();
    router.push("/dashboard");
  };

  const handleGoogleAccess = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      alert("Failed to start Google OAuth flow");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Dynamic Background Gradients (Removed for flat theme) */}

      {/* Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-black font-bold text-xl shadow-lg border border-black group-hover:scale-105 transition-all">
            P
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            Palsa
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <Link href="/dashboard">
              <Button size="sm">Go to Dashboard</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative flex-1 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto py-16 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Premium Scheduling Experience
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] max-w-4xl text-slate-900 dark:text-white">
            Schedule meetings with a{" "}
            <span className="text-[var(--primary)]">
              premium booking
            </span>{" "}
            experience.
          </h1>

          <p className="text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mt-2 leading-relaxed">
            Beautifully designed dashboard, automatic timezone conversions, custom meeting durations, and Google Calendar syncing. Speed up scheduling today.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
            <Link href="/book/icyflame06j8e">
              <Button size="lg" className="group pr-5">
                Book a Slot{" "}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Dashboard Preview mockup card */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-16 w-full max-w-4xl"
        >
          <Card variant="glass" className="p-2.5 shadow-2xl relative">
            <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-400/5 blur-xl pointer-events-none" />
            <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 p-4 aspect-[16/10] flex flex-col justify-between">
              {/* Fake dashboard headers */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div className="h-4 w-28 bg-slate-800 rounded-md ml-3" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-slate-800 rounded-md" />
                  <div className="h-6 w-8 bg-slate-800 rounded-md" />
                </div>
              </div>

              {/* Fake content grid */}
              <div className="grid grid-cols-3 gap-4 flex-1 mt-4">
                <div className="col-span-1 border-r border-slate-800/60 pr-4 flex flex-col gap-3">
                  <div className="h-8 bg-slate-800/80 rounded-lg w-full" />
                  <div className="h-6 bg-slate-800/40 rounded-lg w-4/5" />
                  <div className="h-6 bg-slate-800/40 rounded-lg w-3/4" />
                </div>
                <div className="col-span-2 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-slate-800/50 rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
                      <div className="h-4 w-12 bg-indigo-500/20 rounded-md" />
                      <div className="h-6 w-2/3 bg-slate-700 rounded-md" />
                    </div>
                    <div className="h-24 bg-slate-800/50 rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
                      <div className="h-4 w-12 bg-emerald-500/20 rounded-md" />
                      <div className="h-6 w-2/3 bg-slate-700 rounded-md" />
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-800/30 rounded-xl border border-slate-800/60 p-4 flex flex-col justify-between">
                    <div className="h-4 w-1/3 bg-slate-700 rounded-md" />
                    <div className="flex gap-2 items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-700" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="h-4 w-1/2 bg-slate-700 rounded-md" />
                        <div className="h-3 w-1/3 bg-slate-800 rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>

      {/* Features Grid */}
      <section id="features" className="relative w-full bg-black text-white px-6 py-24 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight">
              Global Recognition
            </h2>
            <p className="text-zinc-400 mt-3 max-w-lg mx-auto">
              Everything you need in a modern meeting platform, optimized for conversion and speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Clock,
                title: "Meeting Types",
                desc: "Configure 15m, 30m, 60m, or fully customized events with setup locations.",
              },
              {
                icon: Globe,
                title: "Timezone Conversion",
                desc: "Detect guest timezones automatically and display host availability seamlessly.",
              },
              {
                icon: Video,
                title: "Meet Link Generation",
                desc: "Create and attach unique Google Meet links automatically to booked calendars.",
              },
              {
                icon: Shield,
                title: "Creative Aesthetics",
                desc: "Experience fully interactive UI designs, premium dark modes, and bold themes.",
              },
            ].map((feat, index) => (
              <Card key={index} className="p-6 flex flex-col justify-between h-56 bg-zinc-900 border border-zinc-800 text-white rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-[var(--primary)] text-black flex items-center justify-center shadow-inner">
                  <feat.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative w-full max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between z-10 border-t border-border/20 text-sm text-slate-500 dark:text-zinc-500">
        <div>&copy; {new Date().getFullYear()} Palsa Inc. All rights reserved.</div>
        <div className="flex gap-6 mt-4 sm:mt-0">
          <Link href="#" className="hover:text-slate-800 dark:hover:text-zinc-200 transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-slate-800 dark:hover:text-zinc-200 transition-colors">Terms</Link>
          <Link href="#" className="hover:text-slate-800 dark:hover:text-zinc-200 transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
