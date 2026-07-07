import { Profile, MeetingType, Availability, Booking, Integration } from "@/types";
import { supabase, isSupabaseConfigured } from "./supabase/client";

// --- MOCK DATABASE IMPLEMENTATION (localStorage backed) ---
const IS_SERVER = typeof window === "undefined";

const DEFAULT_PROFILE: Profile = {
  id: "mock-user-id",
  email: "alex@example.com",
  username: "alex_scheduling",
  full_name: "Alex Rivera",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
  bio: "Hi, I am Alex Rivera. Book a coffee chat or a consulting session with me!",
  timezone: "America/New_York",
  created_at: new Date().toISOString(),
};

const DEFAULT_MEETING_TYPES: MeetingType[] = [
  {
    id: "mt-1",
    user_id: "mock-user-id",
    title: "15 Minute Coffee Chat",
    slug: "coffee-chat",
    description: "A quick virtual meet-up to chat about networking, career guidance, or general questions.",
    duration: 15,
    is_active: true,
    location_type: "google_meet",
    created_at: new Date().toISOString(),
    color: "#6366f1",
  },
  {
    id: "mt-2",
    user_id: "mock-user-id",
    title: "30 Minute Discovery Call",
    slug: "discovery",
    description: "Deep dive into your project requirements, scope, timeline, and how I can help you succeed.",
    duration: 30,
    is_active: true,
    location_type: "google_meet",
    created_at: new Date().toISOString(),
    color: "#10b981",
  },
  {
    id: "mt-3",
    user_id: "mock-user-id",
    title: "60 Minute Strategy Consultation",
    slug: "strategy",
    description: "Detailed analysis and design feedback for your web application architecture and branding.",
    duration: 60,
    is_active: true,
    location_type: "phone",
    created_at: new Date().toISOString(),
    color: "#ec4899",
  },
];

const DEFAULT_AVAILABILITY: Availability[] = Array.from({ length: 7 }, (_, i) => ({
  id: `avail-${i}`,
  user_id: "mock-user-id",
  day_of_week: i,
  start_time: "09:00",
  end_time: "17:00",
})).filter(a => a.day_of_week >= 1 && a.day_of_week <= 5); // Monday to Friday

function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (IS_SERVER) return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(stored);
}

function setLocalStorage<T>(key: string, value: T) {
  if (IS_SERVER) return;
  localStorage.setItem(key, JSON.stringify(value));
}

