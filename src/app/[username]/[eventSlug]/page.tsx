"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Profile, MeetingType, Availability, Booking } from "@/types";
import { db } from "@/lib/db";
import { processGoogleBooking, fetchGoogleCalendarBusySlots } from "@/app/actions/booking";
import { sendBookingConfirmationEmails } from "@/app/actions/email";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Clock,
  Video,
  Phone,
  Link as LinkIcon,
  Globe,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  startOfDay,
  addDays,
  parseISO,
} from "date-fns";
import confetti from "canvas-confetti";

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const eventSlug = (params["event-slug"] || params.eventSlug) as string;

  const { user: loggedInUser, signInWithGoogle } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);

  // State selection
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [guestTimezone, setGuestTimezone] = useState("UTC");

  // Booking Form State
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDuration, setCustomDuration] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (loggedInUser) {
      setGuestName(loggedInUser.full_name || "");
      setGuestEmail(loggedInUser.email || "");
    }
  }, [loggedInUser]);

  useEffect(() => {
    // Detect browser timezone
    if (typeof window !== "undefined") {
      setGuestTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    }

    async function loadData() {
      if (username && eventSlug) {
        const response = await db.getMeetingTypeBySlug(username, eventSlug);
        if (response) {
          setProfile(response.profile);
          setMeetingType(response.meetingType);

          const [availData, bkData] = await Promise.all([
            db.getAvailability(response.profile.id),
            db.getBookings(response.profile.id),
          ]);
          setAvailabilities(availData);
          setExistingBookings(bkData);
        }
        setLoading(false);
      }
    }
    loadData();
  }, [username, eventSlug]);

  const [googleBusySlots, setGoogleBusySlots] = useState<{ start: string; end: string }[]>([]);

  useEffect(() => {
    async function loadGoogleBusy() {
      if (profile) {
        const timeMin = startOfMonth(currentMonth).toISOString();
        const timeMax = endOfMonth(currentMonth).toISOString();
        const busy = await fetchGoogleCalendarBusySlots(profile.id, timeMin, timeMax);
        setGoogleBusySlots(busy);
      }
    }

    loadGoogleBusy();

    // Auto-refresh every 60 seconds so host calendar changes are reflected in real-time
    const interval = setInterval(loadGoogleBusy, 60_000);
    return () => clearInterval(interval);
  }, [profile, currentMonth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile || !meetingType) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Card variant="glass" className="p-8 text-center max-w-md shadow-xl border border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-900">Meeting Not Found</h2>
          <p className="text-slate-500 mt-2 text-sm">
            This booking link is invalid or the meeting template has been deactivated.
          </p>
          <Button className="mt-4" onClick={() => router.push("/")}>Go Home</Button>
        </Card>
      </div>
    );
  }

  // --- CALENDAR GENERATION ---
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days at the beginning of the grid
  const startDayOfWeek = monthStart.getDay(); // 0 is Sunday, 6 is Saturday
  const gridPadding = Array.from({ length: startDayOfWeek });

  // Check if a day has availability
  const isDayAvailable = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return false;
    const dayOfWeek = date.getDay();
    const dayAvail = availabilities.find((a) => a.day_of_week === dayOfWeek);
    return !!dayAvail;
  };

  // --- TIME SLOTS GENERATION ---
  const generateTimeSlotsForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dayAvail = availabilities.find((a) => a.day_of_week === dayOfWeek);
    if (!dayAvail) return [];

    const slots: string[] = [];
    const [startH, startM] = dayAvail.start_time.split(":").map(Number);
    const [endH, endM] = dayAvail.end_time.split(":").map(Number);
    
    const effectiveDuration = isCustomDuration && customDuration ? Number(customDuration) : meetingType.duration;
    const duration = effectiveDuration;

    let current = new Date(date);
    current.setHours(startH, startM, 0, 0);

    const endLimit = new Date(date);
    endLimit.setHours(endH, endM, 0, 0);

    while (current.getTime() + duration * 60 * 1000 <= endLimit.getTime()) {
      // Format as string 'HH:MM'
      const timeString = format(current, "HH:mm");

      // Verify slot doesn't conflict with existing scheduled bookings
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + duration * 60 * 1000);

      const hasConflict = existingBookings.some((bk) => {
        if (bk.status !== "scheduled") return false;
        
        // If this booking is synced to Google Calendar, trust Google's FreeBusy API instead of local DB.
        // This allows the host to delete the event from Google Calendar to free up the slot.
        if (bk.google_event_id && googleBusySlots.length > 0) return false;

        const bkStart = new Date(bk.start_time);
        const bkEnd = new Date(bk.end_time);
        // Overlap condition
        return slotStart < bkEnd && slotEnd > bkStart;
      });

      const hasGoogleConflict = googleBusySlots.some((slot) => {
        const busyStart = new Date(slot.start);
        const busyEnd = new Date(slot.end);
        // Overlap condition
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      if (!hasConflict && !hasGoogleConflict) {
        slots.push(timeString);
      }

      current = new Date(current.getTime() + duration * 60 * 1000);
    }

    return slots;
  };

  const timeSlots = selectedDate ? generateTimeSlotsForDate(selectedDate) : [];

  // --- FORM SUBMISSION ---
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !guestName || !guestEmail) return;

    setSubmitting(true);

    try {
      const [h, m] = selectedTime.split(":").map(Number);
      const start = new Date(selectedDate);
      start.setHours(h, m, 0, 0);
      
      const effectiveDuration = isCustomDuration && customDuration ? Number(customDuration) : meetingType.duration;
      const end = new Date(start.getTime() + effectiveDuration * 60 * 1000);

      const start_time = start.toISOString();
      const end_time = end.toISOString();

      // Try to create Google Calendar event (non-fatal — booking still saves if this fails)
      let googleEventResult: { eventId?: string; meetLink?: string } | null = null;
      try {
        googleEventResult = await processGoogleBooking(
          {
            meeting_type_id: meetingType.id,
            host_user_id: profile.id,
            guest_name: guestName,
            guest_email: guestEmail,
            start_time,
            end_time,
            timezone: guestTimezone,
            guest_notes: notes,
          },
          meetingType
        );
      } catch (googleErr) {
        console.warn("Google Calendar event creation failed (non-fatal):", googleErr);
      }

      const bookingData = await db.createBooking({
        meeting_type_id: meetingType.id,
        host_user_id: profile.id,
        guest_name: guestName,
        guest_email: guestEmail,
        start_time,
        end_time,
        timezone: guestTimezone,
        guest_notes: notes,
        google_event_id: googleEventResult?.eventId,
        meet_link: googleEventResult?.meetLink,
      });

      // Send confirmation emails to both guest and host (non-fatal)
      sendBookingConfirmationEmails(bookingData, meetingType, profile).catch((e) =>
        console.warn("[Email] Confirmation emails failed (non-fatal):", e)
      );

      setSuccessBooking(bookingData);
      setIsSuccess(true);
      
      // Blast Confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error("Booking submission error:", err);
      alert(`Failed to submit booking: ${err?.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess && successBooking) {
    return (
      <div className="min-h-[100dvh] bg-background relative flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[45%] h-[45%] rounded-full bg-[#FBBA00]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[45%] h-[45%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-[95%] sm:max-w-[85%] md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1200px] mx-auto flex flex-col items-center"
        >
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="relative w-full"
          >
            <img 
              src="/poli_confirm_booking.png" 
              alt="Booking Confirmed Bubble" 
              className="w-full h-auto block pointer-events-none mx-auto"
            />
            {/* Content area positioned inside the speech bubble */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="absolute top-[8%] left-[10%] right-[10%] bottom-[28%] flex flex-col items-center justify-center p-2 sm:p-4 text-center overflow-y-auto no-scrollbar"
            >
              <h1 className="text-[20px] sm:text-[24px] md:text-[30px] lg:text-[36px] font-bold text-slate-900 mb-2">
                Booking Confirmed! 🎉
              </h1>
              <p className="text-[13px] sm:text-[15px] md:text-[17px] lg:text-[20px] text-slate-700 mb-4 sm:mb-8 font-normal">
                Your meeting with <strong className="font-bold text-slate-900">{profile.full_name}</strong> has been successfully scheduled.
              </p>

              <div className="w-full max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto flex flex-col gap-3 sm:gap-4 text-left text-[13px] sm:text-[15px] md:text-[17px] lg:text-[20px]">
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="font-semibold text-slate-600">Meeting</span>
                  <span className="font-normal text-slate-900 truncate max-w-[140px] sm:max-w-[180px] md:max-w-xs">{meetingType.title}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="font-semibold text-slate-600">Date</span>
                  <span className="font-normal text-slate-900">
                    {format(new Date(successBooking.start_time), "MMMM d, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="font-semibold text-slate-600">Time</span>
                  <span className="font-normal text-slate-900">
                    {format(new Date(successBooking.start_time), "h:mm a")} ({guestTimezone})
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="font-semibold text-slate-600">Location</span>
                  <span className="font-normal text-slate-900">
                    {meetingType.location_type === "google_meet" ? "Google Meet" : meetingType.location_type}
                  </span>
                </div>
                {successBooking.meet_link && (
                  <div className="flex flex-col gap-1 sm:gap-2 pt-1 sm:pt-2">
                    <span className="font-semibold text-slate-600">Meeting Link</span>
                    <a
                      href={successBooking.meet_link}
                      target="_blank"
                      rel="noreferrer"
                      className="font-normal text-indigo-600 hover:underline truncate"
                    >
                      {successBooking.meet_link.length > 40 ? successBooking.meet_link.substring(0, 40) + "..." : successBooking.meet_link}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Floating Button in Bottom Corner */}
        <button 
          onClick={() => router.push(`/${profile.username}`)}
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 px-6 py-4 md:px-8 md:py-5 bg-[#FBBA00] text-slate-900 font-bold text-base md:text-xl rounded-[16px] shadow-[0_10px_30px_rgba(251,186,0,0.3)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(251,186,0,0.5)] transition-all duration-300 ease-in-out"
        >
          Book Another Session
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col justify-between py-12 px-6">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-[#FBBA00]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <main className="max-w-6xl mx-auto w-full flex-1 relative z-10 flex items-center justify-center">
        <Card variant="glass" className="w-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden shadow-2xl min-h-[580px]">
          
          {/* Left panel: Info */}
          <div className="lg:col-span-4 p-8 border-b lg:border-b-0 lg:border-r border-border/40 flex flex-col justify-between">
              <div className="flex flex-col gap-5">
                <button
                  onClick={() => router.push(`/${profile.username}`)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back to Profile
                </button>

                <div className="flex items-center gap-3 mt-2">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-12 h-12 rounded-full object-cover border-[2px] border-[#FBBA00] shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[var(--primary)] text-[#111111] flex items-center justify-center font-bold shadow-sm">
                      {profile.full_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs text-slate-500">Scheduling with</h4>
                    <h3 className="font-bold text-slate-900 text-sm">{profile.full_name}</h3>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                    {meetingType.title}
                  </h1>

                  <div className="flex flex-col gap-2 text-sm text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4.5 h-4.5 text-[#FBBA00]" />
                      <span>{isCustomDuration && customDuration ? customDuration : meetingType.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {meetingType.location_type === "google_meet" && (
                        <>
                          <Video className="w-4.5 h-4.5 text-[#FBBA00]" />
                          <span>Google Meet (auto-generated)</span>
                      </>
                    )}
                    {meetingType.location_type === "phone" && (
                      <>
                        <Phone className="w-4.5 h-4.5 text-emerald-500" />
                        <span>Phone call</span>
                      </>
                    )}
                    {meetingType.location_type === "custom" && (
                      <>
                        <LinkIcon className="w-4.5 h-4.5 text-slate-400" />
                        <span className="truncate max-w-[200px]">{meetingType.meeting_link}</span>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mt-2 border-t border-slate-100 pt-4">
                  {meetingType.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-6 border-t border-border/20 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Different duration?
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => {
                    setIsCustomDuration(!isCustomDuration);
                    setCustomDuration("");
                    setSelectedTime(null);
                  }}
                >
                  {isCustomDuration ? "Use Default" : "Custom Duration"}
                </Button>
              </div>
              
              {isCustomDuration && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={15}
                    max={240}
                    step={5}
                    placeholder="Minutes (e.g. 45)"
                    value={customDuration}
                    onChange={(e) => {
                      setCustomDuration(e.target.value ? Number(e.target.value) : "");
                      setSelectedTime(null);
                    }}
                    className="w-full text-sm py-1.5"
                  />
                  <span className="text-xs text-slate-500">mins</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-6 pl-0.5">
              <Globe className="w-3.5 h-3.5" />
              <span>{guestTimezone} Timezone</span>
            </div>
          </div>

          {/* Middle panel: Calendar Date Picker */}
          <div className="lg:col-span-5 p-8 flex flex-col border-b lg:border-b-0 lg:border-r border-border/40 justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900">Select Date & Time</h3>
                <div className="flex gap-1.5">
                  <Button variant="ghost" className="p-2.5 rounded-xl cursor-pointer" onClick={handlePrevMonth}>
                    <ChevronLeft className="w-4.5 h-4.5" />
                  </Button>
                  <Button variant="ghost" className="p-2.5 rounded-xl cursor-pointer" onClick={handleNextMonth}>
                    <ChevronRight className="w-4.5 h-4.5" />
                  </Button>
                </div>
              </div>

              <div className="text-center font-semibold text-sm text-slate-900 mb-4">
                {format(currentMonth, "MMMM yyyy")}
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase mb-2">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {gridPadding.map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}

                {daysInMonth.map((day) => {
                  const available = isDayAvailable(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  
                  return (
                    <button
                      key={day.toString()}
                      disabled={!available}
                      onClick={() => {
                        setSelectedDate(day);
                        setSelectedTime(null);
                      }}
                      className={`aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--primary)] text-[#111111] shadow-md shadow-[#FBBA00]/20"
                          : available
                          ? "bg-[#FBBA00]/5 text-[#111111] hover:bg-[#FBBA00]/20"
                          : "text-slate-300 cursor-not-allowed"
                      }`}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-xs text-slate-400 mt-6">
              * Redundant busy slots automatically filtered.
            </div>
          </div>

          {/* Right panel: Time Slots or Form details */}
          <div className="lg:col-span-3 p-8 flex flex-col justify-between max-h-[580px] overflow-y-auto">
            {!selectedDate ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
                <Clock className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium">Please select a date from the calendar grid</p>
              </div>
            ) : !selectedTime ? (
              <div className="flex flex-col gap-4 flex-1">
                <h4 className="font-bold text-sm text-slate-900">
                  Available Slots for {format(selectedDate, "MMM d")}
                </h4>
                {timeSlots.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No available times left today.</p>
                ) : (
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[420px] pr-1">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className="w-full py-3 rounded-xl border border-[#FBBA00]/20 bg-white hover:bg-[var(--primary)] text-slate-900 hover:text-[#111111] text-sm font-bold transition-all cursor-pointer text-center shadow-sm"
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Show Booking Confirmation Details Form
              <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4 flex-1">
                <div className="border-b border-slate-200 pb-3 mb-2">
                  <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Selected Slot</h4>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {format(selectedDate, "MMM d, yyyy")} @ {selectedTime}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedTime(null)}
                    className="text-xs text-[var(--primary)] hover:underline mt-1 cursor-pointer"
                  >
                    Change time
                  </button>
                </div>

                <Input
                  label="Your Name"
                  placeholder="e.g. Jane Doe"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />

                <Input
                  label="Your Email"
                  type="email"
                  placeholder="e.g. jane@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                />

                <Textarea
                  label="Notes / Questions"
                  placeholder="Any context or details you want to share..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                <Button type="submit" disabled={submitting} className="w-full mt-2">
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </form>
            )}
          </div>

        </Card>
      </main>

      <footer className="text-center text-xs text-slate-500 mt-12">
        Powered by Palsa Premium Scheduling Platform
      </footer>
    </div>
  );
}
