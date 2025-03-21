-- ENUMS

-- Create enum for user roles

CREATE TYPE user_role AS ENUM ('admin', 'team', 'user');

-- Create the domain ENUM

CREATE TYPE domain_type AS ENUM (
  'Web Dev',
  'Video Editing',
  'Socials',
  'App Dev',
  'Cloud & AI',
  'Graphics',
  'Marketing',
  'Management'
);

-- TABLES

-- Create users table

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  image text DEFAULT 'user.png',
  created_at timestamptz DEFAULT now()
);

-- Create blogs table

CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  writer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  image_url text,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create events table

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  post_image text,
  description text,
  event_time timestamptz NOT NULL,
  location text,
  created_at timestamptz DEFAULT now()
);

-- Create registrations table (many-to-many relationship)

CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Create members table

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain domain_type NOT NULL, -- Use the ENUM here
  role text NOT NULL,
  name text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  profile_links text[],
  description text,
  thought text,
  created_at timestamptz DEFAULT now()
);

-- STORAGE BUCKETS

-- Create the blog bucket

INSERT INTO storage.buckets (id, name, public)
VALUES ('blogs', 'blogs', true);

-- Ensure the bucket is public

UPDATE storage.buckets
SET public = true
WHERE id = 'blogs';

-- Create the profile bucket

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile', 'profile', true);

-- Ensure the bucket is public

UPDATE storage.buckets
SET public = true
WHERE id = 'profile';

-- Create the bucket

INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true);

-- Ensure the bucket is public

UPDATE storage.buckets
SET public = true
WHERE id = 'events';

-- Create the bucket

INSERT INTO storage.buckets (id, name, public)
VALUES ('emo', 'emo', true);

-- Ensure the bucket is public

UPDATE storage.buckets
SET public = true
WHERE id = 'emo';

-- FUNCTIONS

-- CREATE A FUNCTION TO HANDLE NEW USERS

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'user'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to validate user_id in members table
CREATE OR REPLACE FUNCTION validate_member_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user_id is valid (references a user with role 'team' or 'admin')
  IF NEW.user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM users
    WHERE id = NEW.user_id AND role IN ('team', 'admin')
  ) THEN
    RAISE EXCEPTION 'user_id must reference a user with role "team" or "admin"';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- TRIGGERS

-- CREATE A TRIGGER

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create a trigger to validate user_id on insert or update

CREATE TRIGGER validate_member_user_id_trigger
BEFORE INSERT OR UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION validate_member_user_id();



-- INDEXES

-- Create indexes for better query performance

CREATE INDEX IF NOT EXISTS idx_blogs_writer_id ON blogs(writer_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);


-- ROW LEVEL SECURITY (RLS)

-- Enable Row Level Security

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;


-- POLICIES

-- Users table policies

CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin and team can update user data"
  ON users
  FOR UPDATE
  USING (EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'team')
    ));

CREATE POLICY "Admin and team can delete user data"
  ON users
  FOR DELETE
  USING (EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'team')
    ));

CREATE POLICY "Allow users to update their name and image"
ON users
FOR UPDATE
USING (auth.role() = 'user')
WITH CHECK (auth.uid() = id);

-- Blogs table policies

CREATE POLICY "Anyone can read blogs"
  ON blogs
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Admin and team can create blogs"
  ON blogs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'team')
    )
  );

CREATE POLICY "Admin and team can update their own blogs"
  ON blogs
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'team'))
    AND writer_id = auth.uid()
  );

CREATE POLICY "Admin and team can delete blogs"
  ON blogs
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'team'))
    AND writer_id = auth.uid()
  );

-- Events table policies

CREATE POLICY "Anyone can read events"
  ON events
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Admin and team can create events"
  ON events
  FOR INSERT
  WITH CHECK (  EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'team')
    ));

CREATE POLICY "Admin and team can update events"
  ON events
  FOR UPDATE
  USING (  EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'team')
    ));

CREATE POLICY "Admin and team can delete events"
  ON events
  FOR DELETE
  USING (  EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'team')
    ));

-- Registrations table policies

CREATE POLICY "Users can read their own registrations"
  ON registrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register for events"
  ON registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin and Team can read all registrations"
  ON registrations
  FOR SELECT
  USING (EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'team')
    ));

-- Members table policies

CREATE POLICY "Anyone can read members"
ON members
FOR SELECT
TO PUBLIC
USING (true);

CREATE POLICY "Only admins can insert members"
ON members
FOR INSERT
WITH CHECK (
    EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    )
);

CREATE POLICY "Only admins can update members"
ON members
FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    ));

CREATE POLICY "Only admins can delete members"
ON members
FOR DELETE
USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    ));

CREATE POLICY "Team Mebers & Admin can update their own data"
ON members
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- events bucket policies

CREATE POLICY "Public read access for events"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'events');

CREATE POLICY "Admins and team can upload to events"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'events'
    AND EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'team')
    )
);

CREATE POLICY "Admins and team can update events"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'events'
    AND EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'team')
    )
);

CREATE POLICY "Only admins and team can delete from events"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'events'
    AND EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'team')
    )
);


-- blogs bucket policies

CREATE POLICY "Public read access for blogs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blogs');

CREATE POLICY "Admins and team can upload to blogs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'blogs'
    AND EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'team')
    )
);

CREATE POLICY "Admins and team can update blogs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'blogs'
    AND EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'team')
    )
);

CREATE POLICY "Admins and team can delete from blogs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'blogs'
    AND EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'team')
    )
);


-- profile bucket policies

CREATE POLICY "Public read access for profile images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile');

CREATE POLICY "Admins and team can upload to profile"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile'
    AND EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'team')
    )
);

CREATE POLICY "Admins and team can update profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile'
    AND EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'team')
    )
);

CREATE POLICY "Only admins and team can delete from profile"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile'
    AND EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'team')
    )
);

-- emo bucket policies

CREATE POLICY "Allow public read access to emo bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'emo');