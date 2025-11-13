# Database Setup

This directory contains the database schema for the Decor Design application.

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)

2. Go to the SQL Editor in your Supabase dashboard

3. Copy the contents of `supabase-schema.sql` and run it in the SQL Editor

4. Get your project credentials:
   - Go to Settings > API
   - Copy the `Project URL` (SUPABASE_URL)
   - Copy the `anon public` key (SUPABASE_ANON_KEY)

5. Add these credentials to your backend `.env` file:
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   ```

## Database Tables

### gallery
Stores generated furniture images.

| Column     | Type      | Description                    |
|------------|-----------|--------------------------------|
| id         | UUID      | Primary key                    |
| url        | TEXT      | URL of generated image         |
| prompt     | TEXT      | Prompt used for generation     |
| source_url | TEXT      | URL of source image            |
| created_at | TIMESTAMP | Creation timestamp             |
| updated_at | TIMESTAMP | Last update timestamp          |

### videos
Stores generated furniture videos.

| Column     | Type      | Description                    |
|------------|-----------|--------------------------------|
| id         | UUID      | Primary key                    |
| url        | TEXT      | URL of generated video         |
| prompt     | TEXT      | Prompt used for generation     |
| source_url | TEXT      | URL of source image            |
| created_at | TIMESTAMP | Creation timestamp             |
| updated_at | TIMESTAMP | Last update timestamp          |

## Security

The schema includes Row Level Security (RLS) policies. For v1, public access is enabled for all operations since authentication is optional. When implementing authentication in future versions, update the RLS policies accordingly.
