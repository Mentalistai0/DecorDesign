-- Migration: Add user_id and favorites functionality
-- Run this migration to update your existing Supabase database

-- Add user_id column to gallery table
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add is_favorite column to gallery table
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Add index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_gallery_user_id ON gallery(user_id);

-- Add index on is_favorite for filtering
CREATE INDEX IF NOT EXISTS idx_gallery_is_favorite ON gallery(is_favorite) WHERE is_favorite = TRUE;

-- Add user_id column to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add is_favorite column to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Add index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);

-- Add index on is_favorite for filtering
CREATE INDEX IF NOT EXISTS idx_videos_is_favorite ON videos(is_favorite) WHERE is_favorite = TRUE;

-- Update RLS policies for gallery table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON gallery;
DROP POLICY IF EXISTS "Enable insert for all users" ON gallery;
DROP POLICY IF EXISTS "Enable delete for all users" ON gallery;
DROP POLICY IF EXISTS "Enable update for all users" ON gallery;

-- Create new RLS policies for gallery
-- Allow authenticated users to view their own content, and everyone to view public content
CREATE POLICY "Users can view their own gallery items"
  ON gallery FOR SELECT
  USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Allow authenticated users to insert their own content
CREATE POLICY "Authenticated users can insert gallery items"
  ON gallery FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Allow users to update only their own content
CREATE POLICY "Users can update their own gallery items"
  ON gallery FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to delete only their own content
CREATE POLICY "Users can delete their own gallery items"
  ON gallery FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Update RLS policies for videos table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON videos;
DROP POLICY IF EXISTS "Enable insert for all users" ON videos;
DROP POLICY IF EXISTS "Enable delete for all users" ON videos;
DROP POLICY IF EXISTS "Enable update for all users" ON videos;

-- Create new RLS policies for videos
CREATE POLICY "Users can view their own video items"
  ON videos FOR SELECT
  USING (
    auth.uid() = user_id OR user_id IS NULL
  );

CREATE POLICY "Authenticated users can insert video items"
  ON videos FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL)
  );

CREATE POLICY "Users can update their own video items"
  ON videos FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own video items"
  ON videos FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Add comment for documentation
COMMENT ON COLUMN gallery.user_id IS 'Foreign key to auth.users. Null for anonymous users.';
COMMENT ON COLUMN gallery.is_favorite IS 'User can mark items as favorites for quick access';
COMMENT ON COLUMN videos.user_id IS 'Foreign key to auth.users. Null for anonymous users.';
COMMENT ON COLUMN videos.is_favorite IS 'User can mark items as favorites for quick access';
