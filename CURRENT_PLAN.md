# Movie Tracker MVP Plan

## Summary

Build a greenfield `Next.js` full-stack app for `Movies + TV + Anime` with a `Postgres + Prisma` backend. V1 focuses on guest-first personal tracking: search by title, view rich title details, save to watchlist, mark watched, and add a personal numeric rating plus optional written note. Design the data model and app boundaries so real auth (`OAuth` and/or custom accounts) can be added later without reworking core entities.

## Key Changes

- Use `Next.js` with React for UI, route handlers for server APIs, and Prisma for persistence.
- Split the product into `search/results`, `title detail`, and `my list`.
- Use one mainstream media API for `movies + TV` and one anime-specific API for `anime`.
- Normalize provider responses into one internal `Title` shape so UI and database logic stay provider-agnostic.
- Core entities:
  - `Title`
  - `ExternalSourceLink`
  - `UserProfile`
  - `UserTitleEntry`
  - `UserRating`
  - `ExternalRatingSnapshot`
- Public behavior:
  - Search endpoint returns normalized title cards by query string.
  - Title detail endpoint returns normalized metadata, provider ratings, and user-specific state.
  - Mutation endpoints support watchlist, watched state, and personal rating/note changes.
- UI behavior:
  - Search-first landing page with title-only search.
  - Detail page with metadata, external ratings, and personal actions.
  - My List page with `Watchlist`, `Watched`, and `Personal ratings`.
- Future-proofing:
  - Keep identity abstracted for later auth migration.
  - Leave room for richer statuses like `watching`, `dropped`, and `on-hold`.
  - Keep provider adapters isolated so more APIs can be added later.

## Test Plan

- Search returns mixed `movie`, `tv`, and `anime` results in one consistent shape.
- Title detail pages render normalized metadata and external ratings.
- Guest users can add/remove watchlist entries and mark titles watched/unwatched.
- Guest users can create, update, and delete a personal numeric rating and optional note.
- Duplicate saves or ratings for the same user/title pair are prevented or merged cleanly.
- Missing provider fields do not break the detail page.
- Anime and non-anime titles flow through the same UI and persistence model.
- Database constraints enforce one logical tracking record per user/title.

## Assumptions

- The repo started greenfield.
- V1 uses guest-first persistence with a schema ready for future auth.
- Search is title-only in v1.
- Personal ratings are private in v1.
- Written notes are attached to the user’s personal rating.
- Exact provider selection can evolve, but the architecture assumes `one general media source + one anime source`.
