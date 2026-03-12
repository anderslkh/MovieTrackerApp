import { SearchExperience } from "@/components/search-experience";

export default function HomePage() {
  return (
    <div className="stack">
      <section className="hero">
        <div className="stack">
          <div className="tag-row">
            <span className="tag">Movies</span>
            <span className="tag">TV</span>
            <span className="tag">Anime</span>
          </div>
          <h1>Build your own catalog habit around real media APIs.</h1>
          <p className="supporting-copy">
            Search live metadata, inspect cast and release info, compare external ratings, and keep a personal
            watchlist with your own notes.
          </p>
        </div>
      </section>
      <SearchExperience />
    </div>
  );
}