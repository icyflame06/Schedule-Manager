"use client";

import React, { useEffect, useState } from "react";
import { Booking, MeetingType } from "@/types";
import { db } from "@/lib/db";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  CalendarDays,
  Clock,
  Video,
  User,
  Mail,
  XCircle,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { cancelGoogleCalendarEvent } from "@/app/actions/booking";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (user) {
        const [bkData, mtData] = await Promise.all([
          db.getBookings(user.id),
          db.getMeetingTypes(user.id),
        ]);
        setBookings(bkData);
        setMeetingTypes(mtData);
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleCancelBooking = async (id: string) => {
    const confirm = window.confirm("Are you sure you want to cancel this booking?");
    if (confirm) {
      try {
        const bk = bookings.find((b) => b.id === id);
        
        // If it's linked to a Google Calendar event, delete it from there too
        if (bk?.google_event_id && user) {
          await cancelGoogleCalendarEvent(user.id, bk.google_event_id);
        }

        const updated = await db.updateBookingStatus(id, "cancelled");
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
        );
      } catch (err) {
        alert("Failed to cancel booking.");
      }
    }
  };

  // Stats Computations
  const activeBookings = bookings.filter((b) => b.status === "scheduled");
  const totalBookings = bookings.length;
  const cancelledBookingsCount = bookings.filter((b) => b.status === "cancelled").length;

  const totalMinutesBooked = activeBookings.reduce((sum, bk) => {
    const mt = meetingTypes.find((m) => m.id === bk.meeting_type_id);
    return sum + (mt?.duration || 0);
  }, 0);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Analytics & Bookings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your scheduled event statistics and manage bookings.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="glass" className="p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-0.5">
              Active Bookings
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1">
              {activeBookings.length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FBBA00]/10 flex items-center justify-center text-[#FBBA00]">
            <CalendarDays className="w-6 h-6" />
          </div>
        </Card>

        <Card variant="glass" className="p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-0.5">
              Minutes Scheduled
            </span>
            <span className="text-3xl font-extrabold text-[#FBBA00] mt-1">
              {totalMinutesBooked}m
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FBBA00]/10 flex items-center justify-center text-[#FBBA00]">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        <Card variant="glass" className="p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-0.5">
              Total Managed Events
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1">
              {totalBookings}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Bookings List */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Scheduled Bookings ({activeBookings.length})
        </h2>

        {activeBookings.length === 0 ? (
          <Card variant="glass" className="p-8 text-center text-slate-500">
            No upcoming meetings scheduled.
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {activeBookings.map((bk) => {
              const mt = meetingTypes.find((m) => m.id === bk.meeting_type_id);
              const formattedDate = format(new Date(bk.start_time), "MMMM d, yyyy");
              const formattedTime = `${format(new Date(bk.start_time), "h:mm a")} - ${format(
                new Date(bk.end_time),
                "h:mm a"
              )}`;

              return (
                <Card key={bk.id} variant="glass" className="p-5 hover:border-[#FBBA00]/30 hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    {/* Guest & meeting details */}
                    <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:items-center">
                      <div className="w-12 h-12 rounded-xl bg-[#FBBA00]/10 text-[#FBBA00] flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-950 truncate">
                            {bk.guest_name}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#FBBA00]/10 text-[#FBBA00] font-medium">
                            {mt?.title || "Custom Meeting"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {bk.guest_email}
                          </span>
                          <span className="font-medium text-slate-800">
                            {formattedDate} @ {formattedTime}
                          </span>
                        </div>
                        {bk.guest_notes && (
                          <p className="text-xs text-slate-500 mt-2 bg-slate-50 border border-slate-100 p-2 rounded-lg italic">
                            &ldquo;{bk.guest_notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3">
                      {bk.meet_link && (
                        <Link href={bk.meet_link} target="_blank">
                          <Button variant="secondary" size="sm" className="gap-1.5 rounded-lg py-2">
                            <Video className="w-4 h-4 text-[#FBBA00]" /> Join Meet <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-500/10 rounded-lg p-2"
                        onClick={() => handleCancelBooking(bk.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancelled Bookings log */}
      {cancelledBookingsCount > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider pl-1">
            Cancelled Bookings ({cancelledBookingsCount})
          </h3>
          <div className="flex flex-col gap-2 opacity-60">
            {bookings
              .filter((b) => b.status === "cancelled")
              .map((bk) => (
                <div
                  key={bk.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 text-xs text-slate-500"
                >
                  <span className="font-medium">{bk.guest_name} ({bk.guest_email})</span>
                  <span>{format(new Date(bk.start_time), "MMM d, h:mm a")}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
