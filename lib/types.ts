export type CatalogType = "movie" | "tv" | "anime";
export type ExternalSource = "tmdb" | "jikan";

export interface ExternalRating {
  sourceName: string;
  value: string;
  scale?: string;
  votes?: number;
  url?: string;
}

export interface CastMember {
  id: string;
  name: string;
  role?: string;
}

export interface SearchResultItem {
  source: ExternalSource;
  sourceId: string;
  mediaType: CatalogType;
  title: string;
  originalTitle?: string;
  synopsis?: string;
  releaseDate?: string;
  posterUrl?: string;
}

export interface TitleDetail extends SearchResultItem {
  backdropUrl?: string;
  runtimeMinutes?: number;
  seasons?: number;
  episodes?: number;
  status?: string;
  cast: CastMember[];
  externalRatings: ExternalRating[];
}

export interface UserState {
  isInWatchlist: boolean;
  isWatched: boolean;
  watchedAt?: string | null;
  personalRating?: {
    score: number;
    note?: string | null;
  } | null;
}
