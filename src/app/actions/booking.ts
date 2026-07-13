"use server";

import { unstable_noStore as noStore } from "next/cache";
import { Availability, Booking, MeetingType } from "@/types";
import { createGoogleCalendarEvent, getGoogleCalendarBusySlots, deleteGoogleCalendarEvent } from "@/lib/google/calendar";

import { BookingSchema } from "@/lib/validations";

export async function processGoogleBooking(
  booking: Omit<Booking, "id" | "status" | "created_at">,
  meetingType: MeetingType
): Promise<{ eventId?: string; meetLink?: string } | null> {
  try {
    const validatedBooking = BookingSchema.parse(booking);
    
    // Validate meeting type ownership or status if needed here
    const calendarResult = await createGoogleCalendarEvent(validatedBooking as any, meetingType);
    return calendarResult;
  } catch (error) {
    console.error("Failed to process Google booking integration");
    return null;
  }
}

export async function fetchGoogleCalendarBusySlots(
  hostUserId: string,
  timeMin: string,
  timeMax: string
): Promise<{ start: string; end: string }[]> {
  noStore();
  try {
    const busySlots = await getGoogleCalendarBusySlots(hostUserId, timeMin, timeMax);
    return busySlots;
  } catch (error) {
    console.error("Failed to fetch Google Calendar busy slots action:", error);
    return [];
  }
}

export async function cancelGoogleCalendarEvent(
  hostUserId: string,
  eventId: string
): Promise<boolean> {
  try {
    return await deleteGoogleCalendarEvent(hostUserId, eventId);
  } catch (error) {
    console.error("Failed to cancel Google Calendar event:", error);
    return false;
  }
}

/**
 * Fetch bookings for a host user, bypassing RLS so unauthenticated guests
 * can see which slots are already taken.
 */
export async function fetchHostBookings(
  hostUserId: string
): Promise<Booking[]> {
  noStore();
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
    const admin = getSupabaseAdmin();
    if (!admin) {
      console.warn("[Bookings] No admin client available – returning empty bookings");
      return [];
    }

    const { data, error } = await admin
      .from("bookings")
      .select("*")
      .eq("host_user_id", hostUserId)
      .eq("status", "scheduled")
      .order("start_time", { ascending: true });

    if (error) {
      console.error("[Bookings] Failed to fetch host bookings:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[Bookings] Error fetching host bookings:", error);
    return [];
  }
}

/**
 * Fetch availability for a host user, bypassing RLS so unauthenticated guests
 * can see which days/times the host is available.
 */
export async function fetchHostAvailability(
  hostUserId: string
): Promise<Availability[]> {
  noStore();
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
    const admin = getSupabaseAdmin();
    if (!admin) {
      console.warn("[Availability] No admin client available");
      return [];
    }

    const { data, error } = await admin
      .from("availability")
      .select("*")
      .eq("user_id", hostUserId)
      .order("day_of_week");

    if (error) {
      console.error("[Availability] Failed to fetch:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[Availability] Error fetching:", error);
    return [];
  }
}
