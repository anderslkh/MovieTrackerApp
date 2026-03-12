import { MediaType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAnimeDetail, searchAnime } from "@/lib/providers/jikan";
import { getTmdbDetail, searchTmdb } from "@/lib/providers/tmdb";
import type { CatalogType, SearchResultItem, TitleDetail, UserState } from "@/lib/types";

function mapMediaType(mediaType: CatalogType) {
  switch (mediaType) {
    case "movie":
      return MediaType.MOVIE;
    case "tv":
      return MediaType.TV;
    case "anime":
      return MediaType.ANIME;
  }
}

function toDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function titleUpsertPayload(detail: TitleDetail): Prisma.TitleUncheckedCreateInput {
  return {
    source: detail.source,
    sourceId: detail.sourceId,
    mediaType: mapMediaType(detail.mediaType),
    title: detail.title,
    originalTitle: detail.originalTitle,
    synopsis: detail.synopsis,
    releaseDate: toDate(detail.releaseDate),
    posterUrl: detail.posterUrl,
    backdropUrl: detail.backdropUrl,
    runtimeMinutes: detail.runtimeMinutes,
    seasons: detail.seasons,
    episodes: detail.episodes,
    status: detail.status
  };
}

export async function searchCatalog(query: string): Promise<SearchResultItem[]> {
  const [general, anime] = await Promise.all([searchTmdb(query), searchAnime(query)]);

  return [...general, ...anime].sort((left, right) => {
    const leftDate = left.releaseDate ? new Date(left.releaseDate).getTime() : 0;
    const rightDate = right.releaseDate ? new Date(right.releaseDate).getTime() : 0;
    return rightDate - leftDate;
  });
}

export async function getTitleDetail(mediaType: CatalogType, sourceId: string): Promise<TitleDetail> {
  if (mediaType === "anime") {
    return getAnimeDetail(sourceId);
  }

  return getTmdbDetail(mediaType, sourceId);
}

export async function ensureStoredTitle(detail: TitleDetail) {
  const title = await prisma.title.upsert({
    where: {
      source_sourceId: {
        source: detail.source,
        sourceId: detail.sourceId
      }
    },
    update: titleUpsertPayload(detail),
    create: titleUpsertPayload(detail)
  });

  await prisma.externalSourceLink.upsert({
    where: {
      provider_providerId: {
        provider: detail.source,
        providerId: detail.sourceId
      }
    },
    update: {
      titleId: title.id
    },
    create: {
      titleId: title.id,
      provider: detail.source,
      providerId: detail.sourceId
    }
  });

  await prisma.externalRatingSnapshot.deleteMany({
    where: { titleId: title.id }
  });

  if (detail.externalRatings.length) {
    await prisma.externalRatingSnapshot.createMany({
      data: detail.externalRatings.map((rating) => ({
        titleId: title.id,
        sourceName: rating.sourceName,
        value: rating.value,
        scale: rating.scale,
        votes: rating.votes,
        url: rating.url
      }))
    });
  }

  return title;
}

export async function getUserState(userProfileId: string, titleId: string): Promise<UserState> {
  const [entry, rating] = await Promise.all([
    prisma.userTitleEntry.findUnique({
      where: {
        userProfileId_titleId: {
          userProfileId,
          titleId
        }
      }
    }),
    prisma.userRating.findUnique({
      where: {
        userProfileId_titleId: {
          userProfileId,
          titleId
        }
      }
    })
  ]);

  return {
    isInWatchlist: entry?.isInWatchlist ?? false,
    isWatched: entry?.isWatched ?? false,
    watchedAt: entry?.watchedAt?.toISOString() ?? null,
    personalRating: rating
      ? {
          score: rating.score,
          note: rating.note
        }
      : null
  };
}