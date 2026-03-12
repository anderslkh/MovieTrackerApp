import { NextResponse } from "next/server";
import { updateListState, updatePersonalRating } from "@/lib/actions";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (payload.kind === "entry") {
      const userState = await updateListState(payload);
      return NextResponse.json({ userState });
    }

    if (payload.kind === "rating") {
      const userState = await updatePersonalRating(payload);
      return NextResponse.json({ userState });
    }

    return NextResponse.json({ error: "Unsupported mutation kind." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Mutation failed."
      },
      { status: 500 }
    );
  }
}