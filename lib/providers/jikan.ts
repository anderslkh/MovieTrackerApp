import type { SearchResultItem, TitleDetail } from "@/lib/types";

interface JikanImage {
  jpg?: {
    image_url?: string;
    large_image_url?: string;
  };
}

interface JikanItem {
  mal_id: number;
  title: string;
  title_english?: string;
  synopsis?: string;
  aired?: {
    from?: string;
  };
  images?: JikanImage;
  score?: number;
  scored_by?: number;
  status?: string;
  episodes?: number;
  duration?: string;
  url?: string;
}

async function jikanFetch<T>(path: string, searchParams?: Record<string, string>) {
  const url = new URL(`https://api.jikan.moe/v4${path}`);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error(`Jikan request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

function parseRuntime(duration?: string) {
  if (!duration) {
    return undefined;
  }

  const hours = duration.match(/(\d+)\s*hr/i);
  const minutes = duration.match(/(\d+)\s*min/i);
  return (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0) || undefined;
}

export async function searchAnime(query: string): Promise<SearchResultItem[]> {
  const payload = await jikanFetch<{ data: JikanItem[] }>("/anime", {
    q: query,
    limit: "10"
  });

  return payload.data.map((item) => ({
    source: "jikan",
    sourceId: String(item.mal_id),
    mediaType: "anime",
    title: item.title_english ?? item.title,
    originalTitle: item.title,
    synopsis: item.synopsis,
    releaseDate: item.aired?.from,
    posterUrl: item.images?.jpg?.large_image_url ?? item.images?.jpg?.image_url
  }));
}

export async function getAnimeDetail(sourceId: string): Promise<TitleDetail> {
  const payload = await jikanFetch<{
    data: JikanItem & {
      title_japanese?: string;
    };
  }>(`/anime/${sourceId}/full`);

  const anime = payload.data;

  return {
    source: "jikan",
    sourceId,
    mediaType: "anime",
    title: anime.title_english ?? anime.title,
    originalTitle: anime.title_japanese ?? anime.title,
    synopsis: anime.synopsis,
    releaseDate: anime.aired?.from,
    posterUrl: anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url,
    backdropUrl: anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url,
    runtimeMinutes: parseRuntime(anime.duration),
    episodes: anime.episodes,
    status: anime.status,
    cast: [],
    externalRatings: anime.score
      ? [
          {
            sourceName: "MyAnimeList",
            value: anime.score.toFixed(2),
            scale: "/10",
            votes: anime.scored_by,
            url: anime.url
          }
        ]
      : []
  };
}