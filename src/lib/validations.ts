import { z } from "zod";

export const ProfileSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  full_name: z.string().min(1).max(100),
  avatar_url: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
  timezone: z.string().min(1).max(50),
  role: z.enum(["user", "admin"]).default("user"),
});

export const MeetingTypeSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-zA-Z0-9-]+$/),
  description: z.string().max(1000).optional(),
  duration: z.number().int().min(5).max(1440),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  location_type: z.enum(["google_meet", "zoom", "phone", "in_person"]),
  meeting_link: z.string().url().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export const AvailabilitySchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
});

export const AvailabilityListSchema = z.array(AvailabilitySchema);

export const BookingSchema = z.object({
  meeting_type_id: z.string().uuid(),
  host_user_id: z.string().uuid(),
  guest_name: z.string().min(1).max(100),
  guest_email: z.string().email(),
  guest_notes: z.string().max(1000).optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  timezone: z.string().min(1).max(50),
});
