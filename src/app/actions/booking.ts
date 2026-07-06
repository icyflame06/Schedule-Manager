"use server";

import { Booking, MeetingType } from "@/types";
import { createGoogleCalendarEvent } from "@/lib/google/calendar";

export async function processGoogleBooking(
  booking: Omit<Booking, "id" | "status" | "created_at">,
  meetingType: MeetingType
): Promise<{ eventId?: string; meetLink?: string } | null> {
  try {
    const calendarResult = await createGoogleCalendarEvent(booking, meetingType);
    return calendarResult;
  } catch (error) {
    console.error("Failed to process Google booking integration:", error);
    return null;
  }
}
