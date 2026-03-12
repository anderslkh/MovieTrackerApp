import { z } from "zod";
import { prisma } from "@/lib/db";
import { ensureStoredTitle, getTitleDetail, getUserState } from "@/lib/catalog";
import { getOrCreateGuestProfile } from "@/lib/identity";
import type { CatalogType } from "@/lib/types";

const listSchema = z.object({
  mediaType: z.enum(["movie", "tv", "anime"]),
  sourceId: z.string().min(1),
  watchlist: z.boolean().optional(),
  watched: z.boolean().optional()
});

const ratingSchema = z.object({
  mediaType: z.enum(["movie", "tv", "anime"]),
  sourceId: z.string().min(1),
  score: z.number().int().min(1).max(10).nullable(),
  note: z.string().trim().max(1200).optional().nullable()
});

async function getTrackedTitle(mediaType: CatalogType, sourceId: string) {
  const detail = await getTitleDetail(mediaType, sourceId);
  return ensureStoredTitle(detail);
}

export async function updateListState(input: unknown) {
  const payload = listSchema.parse(input);
  const [user, title] = await Promise.all([
    getOrCreateGuestProfile(),
    getTrackedTitle(payload.mediaType, payload.sourceId)
  ]);

  const nextWatchlist = payload.watchlist ?? false;
  const nextWatched = payload.watched ?? false;

  await prisma.userTitleEntry.upsert({
    where: {
      userProfileId_titleId: {
        userProfileId: user.id,
        titleId: title.id
      }
    },
    update: {
      isInWatchlist: nextWatchlist,
      isWatched: nextWatched,
      watchedAt: nextWatched ? new Date() : null
    },
    create: {
      userProfileId: user.id,
      titleId: title.id,
      isInWatchlist: nextWatchlist,
      isWatched: nextWatched,
      watchedAt: nextWatched ? new Date() : null
    }
  });

  return getUserState(user.id, title.id);
}

export async function updatePersonalRating(input: unknown) {
  const payload = ratingSchema.parse(input);
  const [user, title] = await Promise.all([
    getOrCreateGuestProfile(),
    getTrackedTitle(payload.mediaType, payload.sourceId)
  ]);

  if (payload.score === null) {
    await prisma.userRating.deleteMany({
      where: {
        userProfileId: user.id,
        titleId: title.id
      }
    });
  } else {
    await prisma.userRating.upsert({
      where: {
        userProfileId_titleId: {
          userProfileId: user.id,
          titleId: title.id
        }
      },
      update: {
        score: payload.score,
        note: payload.note?.trim() || null
      },
      create: {
        userProfileId: user.id,
        titleId: title.id,
        score: payload.score,
        note: payload.note?.trim() || null
      }
    });
  }

  return getUserState(user.id, title.id);
}