// --- DB INTERFACE ACTIONS ---
export const db = {
  // --- Profile Actions ---
  getProfile: async (username?: string): Promise<Profile | null> => {
    if (!isSupabaseConfigured()) {
      const profile = getLocalStorage<Profile>("db_profile", DEFAULT_PROFILE);
      if (username && profile.username.toLowerCase() !== username.toLowerCase()) {
        return null;
      }
      return profile;
    }

    try {
      const query = supabase.from("profiles").select("*");
      if (username) {
        query.eq("username", username);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        query.eq("id", user.id);
      }
      const { data, error } = await query.single();
      if (error) {
        // Auto create profile record if missing
        if (!username) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const newProfile: Omit<Profile, 'created_at'> = {
              id: user.id,
              email: user.email || "",
              username: user.email ? user.email.split("@")[0] + "_" + Math.random().toString(36).substring(2, 5) : "user_" + Math.random().toString(36).substring(2, 7),
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
              avatar_url: user.user_metadata?.avatar_url || "",
              timezone: "UTC",
              bio: ""
            };
            const { data: inserted, error: insertError } = await supabase
              .from("profiles")
              .insert(newProfile)
              .select()
              .single();
            if (!insertError) return inserted;
          }
        }
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  updateProfile: async (updates: Partial<Profile>): Promise<Profile> => {
    if (!isSupabaseConfigured()) {
      const profile = getLocalStorage<Profile>("db_profile", DEFAULT_PROFILE);
      const updated = { ...profile, ...updates };
      setLocalStorage("db_profile", updated);
      return updated;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Meeting Type Actions ---
  getMeetingTypes: async (userId?: string): Promise<MeetingType[]> => {
    if (!isSupabaseConfigured()) {
      return getLocalStorage<MeetingType[]>("db_meeting_types", DEFAULT_MEETING_TYPES);
    }
    const query = supabase.from("meeting_types").select("*");
    if (userId) {
      query.eq("user_id", userId);
    }
    const { data, error } = await query;
    if (error) return [];
    return data;
  },

  getMeetingTypeBySlug: async (username: string, slug: string): Promise<{ profile: Profile; meetingType: MeetingType } | null> => {
    const profile = await db.getProfile(username);
    if (!profile) return null;

    if (!isSupabaseConfigured()) {
      const meetingTypes = getLocalStorage<MeetingType[]>("db_meeting_types", DEFAULT_MEETING_TYPES);
      const meetingType = meetingTypes.find(mt => mt.slug === slug && mt.is_active);
      return meetingType ? { profile, meetingType } : null;
    }

    const { data, error } = await supabase
      .from("meeting_types")
      .select("*")
      .eq("user_id", profile.id)
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) return null;
    return { profile, meetingType: data };
  },

  createMeetingType: async (meetingType: Omit<MeetingType, "id" | "user_id" | "created_at">): Promise<MeetingType> => {
    if (!isSupabaseConfigured()) {
      const meetingTypes = getLocalStorage<MeetingType[]>("db_meeting_types", DEFAULT_MEETING_TYPES);
      const newMeeting: MeetingType = {
        ...meetingType,
        id: `mt-${Math.random().toString(36).substr(2, 9)}`,
        user_id: "mock-user-id",
        created_at: new Date().toISOString(),
      };
      setLocalStorage("db_meeting_types", [...meetingTypes, newMeeting]);
      return newMeeting;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { data, error } = await supabase
      .from("meeting_types")
      .insert({ ...meetingType, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateMeetingType: async (id: string, updates: Partial<MeetingType>): Promise<MeetingType> => {
    if (!isSupabaseConfigured()) {
      const meetingTypes = getLocalStorage<MeetingType[]>("db_meeting_types", DEFAULT_MEETING_TYPES);
      const index = meetingTypes.findIndex(mt => mt.id === id);
      if (index === -1) throw new Error("Meeting type not found");
      const updated = { ...meetingTypes[index], ...updates };
      meetingTypes[index] = updated;
      setLocalStorage("db_meeting_types", meetingTypes);
      return updated;
    }

    const { data, error } = await supabase
      .from("meeting_types")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteMeetingType: async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      const meetingTypes = getLocalStorage<MeetingType[]>("db_meeting_types", DEFAULT_MEETING_TYPES);
      const filtered = meetingTypes.filter(mt => mt.id !== id);
      setLocalStorage("db_meeting_types", filtered);
      return true;
    }

    const { error } = await supabase.from("meeting_types").delete().eq("id", id);
    return !error;
  },

  // --- Availability Actions ---
  getAvailability: async (userId?: string): Promise<Availability[]> => {
    if (!isSupabaseConfigured()) {
      return getLocalStorage<Availability[]>("db_availability", DEFAULT_AVAILABILITY);
    }
    const query = supabase.from("availability").select("*");
    if (userId) {
      query.eq("user_id", userId);
    }
    const { data, error } = await query.order("day_of_week");
    if (error) return [];
    return data;
  },

  updateAvailability: async (availabilities: Availability[]): Promise<Availability[]> => {
    if (!isSupabaseConfigured()) {
      setLocalStorage("db_availability", availabilities);
      return availabilities;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Clear existing and rewrite
    await supabase.from("availability").delete().eq("user_id", user.id);
    const { data, error } = await supabase
      .from("availability")
      .insert(
        availabilities.map((a) => ({
          user_id: user.id,
          day_of_week: a.day_of_week,
          start_time: a.start_time,
          end_time: a.end_time,
        }))
      )
      .select();
    if (error) throw error;
    return data;
  },

  // --- Bookings Actions ---
  getBookings: async (hostId?: string): Promise<Booking[]> => {
    if (!isSupabaseConfigured()) {
      const defaultBookings: Booking[] = [
        {
          id: "bk-1",
          meeting_type_id: "mt-1",
          host_user_id: "mock-user-id",
          guest_name: "Sarah Jenkins",
          guest_email: "sarah@example.com",
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
          status: "scheduled",
          meet_link: "https://meet.google.com/abc-defg-hij",
          guest_notes: "Looking to discuss career paths in AI engineering.",
          created_at: new Date().toISOString(),
        },
        {
          id: "bk-2",
          meeting_type_id: "mt-2",
          host_user_id: "mock-user-id",
          guest_name: "Michael Chen",
          guest_email: "michael@example.com",
          start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // In 3 days
          end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
          status: "scheduled",
          meet_link: "https://meet.google.com/xyz-uvwx-yza",
          guest_notes: "Introductory discovery call for SaaS application development services.",
          created_at: new Date().toISOString(),
        }
      ];
      return getLocalStorage<Booking[]>("db_bookings", defaultBookings);
    }
    const query = supabase.from("bookings").select("*");
    if (hostId) {
      query.eq("host_user_id", hostId);
    }
    const { data, error } = await query.order("start_time", { ascending: true });
    if (error) return [];
    return data;
  },

  createBooking: async (booking: Omit<Booking, "id" | "status" | "created_at">): Promise<Booking> => {
    const isMock = !isSupabaseConfigured();

    // Auto generate Meet link if location type is google_meet
    let meet_link = booking.meet_link;
    if (!meet_link) {
      meet_link = `https://meet.google.com/${Math.random().toString(36).substr(2, 3)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 3)}`;
    }

    if (isMock) {
      const bookings = getLocalStorage<Booking[]>("db_bookings", []);
      const newBooking: Booking = {
        ...booking,
        meet_link,
        id: `bk-${Math.random().toString(36).substr(2, 9)}`,
        status: "scheduled",
        created_at: new Date().toISOString(),
      };
      setLocalStorage("db_bookings", [...bookings, newBooking]);
      return newBooking;
    }

    const { timezone, ...insertPayload } = booking;

    const { error } = await supabase
      .from("bookings")
      .insert({ ...insertPayload, meet_link, status: "scheduled" });
    if (error) throw error;

    // Return a constructed booking object (avoids RLS SELECT restriction for guest users)
    return {
      ...insertPayload,
      meet_link,
      id: `bk-${Date.now()}`,
      status: "scheduled",
      created_at: new Date().toISOString(),
    } as Booking;
  },

  updateBookingStatus: async (id: string, status: 'scheduled' | 'cancelled' | 'completed'): Promise<Booking> => {
    if (!isSupabaseConfigured()) {
      const bookings = getLocalStorage<Booking[]>("db_bookings", []);
      const index = bookings.findIndex(bk => bk.id === id);
      if (index === -1) throw new Error("Booking not found");
      bookings[index].status = status;
      setLocalStorage("db_bookings", bookings);
      return bookings[index];
    }

    const { data, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Integrations Actions (Google Credentials, etc.) ---
  getGoogleCredential: async (userId: string): Promise<Integration | null> => {
    if (!isSupabaseConfigured()) {
      return getLocalStorage<Integration | null>("db_google_integration", null);
    }
    const { data, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "google")
      .single();
    if (error) return null;
    return {
      ...data,
      expires_at: data.expires_at ? Number(data.expires_at) : undefined,
    };
  },

  setGoogleCredential: async (credential: Omit<Integration, "id">): Promise<Integration> => {
    if (!isSupabaseConfigured()) {
      const newCredential = { ...credential, id: "integration-google" };
      setLocalStorage("db_google_integration", newCredential);
      return newCredential;
    }
    const { data, error } = await supabase
      .from("integrations")
      .upsert({
        user_id: credential.user_id,
        provider: credential.provider,
        access_token: credential.access_token,
        refresh_token: credential.refresh_token,
        expires_at: credential.expires_at ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      ...data,
      expires_at: data.expires_at ? Number(data.expires_at) : undefined,
    };
  },

  deleteGoogleCredential: async (userId: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      setLocalStorage("db_google_integration", null);
      return true;
    }
    const { error } = await supabase
      .from("integrations")
      .delete()
      .eq("user_id", userId)
      .eq("provider", "google");
    return !error;
  }
};
