# Decor Design

An AI-powered platform for furniture sellers and designers to create high-quality product visuals and videos.

## Features

- **Image Generation**: Create realistic furniture visuals using Google's Nano Banana model
- **Video Generation**: Generate product showcase videos using OpenAI's Sora2 model
- **Gallery**: Store and manage all your generated content
- **Prompt Templates**: Quick-start templates for common furniture scenes
- **Real-time Progress**: Live progress tracking during generation

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: Supabase
- **AI APIs**: Fal.ai (Nano Banana & Sora2)

## Project Structure

```
DecorDesign/
├── frontend/          # React application
├── backend/           # Node.js API server
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Fal.ai API key

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
4. Configure environment variables (see `.env.example` in each folder)
5. Start the development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Environment Variables

### Backend (.env)
```
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FAL_API_KEY=your_fal_api_key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## API Endpoints

- `POST /api/generate-image` - Generate furniture image
- `POST /api/generate-video` - Generate furniture video
- `GET /api/gallery` - Get all generated images
- `GET /api/videos` - Get all generated videos
- `DELETE /api/gallery/:id` - Delete an image
- `DELETE /api/videos/:id` - Delete a video

## License

MIT
