"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { SearchResultItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface SearchExperienceProps {
  initialQuery?: string;
}

export function SearchExperience({ initialQuery = "" }: SearchExperienceProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!initialQuery) {
      return;
    }

    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      startTransition(async () => {
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
            signal: controller.signal
          });
          const payload = (await response.json()) as { items?: SearchResultItem[]; error?: string };

          if (!response.ok) {
            throw new Error(payload.error ?? "Search failed.");
          }

          setResults(payload.items ?? []);
          setError(null);
        } catch (caughtError) {
          if (controller.signal.aborted) {
            return;
          }

          setError(caughtError instanceof Error ? caughtError.message : "Search failed.");
        }
      });
    }, 320);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  return (
    <div className="search-layout">
      <section className="section-card" style={{ padding: 24 }}>
        <div className="stack">
          <div>
            <h2>Search the catalog</h2>
            <p className="supporting-copy">
              Find movies, TV, and anime from live integrations, then save them to your personal list.
            </p>
          </div>
          <input
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for Dune, Arcane, Fullmetal Alchemist..."
          />
          {isPending ? <p className="muted">Searching...</p> : null}
          {error ? <p>{error}</p> : null}
          <div className="results-grid">
            {results.map((item) => (
              <article key={`${item.source}-${item.sourceId}`} className="result-card">
                {item.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={item.title} className="poster" src={item.posterUrl} />
                ) : (
                  <div className="poster-placeholder" />
                )}
                <div className="stack">
                  <div>
                    <div className="tag-row">
                      <span className="tag">{item.mediaType.toUpperCase()}</span>
                      <span className="tag">{item.source.toUpperCase()}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p className="meta-row">Released: {formatDate(item.releaseDate)}</p>
                    <p className="supporting-copy">{item.synopsis ?? "No synopsis available."}</p>
                  </div>
                  <div className="row">
                    <Link href={`/title/${item.mediaType}/${item.sourceId}`} className="button">
                      Open details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
            {!results.length && query.trim() && !isPending && !error ? (
              <div className="empty-state">
                <h3>No matches yet</h3>
                <p className="supporting-copy">Try a broader title or alternate spelling.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      <aside className="section-card" style={{ padding: 24 }}>
        <div className="stack">
          <h2>What this MVP includes</h2>
          <div className="tag-row">
            <span className="tag">Guest profiles</span>
            <span className="tag">Watchlist</span>
            <span className="tag">Watched</span>
            <span className="tag">Personal notes</span>
          </div>
          <p className="supporting-copy">
            Search is title-only in this version. Filters, public ratings, and account upgrades can layer in later
            without replacing the core data model.
          </p>
          <Link href="/my-list" className="button-secondary">
            View my saved list
          </Link>
        </div>
      </aside>
    </div>
  );
}