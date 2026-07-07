"use server";

import { unstable_noStore as noStore } from "next/cache";
import { Booking, MeetingType } from "@/types";
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
