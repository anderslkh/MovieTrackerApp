import { notFound } from "next/navigation";
import { ensureStoredTitle, getTitleDetail, getUserState } from "@/lib/catalog";
import { getOrCreateGuestProfile } from "@/lib/identity";
import type { CatalogType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { LibraryControls } from "@/components/library-controls";

interface TitlePageProps {
  params: Promise<{
    mediaType: CatalogType;
    sourceId: string;
  }>;
}

export default async function TitlePage({ params }: TitlePageProps) {
  const { mediaType, sourceId } = await params;

  if (!["movie", "tv", "anime"].includes(mediaType)) {
    notFound();
  }

  const [detail, user] = await Promise.all([getTitleDetail(mediaType, sourceId), getOrCreateGuestProfile()]);
  const title = await ensureStoredTitle(detail);
  const userState = await getUserState(user.id, title.id);

  return (
    <div className="detail-shell">
      <section className="detail-main">
        <div
          className="hero-backdrop"
          style={{
            backgroundImage: detail.backdropUrl ? `url(${detail.backdropUrl})` : undefined
          }}
        >
          <div className="hero-backdrop-content">
            <div className="stack">
              <div className="tag-row">
                <span className="tag">{detail.mediaType.toUpperCase()}</span>
                <span className="tag">{detail.source.toUpperCase()}</span>
              </div>
              <h1>{detail.title}</h1>
              <p className="meta-row">
                Released: {formatDate(detail.releaseDate)} | Status: {detail.status ?? "Unknown"}
              </p>
            </div>
          </div>
        </div>

        <section className="section-card" style={{ padding: 24 }}>
          <div className="stack">
            <h2>Overview</h2>
            <p>{detail.synopsis ?? "No synopsis available yet."}</p>
            <div className="tag-row">
              {detail.runtimeMinutes ? <span className="tag">{detail.runtimeMinutes} min</span> : null}
              {detail.seasons ? <span className="tag">{detail.seasons} seasons</span> : null}
              {detail.episodes ? <span className="tag">{detail.episodes} episodes</span> : null}
              {detail.originalTitle ? <span className="tag">Original: {detail.originalTitle}</span> : null}
            </div>
          </div>
        </section>

        <section className="section-card" style={{ padding: 24 }}>
          <div className="stack">
            <h2>External ratings</h2>
            <div className="ratings-list">
              {detail.externalRatings.length ? (
                detail.externalRatings.map((rating) => (
                  <div className="rating-chip" key={`${rating.sourceName}-${rating.value}`}>
                    <span>{rating.sourceName}</span>
                    <span>
                      {rating.value}
                      {rating.scale ?? ""}
                    </span>
                  </div>
                ))
              ) : (
                <p className="muted">No external ratings were returned for this title.</p>
              )}
            </div>
          </div>
        </section>

        <section className="section-card" style={{ padding: 24 }}>
          <div className="stack">
            <h2>Cast</h2>
            <div className="cast-list">
              {detail.cast.length ? (
                detail.cast.map((member) => (
                  <div className="cast-chip" key={member.id}>
                    <span>{member.name}</span>
                    <span className="muted">{member.role ?? "Cast"}</span>
                  </div>
                ))
              ) : (
                <p className="muted">Cast data is not available for this provider yet.</p>
              )}
            </div>
          </div>
        </section>
      </section>

      <LibraryControls mediaType={mediaType} sourceId={sourceId} initialState={userState} />
    </div>
  );
}