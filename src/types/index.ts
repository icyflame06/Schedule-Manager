export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  timezone: string;
  created_at: string;
}

export interface MeetingType {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string;
  duration: number; // in minutes
  is_active: boolean;
  location_type: 'google_meet' | 'phone' | 'custom';
  location_details: string;
  created_at: string;
  color?: string; // hex or tailwind class color
}

export interface Availability {
  id: string;
  user_id: string;
  day_of_week: number; // 0 (Sunday) to 6 (Saturday)
  start_time: string; // 'HH:MM' format
  end_time: string; // 'HH:MM' format
  is_active: boolean;
}

export interface Booking {
  id: string;
  meeting_type_id: string;
  host_id: string;
  guest_name: string;
  guest_email: string;
  start_time: string; // ISO String
  end_time: string; // ISO String
  timezone: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  google_event_id?: string;
  meeting_link?: string;
  notes?: string;
  created_at: string;
}

export interface GoogleCredential {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  updated_at: string;
}
