"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Check, Calendar, Settings, ShieldAlert, AlertCircle } from "lucide-react";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Kolkata",
];

export default function SettingsPage() {
  const { user, signInWithDemo } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [timezone, setTimezone] = useState(user?.timezone || "UTC");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await db.updateProfile({
        full_name: fullName,
        username: username.toLowerCase().replace(/[^a-z0-9\-]/g, ""),
        avatar_url: avatarUrl,
        timezone,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogle = () => {
    setConnectingGoogle(true);
    setTimeout(() => {
      setGoogleConnected(true);
      setConnectingGoogle(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Customize your profile, link slug, and integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card Form */}
        <div className="lg:col-span-2">
          <Card variant="glass" className="p-6">
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500" /> Profile Details
              </h2>

              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Username (slug)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-slate-900 dark:text-white glass-input transition-all"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz} className="dark:bg-zinc-900">
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Avatar Image URL"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />

              <div className="flex justify-end gap-3 mt-2">
                <Button type="submit" disabled={saving} className="min-w-[120px]">
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : success ? (
                    <>
                      <Check className="w-4 h-4" /> Saved!
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Integrations Card */}
        <div className="lg:col-span-1">
          <Card variant="glass" className="p-6 h-full flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" /> Integrations
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Connect your account to external calendar networks to block busy times and schedule invites automatically.
              </p>

              <div className="p-4 rounded-xl border border-border/30 bg-slate-100/20 dark:bg-zinc-800/10 flex flex-col gap-3 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">
                    Google Calendar
                  </span>
                  {googleConnected ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                      Connected
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-semibold">
                      Disconnected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Allows automatic insertion of meetings and Google Meet URL creations.
                </p>
              </div>
            </div>

            <div className="mt-6">
              {googleConnected ? (
                <Button
                  variant="secondary"
                  className="w-full text-red-500 border border-red-500/10 hover:bg-red-500/5 dark:hover:bg-red-500/10"
                  onClick={() => setGoogleConnected(false)}
                >
                  Disconnect Google
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                  onClick={handleConnectGoogle}
                  disabled={connectingGoogle}
                >
                  {connectingGoogle ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Connect Google Calendar"
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
