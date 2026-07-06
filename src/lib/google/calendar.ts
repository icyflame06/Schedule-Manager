import { Booking, MeetingType } from "@/types";

// Helper to read cookies on the server
async function getCookie(name: string): Promise<string | undefined> {
  if (typeof window !== "undefined") return undefined;
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}

export async function getGoogleAccessToken(): Promise<string | null> {
  const token = await getCookie("google_provider_token");
  if (token) return token;

  // If access token expired but refresh token exists, refresh it
  const refreshToken = await getCookie("google_provider_refresh_token");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (refreshToken && clientId && clientSecret) {
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      const data = await response.json();
      if (data.access_token) {
        // In a real app, you would set the cookie back or save to DB.
        // For simple server actions, we return it to use immediately.
        return data.access_token;
      }
    } catch (e) {
      console.error("Failed to refresh Google OAuth token", e);
    }
  }

  return null;
}

export async function createGoogleCalendarEvent(
  booking: Omit<Booking, "id" | "status" | "created_at">,
  meetingType: MeetingType
): Promise<{ eventId?: string; meetLink?: string } | null> {
  const token = await getGoogleAccessToken();
  if (!token) {
    console.log("No Google OAuth token found. Booking will fall back to default auto-generated link.");
    return null;
  }

  try {
    const eventBody = {
      summary: `${meetingType.title}: ${booking.guest_name}`,
      description: `Scheduled via Chronos.\n\nGuest Notes: ${booking.notes || "None"}`,
      start: {
        dateTime: booking.start_time,
        timeZone: booking.timezone,
      },
      end: {
        dateTime: booking.end_time,
        timeZone: booking.timezone,
      },
      attendees: [
        { email: booking.guest_email, displayName: booking.guest_name }
      ],
      conferenceData: {
        createRequest: {
          requestId: `chronos-meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    };

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Google Calendar Event Creation Failed:", err);
      return null;
    }

    const data = await response.json();
    const meetLink = data.conferenceData?.entryPoints?.find(
      (ep: any) => ep.entryPointType === "video"
    )?.uri;

    return {
      eventId: data.id,
      meetLink: meetLink || data.htmlLink,
    };
  } catch (error) {
    console.error("Error creating Google Calendar Event:", error);
    return null;
  }
}
