import { NextResponse } from "next/server";
import { ensureStoredTitle, getTitleDetail, getUserState } from "@/lib/catalog";
import { getOrCreateGuestProfile } from "@/lib/identity";
import type { CatalogType } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mediaType = searchParams.get("mediaType") as CatalogType | null;
  const sourceId = searchParams.get("sourceId");

  if (!mediaType || !sourceId) {
    return NextResponse.json({ error: "mediaType and sourceId are required." }, { status: 400 });
  }

  try {
    const [detail, user] = await Promise.all([
      getTitleDetail(mediaType, sourceId),
      getOrCreateGuestProfile()
    ]);
    const title = await ensureStoredTitle(detail);
    const userState = await getUserState(user.id, title.id);
    return NextResponse.json({ detail, userState });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load title."
      },
      { status: 500 }
    );
  }
}