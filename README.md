# Word Chain Game

A word chain game where you battle an AI opponent. Each player must respond with a word starting with the last letter of the opponent's word.

## Prerequisites

- Python 3.10+
- Node.js 18+
- A Groq API key (https://console.groq.com)
- A Supabase project

## Environment Variables

Create a `.env` file in your backend directory:

GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

## Supabase Tables

Create the following tables in your Supabase project:

**Games**
- game_id (text, primary key)
- username (text)
- difficulty (text)
- final_score (int)
- rounds_completed (int)
- outcome (bool)
- timestamp (timestamptz, default now())

**Player Stats**
- username (text, primary key)
- total_games (int)
- best_score (int)
- average_score (float)
- total_wins (int)
- wins_by_difficulty (jsonb)
- current_streak (int)

## Running Locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000
Backend runs on http://localhost:8000

By default the frontend points to the deployed Render backend at https://word-chain-game-kappa.vercel.app/game. To use your local backend instead, create a `.env.local` file in the frontend directory:

NEXT_PUBLIC_API_URL=http://localhost:8000

When this file is absent the frontend falls back to the production Render URL
automatically. Do not commit `.env.local` to git.