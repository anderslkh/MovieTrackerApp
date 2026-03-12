import { getEnv } from "@/lib/env";
import type { ExternalRating, SearchResultItem, TitleDetail } from "@/lib/types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";

interface TmdbSearchItem {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string;
}

interface TmdbCredit {
  id: number;
  name: string;
  character?: string;
}

interface TmdbDetail {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string;
  backdrop_path?: string;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  vote_average?: number;
  vote_count?: number;
  imdb_id?: string;
  credits?: {
    cast?: TmdbCredit[];
  };
}

async function tmdbFetch<T>(path: string, searchParams?: Record<string, string>) {
  const { TMDB_API_KEY } = getEnv();

  if (!TMDB_API_KEY) {
    throw new Error("TMDB_API_KEY is not configured.");
  }

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

function mapSearchItem(item: TmdbSearchItem): SearchResultItem | null {
  if (item.media_type === "person") {
    return null;
  }

  return {
    source: "tmdb",
    sourceId: String(item.id),
    mediaType: item.media_type,
    title: item.title ?? item.name ?? "Untitled",
    originalTitle: item.original_title ?? item.original_name,
    synopsis: item.overview,
    releaseDate: item.release_date ?? item.first_air_date,
    posterUrl: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : undefined
  };
}

async function fetchOmdbRatings(imdbId: string): Promise<ExternalRating[]> {
  const { OMDB_API_KEY } = getEnv();

  if (!OMDB_API_KEY) {
    return [];
  }

  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", OMDB_API_KEY);
  url.searchParams.set("i", imdbId);

  const response = await fetch(url, {
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as {
    imdbRating?: string;
    imdbVotes?: string;
    Ratings?: Array<{ Source: string; Value: string }>;
    imdbID?: string;
  };

  const ratings: ExternalRating[] = [];

  if (payload.imdbRating && payload.imdbRating !== "N/A") {
    ratings.push({
      sourceName: "IMDb",
      value: payload.imdbRating,
      scale: "/10",
      votes: payload.imdbVotes ? Number(payload.imdbVotes.replaceAll(",", "")) : undefined,
      url: payload.imdbID ? `https://www.imdb.com/title/${payload.imdbID}/` : undefined
    });
  }

  for (const rating of payload.Ratings ?? []) {
    if (rating.Source !== "Internet Movie Database") {
      ratings.push({
        sourceName: rating.Source,
        value: rating.Value
      });
    }
  }

  return ratings;
}

export async function searchTmdb(query: string) {
  const payload = await tmdbFetch<{ results: TmdbSearchItem[] }>("/search/multi", {
    query
  });

  return payload.results
    .map(mapSearchItem)
    .filter((item): item is SearchResultItem => Boolean(item));
}

export async function getTmdbDetail(mediaType: "movie" | "tv", sourceId: string): Promise<TitleDetail> {
  const payload = await tmdbFetch<TmdbDetail>(`/${mediaType}/${sourceId}`, {
    append_to_response: "credits,external_ids"
  });

  const ratings: ExternalRating[] = [];

  if (payload.vote_average) {
    ratings.push({
      sourceName: "TMDB",
      value: payload.vote_average.toFixed(1),
      scale: "/10",
      votes: payload.vote_count
    });
  }

  if (payload.imdb_id) {
    ratings.push(...(await fetchOmdbRatings(payload.imdb_id)));
  }

  return {
    source: "tmdb",
    sourceId,
    mediaType,
    title: payload.title ?? payload.name ?? "Untitled",
    originalTitle: payload.original_title ?? payload.original_name,
    synopsis: payload.overview,
    releaseDate: payload.release_date ?? payload.first_air_date,
    posterUrl: payload.poster_path ? `${TMDB_IMAGE}${payload.poster_path}` : undefined,
    backdropUrl: payload.backdrop_path ? `${TMDB_IMAGE}${payload.backdrop_path}` : undefined,
    runtimeMinutes: payload.runtime,
    seasons: payload.number_of_seasons,
    episodes: payload.number_of_episodes,
    status: payload.status,
    cast:
      payload.credits?.cast?.slice(0, 8).map((member) => ({
        id: String(member.id),
        name: member.name,
        role: member.character
      })) ?? [],
    externalRatings: ratings
  };
}