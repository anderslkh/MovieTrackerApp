import Link from "next/link";
import { prisma } from "@/lib/db";
import { getOrCreateGuestProfile } from "@/lib/identity";
import { formatDate } from "@/lib/utils";

export default async function MyListPage() {
  const user = await getOrCreateGuestProfile();

  const [entries, ratings] = await Promise.all([
    prisma.userTitleEntry.findMany({
      where: {
        userProfileId: user.id,
        OR: [{ isInWatchlist: true }, { isWatched: true }]
      },
      include: { title: true },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.userRating.findMany({
      where: {
        userProfileId: user.id
      },
      include: { title: true },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  const watchlist = entries.filter((entry) => entry.isInWatchlist);
  const watched = entries.filter((entry) => entry.isWatched);

  return (
    <div className="list-layout">
      <section className="hero">
        <h1>My list</h1>
        <p className="supporting-copy">
          Your guest profile keeps watchlist progress and personal ratings in the database.
        </p>
      </section>

      <div className="list-grid">
        <section className="list-panel">
          <h2>Watchlist</h2>
          <div className="list-section">
            {watchlist.length ? (
              watchlist.map((entry) => (
                <Link key={entry.id} href={`/title/${entry.title.mediaType.toLowerCase()}/${entry.title.sourceId}`}>
                  <div className="rating-chip">
                    <span>{entry.title.title}</span>
                    <span className="muted">{formatDate(entry.title.releaseDate)}</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="muted">No watchlist items yet.</p>
            )}
          </div>
        </section>

        <section className="list-panel">
          <h2>Watched</h2>
          <div className="list-section">
            {watched.length ? (
              watched.map((entry) => (
                <Link key={entry.id} href={`/title/${entry.title.mediaType.toLowerCase()}/${entry.title.sourceId}`}>
                  <div className="rating-chip">
                    <span>{entry.title.title}</span>
                    <span className="muted">{entry.watchedAt ? formatDate(entry.watchedAt) : "Watched"}</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="muted">No watched titles yet.</p>
            )}
          </div>
        </section>

        <section className="list-panel">
          <h2>Personal ratings</h2>
          <div className="list-section">
            {ratings.length ? (
              ratings.map((rating) => (
                <Link key={rating.id} href={`/title/${rating.title.mediaType.toLowerCase()}/${rating.title.sourceId}`}>
                  <div className="rating-chip">
                    <span>
                      {rating.title.title} ({rating.score}/10)
                    </span>
                    <span className="muted">{rating.note ? "Has note" : "Score only"}</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="muted">No personal ratings yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}