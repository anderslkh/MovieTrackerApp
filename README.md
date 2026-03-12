# MovieTracker

MovieTracker is a `Next.js` full-stack MVP for looking up movies, TV shows, and anime. It uses live catalog integrations, a Prisma/Postgres data model, and a guest-profile flow for personal watchlists and ratings.

## Features

- Search movies and TV through TMDB and anime through Jikan
- View title details, cast, release information, and external ratings
- Persist a guest user's watchlist, watched state, and personal numeric rating with optional notes
- Structure the schema so real auth can be added later without replacing core tracking tables

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in:
   - `DATABASE_URL`
   - `TMDB_API_KEY`
   - `OMDB_API_KEY` (optional, used for IMDb/other OMDb-provided ratings)
3. Install dependencies with `npm install`.
4. Generate Prisma Client with `npm run prisma:generate`.
5. Create and apply your first migration:

```bash
npx prisma migrate dev --name init
```

6. Start the app:

```bash
npm run dev
```

## Notes

- Jikan is used without an API key for anime metadata.
- Letterboxd ratings are not included because there is no stable public API; the current external ratings pipeline is ready for more providers later.
