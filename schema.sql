-- 1. Create tables

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Will match auth.users.id
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    role TEXT DEFAULT 'user' NOT NULL,
    timezone TEXT DEFAULT 'UTC' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create meeting_types table
CREATE TABLE IF NOT EXISTS public.meeting_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    color TEXT,
    location_type TEXT NOT NULL,
    meeting_link TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, slug)
);

-- Create availability table
CREATE TABLE IF NOT EXISTS public.availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TEXT NOT NULL, -- e.g., '09:00'
    end_time TEXT NOT NULL -- e.g., '17:00'
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_type_id UUID REFERENCES public.meeting_types(id) ON DELETE SET NULL,
    host_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_notes TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled' NOT NULL CHECK (status IN ('scheduled', 'cancelled', 'completed')),
    google_event_id TEXT,
    meet_link TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create integrations table
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at BIGINT,
    UNIQUE(user_id, provider)
);

-- 2. Configure Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Allow public read access to profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Meeting Types Policies
CREATE POLICY "Allow public read access to active meeting types" ON public.meeting_types
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow hosts to manage their own meeting types" ON public.meeting_types
    FOR ALL USING (auth.uid() = user_id);

-- Availability Policies
CREATE POLICY "Allow public read access to availability" ON public.availability
    FOR SELECT USING (true);

CREATE POLICY "Allow hosts to manage their own availability" ON public.availability
    FOR ALL USING (auth.uid() = user_id);

-- Bookings Policies
CREATE POLICY "Allow public to insert bookings" ON public.bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow hosts to select their own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = host_user_id);

CREATE POLICY "Allow hosts to update their own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = host_user_id);

-- Integrations Policies
CREATE POLICY "Allow users to manage their own integrations" ON public.integrations
    FOR ALL USING (auth.uid() = user_id);

-- 3. Setup Auth Trigger for Profile Auto-Creation

-- Trigger function to build a profile record on auth sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, full_name, avatar_url, timezone, bio)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'custom_username', split_part(new.email, '@', 1) || '_' || substring(md5(random()::text) from 1 for 4)),
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        'UTC',
        ''
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_meeting_types_slug ON public.meeting_types(slug);
CREATE INDEX IF NOT EXISTS idx_bookings_host_time ON public.bookings(host_user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_availability_user ON public.availability(user_id);
