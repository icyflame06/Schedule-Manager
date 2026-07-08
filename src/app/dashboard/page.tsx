"use client";

import React, { useEffect, useState } from "react";
import { MeetingType } from "@/types";
import { db } from "@/lib/db";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import {
  Plus,
  Copy,
  Check,
  Settings,
  Trash2,
  Video,
  Phone,
  Link as LinkIcon,
  Clock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function MeetingsPage() {
  const { user } = useAuth();
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [locationType, setLocationType] = useState<'google_meet' | 'phone' | 'custom'>('google_meet');
  const [locationDetails, setLocationDetails] = useState("Google Meet link automatically generated");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function loadData() {
      if (user) {
        const data = await db.getMeetingTypes(user.id);
        setMeetingTypes(data);
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Sync slug with title on change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) {
      setFormError("Title and Slug are required.");
      return;
    }

    try {
      const newMeeting = await db.createMeetingType({
        title,
        slug,
        description,
        duration: Number(duration),
        location_type: locationType,
        meeting_link: locationType === "google_meet" ? "Google Meet link automatically generated" : locationDetails,
        is_active: true,
      });

      setMeetingTypes((prev) => [...prev, newMeeting]);
      setIsCreateOpen(false);
      // Reset Form
      setTitle("");
      setSlug("");
      setDescription("");
      setDuration(30);
      setLocationType("google_meet");
      setLocationDetails("");
      setFormError("");
    } catch (err: any) {
      setFormError(err.message || "Failed to create meeting type.");
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm("Are you sure you want to delete this meeting type?");
    if (confirm) {
      const success = await db.deleteMeetingType(id);
      if (success) {
        setMeetingTypes((prev) => prev.filter((m) => m.id !== id));
      }
    }
  };

  const handleCopyLink = (eventSlug: string, id: string) => {
    if (!user) return;
    const origin = window.location.origin;
    const url = `${origin}/book/${user.username}/${eventSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Meeting Types
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create event templates that clients can book directly.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Create Meeting Type
        </Button>
      </div>

      {/* Grid of Meeting Types */}
      {meetingTypes.length === 0 ? (
        <Card variant="glass" className="p-10 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FBBA00]/10 flex items-center justify-center text-[#FBBA00]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-900">No Meeting Types</h3>
            <p className="text-sm text-slate-500 mt-1">
              Create your first meeting template to start scheduling.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} variant="secondary" className="mt-2">
            Create first template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetingTypes.map((mt) => (
            <Card key={mt.id} variant="glass-interactive" className="flex flex-col justify-between h-64 relative">
              <div className="absolute top-4 right-4 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                  onClick={() => handleDelete(mt.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <CardContent className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#FBBA00] uppercase tracking-wider mb-2">
                    <Clock className="w-3.5 h-3.5" /> {mt.duration < 60 ? `${mt.duration} Minutes` : mt.duration === 60 ? '1 Hour' : `${mt.duration / 60} Hours`}
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 truncate pr-6">
                    {mt.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 mt-2 leading-relaxed">
                    {mt.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-4 text-sm font-medium text-slate-600">
                  {mt.location_type === "google_meet" && (
                    <>
                      <Video className="w-4 h-4 text-[#FBBA00]" />
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
                      <span className="truncate max-w-[150px]">{mt.meeting_link}</span>
                    </>
                  )}
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                <button
                  onClick={() => handleCopyLink(mt.slug, mt.id)}
                  className="text-xs text-[var(--primary)] font-semibold hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === mt.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy link</span>
                    </>
                  )}
                </button>

                <Link href={`/book/${user?.username}/${mt.slug}`} target="_blank">
                  <Button variant="secondary" size="sm" className="rounded-lg">
                    View
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Meeting Type">
        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          <Input
            label="Title"
            placeholder="e.g. 30 Minute Coffee Chat"
            value={title}
            onChange={handleTitleChange}
            required
          />

          <Input
            label="Link Slug"
            placeholder="e.g. coffee-chat"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, ""))}
            required
          />

          <Textarea
            label="Description"
            placeholder="Introduce the purpose of this meeting..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1">
                Duration (mins)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-900 glass-input transition-all"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="45">45 Minutes</option>
                <option value="60">1 Hour</option>
                <option value="90">1.5 Hours</option>
                <option value="120">2 Hours</option>
                <option value="180">3 Hours</option>
                <option value="240">4 Hours</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1">
                Location
              </label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-900 glass-input transition-all"
              >
                <option value="google_meet">Google Meet</option>
                <option value="phone">Phone Call</option>
                <option value="custom">Custom Address</option>
              </select>
            </div>
          </div>

          {locationType !== "google_meet" && (
            <Input
              label={locationType === "phone" ? "Phone Instructions" : "Custom Address / Link"}
              placeholder={locationType === "phone" ? "e.g. Host will call you at your number" : "e.g. Office address or Zoom URL"}
              value={locationDetails}
              onChange={(e) => setLocationDetails(e.target.value)}
              required
            />
          )}

          {formError && <p className="text-xs text-red-500 pl-1">{formError}</p>}

          <div className="flex justify-end gap-3 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
