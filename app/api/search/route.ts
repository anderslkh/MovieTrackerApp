import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ items: [] });
  }

  try {
    const items = await searchCatalog(query);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Search failed."
      },
      { status: 500 }
    );
  }
}