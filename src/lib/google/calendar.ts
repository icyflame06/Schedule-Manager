import { Booking, MeetingType, Integration } from "@/types";
import { db } from "@/lib/db";

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
        return data.access_token;
      }
    } catch (e) {
      console.error("Failed to refresh Google OAuth token", e);
    }
  }

  return null;
}

export async function getHostGoogleAccessToken(hostUserId: string): Promise<string | null> {
  const credential = await db.getGoogleCredential(hostUserId);

  if (credential) {
    // If expired or close to expiry (within 60 seconds), refresh it
    const expiryTime = credential.expires_at ? new Date(credential.expires_at).getTime() : 0;
    const isExpired = expiryTime ? (Date.now() >= expiryTime - 60000) : false;

    if (isExpired && credential.refresh_token) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (clientId && clientSecret) {
        try {
          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: credential.refresh_token,
              grant_type: "refresh_token",
            }),
          });

          const data = await response.json();
          if (data.access_token) {
            const expires_at = Date.now() + (data.expires_in || 3600) * 1000;
            await db.setGoogleCredential({
              user_id: hostUserId,
              provider: "google",
              access_token: data.access_token,
              refresh_token: data.refresh_token || credential.refresh_token,
              expires_at: expires_at,
            });
            console.log(`[Calendar] Token refreshed from DB for host ${hostUserId}`);
            return data.access_token;
          }
        } catch (e) {
          console.error("Failed to refresh host Google OAuth token:", e);
        }
      }
    }

    console.log(`[Calendar] Using DB token for host ${hostUserId}`);
    return credential.access_token;
  }

  // Fallback: try the current session's cookie token (works when host is visiting their own page)
  console.log(`[Calendar] No DB credential found for host ${hostUserId}, trying session cookie fallback...`);
  const cookieToken = await getGoogleAccessToken();
  if (cookieToken) {
    console.log(`[Calendar] Using session cookie token as fallback for host ${hostUserId}`);
  } else {
    console.warn(`[Calendar] No Google OAuth token found for host ${hostUserId}. FreeBusy will be skipped.`);
  }
  return cookieToken;
}

export async function getGoogleCalendarBusySlots(
  hostUserId: string,
  timeMin: string,
  timeMax: string
): Promise<{ start: string; end: string }[]> {
  try {
    const token = await getHostGoogleAccessToken(hostUserId);
    if (!token) {
      console.warn(`[Calendar] Skipping FreeBusy fetch – no token for host ${hostUserId}`);
      return [];
    }

    console.log(`[Calendar] Fetching FreeBusy slots for host ${hostUserId} between ${timeMin} and ${timeMax}`);

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/freeBusy",
      {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: "primary" }],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Failed to fetch Google FreeBusy slots:", errText);
      return [];
    }

    const data = await response.json();
    const busy: { start: string; end: string }[] = data.calendars?.primary?.busy || [];
    console.log(`[Calendar] Got ${busy.length} busy slot(s) from Google Calendar`);
    return busy.map((b: any) => ({
      start: b.start,
      end: b.end,
    }));
  } catch (error) {
    console.error("Error fetching host busy slots:", error);
    return [];
  }
}

export async function createGoogleCalendarEvent(
  booking: Omit<Booking, "id" | "status" | "created_at">,
  meetingType: MeetingType
): Promise<{ eventId?: string; meetLink?: string } | null> {
  const token = await getHostGoogleAccessToken(booking.host_user_id);
  if (!token) {
    console.log("No Google OAuth token found. Booking will fall back to default auto-generated link.");
    return null;
  }

  try {
    const eventBody: any = {
      summary: `${meetingType.title}: ${booking.guest_name}`,
      description: `Scheduled via Palsa.\n\nGuest Notes: ${booking.guest_notes || "None"}`,
      start: {
        dateTime: booking.start_time,
        timeZone: booking.timezone || "UTC",
      },
      end: {
        dateTime: booking.end_time,
        timeZone: booking.timezone || "UTC",
      },
      attendees: [
        { email: booking.guest_email, displayName: booking.guest_name }
      ],
    };

    if (meetingType.location_type === "google_meet") {
      eventBody.conferenceData = {
        createRequest: {
          requestId: `chronos-meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      };
    }

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

export async function deleteGoogleCalendarEvent(
  hostUserId: string,
  eventId: string
): Promise<boolean> {
  const token = await getHostGoogleAccessToken(hostUserId);
  if (!token) return false;

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to delete Google Calendar Event:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting Google Calendar Event:", error);
    return false;
  }
}
