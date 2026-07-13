"use client";

import React, { useState, useEffect } from "react";
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
  const { user, signInWithGoogle, updatePassword } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [timezone, setTimezone] = useState(user?.timezone || "UTC");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  useEffect(() => {
    async function checkIntegration() {
      if (user) {
        const cred = await db.getGoogleCredential(user.id);
        setGoogleConnected(!!cred);
      }
    }
    checkIntegration();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      if (newPassword) {
        const { error } = await updatePassword(newPassword);
        if (error) {
          alert("Failed to update password: " + error.message);
          setSaving(false);
          return;
        }
        setNewPassword(""); // clear after success
      }

      await db.updateProfile({
        full_name: fullName,
        username: username.toLowerCase().replace(/[^a-z0-9\-_]/g, ""),
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

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      alert("Failed to connect Google Calendar.");
    } finally {
      setConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (user) {
      const ok = await db.deleteGoogleCredential(user.id);
      if (ok) setGoogleConnected(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Customize your profile, link slug, and integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card Form */}
        <div className="lg:col-span-2">
          <Card variant="glass" className="p-6">
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Settings className="w-5 h-5 text-[var(--primary)]" /> Profile Details
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
                    className="w-full px-4 py-3 rounded-xl text-sm text-slate-900 glass-input transition-all"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
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

              <hr className="border-border/50 my-2" />
              
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" /> Security
              </h3>

              <div className="flex flex-col gap-1.5">
                <Input
                  type="password"
                  label="New Password"
                  placeholder="Leave blank to keep current password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

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
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--primary)]" /> Integrations
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Connect your account to external calendar networks to block busy times and schedule invites automatically.
              </p>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-3 mt-2 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900">
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
                <p className="text-xs text-slate-500">
                  Allows automatic insertion of meetings and Google Meet URL creations.
                </p>
              </div>
            </div>

            <div className="mt-6">
              {googleConnected ? (
                <Button
                  variant="secondary"
                  className="w-full text-red-500 border border-red-500/20 hover:bg-red-500/5"
                  onClick={handleDisconnectGoogle}
                >
                  Disconnect Google
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="w-full"
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
