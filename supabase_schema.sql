-- ==========================================
-- SUPABASE SCHEMA SETUP WITH ROW LEVEL SECURITY
-- Paste this script directly in the Supabase SQL Editor
-- ==========================================

-- 1. Create profiles table (User Roles mapping)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies:
-- Allow users to view their own profile, allow admins to view all profiles.
CREATE POLICY "Allow individual read of own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Allow admins to select all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    CASE 
      WHEN LOWER(new.email) = 'prajwalgadade9606@gmail.com' OR LOWER(new.email) = 'prajwalgadade96@gmail.com' THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup existing trigger/function if updating
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure all existing users have profiles (helper in case any already exist)
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'user' FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Specifically ensure our main emails are admin
UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(email) IN ('prajwalgadade9606@gmail.com', 'prajwalgadade96@gmail.com');


-- 2. Create movies table
CREATE TABLE IF NOT EXISTS public.movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  synopsis TEXT,
  release_year INTEGER,
  genre TEXT[],
  poster_url TEXT,
  video_url TEXT NOT NULL,
  rating NUMERIC DEFAULT 4.5,
  duration TEXT DEFAULT '2h 5m',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on movies
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- Movies RLS Policies:
-- Allow anyone (even anonymous) to SELECT
CREATE POLICY "Allow public read access to movies" ON public.movies
  FOR SELECT USING (true);

-- Restrict write operations to admin
CREATE POLICY "Allow admin write access to movies" ON public.movies
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- 3. Create animes table
CREATE TABLE IF NOT EXISTS public.animes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  synopsis TEXT,
  release_year INTEGER,
  genre TEXT[],
  poster_url TEXT,
  rating NUMERIC DEFAULT 4.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on animes
ALTER TABLE public.animes ENABLE ROW LEVEL SECURITY;

-- Animes RLS Policies:
CREATE POLICY "Allow public read access to animes" ON public.animes
  FOR SELECT USING (true);

CREATE POLICY "Allow admin write access to animes" ON public.animes
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- 4. Create episodes table
CREATE TABLE IF NOT EXISTS public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID REFERENCES public.animes(id) ON DELETE CASCADE NOT NULL,
  episode_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration TEXT DEFAULT '24m',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on episodes
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- Episodes RLS Policies:
CREATE POLICY "Allow public read access to episodes" ON public.episodes
  FOR SELECT USING (true);

CREATE POLICY "Allow admin write access to episodes" ON public.episodes
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
