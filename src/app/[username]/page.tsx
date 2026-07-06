"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Profile, MeetingType } from "@/types";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Clock, Video, Phone, Link as LinkIcon, Globe, MapPin } from "lucide-react";
import Link from "next/link";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (username) {
        const prof = await db.getProfile(username);
        if (prof) {
          setProfile(prof);
          const types = await db.getMeetingTypes(prof.id);
          setMeetingTypes(types.filter((t) => t.is_active));
        }
        setLoading(false);
      }
    }
    loadData();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Card variant="glass" className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">User Not Found</h2>
          <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm">
            The profile page you are looking for does not exist or has been disabled.
          </p>
          <Link href="/">
            <Button className="mt-4">Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col justify-between py-16 px-6">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      <main className="max-w-4xl mx-auto w-full flex-1 flex flex-col items-center gap-10 relative z-10">
        {/* Host Details Header */}
        <div className="flex flex-col items-center text-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500 shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-3xl font-bold border border-indigo-500/20">
              {profile.full_name.charAt(0)}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-snug">
              {profile.full_name}
            </h1>
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 mt-1">
              <Globe className="w-3.5 h-3.5" />
              <span>{profile.timezone} Timezone</span>
            </div>
          </div>
        </div>

        {/* Meeting types options list */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {meetingTypes.map((mt) => (
            <Card key={mt.id} variant="glass-interactive" className="flex flex-col justify-between p-6 min-h-[220px]">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                  <Clock className="w-3.5 h-3.5" /> {mt.duration} Minutes
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">
                  {mt.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-3 mt-2 leading-relaxed">
                  {mt.description || "No description provided."}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 mt-6 border-t border-border/20 pt-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-zinc-400">
                  {mt.location_type === "google_meet" && (
                    <>
                      <Video className="w-4 h-4 text-indigo-500" />
                      <span>Google Meet</span>
                    </>
                  )}
                  {mt.location_type === "phone" && (
                    <>
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <span>Phone Call</span>
                    </>
                  )}
                  {mt.location_type === "custom" && (
                    <>
                      <LinkIcon className="w-4 h-4 text-slate-400" />
                      <span className="truncate max-w-[120px]">{mt.location_details}</span>
                    </>
                  )}
                </div>

                <Link href={`/${profile.username}/${mt.slug}`} className="cursor-pointer">
                  <Button size="sm">Book Slot</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 dark:text-zinc-500 mt-12">
        Powered by Chronos Premium Scheduling Platform
      </footer>
    </div>
  );
}
