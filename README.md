# Wanderlist

A modern single-page web app that helps users discover things to do in any city. Search for a city and get curated results split into "Top 5 Things To Do" and "Hidden Gems."

## Features

- **City Search**: Enter any city name to discover attractions
- **Curated Results**: Results are split into top attractions and hidden gems
- **Recent Searches**: View and quickly re-search previously searched cities
- **Responsive Design**: Works beautifully on desktop and mobile
- **Persistent Storage**: All searches are saved to Supabase

## Tech Stack

- **Frontend**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Places API**: Geoapify
- **Icons**: Font Awesome
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Geoapify account (free tier works)

### 1. Clone and Install

```bash
cd wanderlist
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL from `supabase/schema.sql` to create the `searches` table
4. Go to Project Settings > API to get your URL and anon key

### 3. Get a Geoapify API Key

1. Sign up at [geoapify.com](https://www.geoapify.com/)
2. Create a new project and get your API key
3. The free tier includes 3,000 requests/day

### 4. Configure Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
GEOAPIFY_API_KEY=your_geoapify_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deploying to Vercel

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add the three environment variables in the Vercel project settings
4. Deploy!

## Project Structure

```
wanderlist/
├── app/
│   ├── api/
│   │   ├── places/route.ts    # Geoapify integration
│   │   └── searches/route.ts  # Recent searches endpoint
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page component
├── components/
│   ├── EmptyState.tsx         # Before any search
│   ├── ErrorState.tsx         # API error display
│   ├── LoadingState.tsx       # Loading skeleton
│   ├── PlaceCard.tsx          # Individual place card
│   ├── RecentSearches.tsx     # Recent searches section
│   └── SearchForm.tsx         # City search input
├── lib/
│   ├── database.types.ts      # TypeScript types
│   └── supabase.ts            # Supabase client
└── supabase/
    └── schema.sql             # Database schema
```

## API Endpoints

### POST /api/places

Search for places in a city.

**Request body:**
```json
{
  "city": "Paris"
}
```

**Response:**
```json
{
  "city": "Paris",
  "topResults": [...],
  "hiddenGems": [...]
}
```

### GET /api/searches

Fetch recent searches.

**Response:**
```json
{
  "searches": [
    {
      "id": "uuid",
      "city": "Paris",
      "searched_at": "2024-01-15T12:00:00Z",
      "top_results_json": [...],
      "hidden_gems_json": [...]
    }
  ]
}
```

## License

MIT
