export interface Profile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  avatar_url: string;
  bio?: string;
  timezone: string;
  role?: string;
  created_at: string;
}

export interface MeetingType {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string;
  duration: number; // in minutes
  color?: string;
  location_type: string;
  meeting_link?: string;
  is_active: boolean;
  created_at: string;
}

export interface Availability {
  id: string;
  user_id: string;
  day_of_week: number; // 0 (Sunday) to 6 (Saturday)
  start_time: string; // 'HH:MM' format
  end_time: string; // 'HH:MM' format
}

export interface Booking {
  id: string;
  meeting_type_id: string;
  host_user_id: string;
  guest_name: string;
  guest_email: string;
  guest_notes?: string;
  start_time: string; // ISO String
  end_time: string; // ISO String
  timezone?: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  google_event_id?: string;
  meet_link?: string;
  created_at: string;
}

export interface Integration {
  id: string;
  user_id: string;
  provider: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}
