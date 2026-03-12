"use client";

import { useState, useTransition } from "react";
import type { CatalogType, UserState } from "@/lib/types";

interface LibraryControlsProps {
  mediaType: CatalogType;
  sourceId: string;
  initialState: UserState;
}

export function LibraryControls({ mediaType, sourceId, initialState }: LibraryControlsProps) {
  const [userState, setUserState] = useState(initialState);
  const [score, setScore] = useState(String(initialState.personalRating?.score ?? ""));
  const [note, setNote] = useState(initialState.personalRating?.note ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const mutate = async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/library", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = (await response.json()) as { userState?: UserState; error?: string };

    if (!response.ok || !data.userState) {
      throw new Error(data.error ?? "Unable to save.");
    }

    setUserState(data.userState);
    return data.userState;
  };

  const updateEntry = (next: Partial<UserState>) => {
    startTransition(async () => {
      try {
        const latest = await mutate({
          kind: "entry",
          mediaType,
          sourceId,
          watchlist: next.isInWatchlist ?? userState.isInWatchlist,
          watched: next.isWatched ?? userState.isWatched
        });
        setMessage(latest.isWatched ? "Saved to watched list." : "List updated.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to update list.");
      }
    });
  };

  const submitRating = () => {
    startTransition(async () => {
      try {
        const numericScore = score.trim() ? Number(score) : null;
        const latest = await mutate({
          kind: "rating",
          mediaType,
          sourceId,
          score: numericScore,
          note
        });
        setScore(latest.personalRating?.score ? String(latest.personalRating.score) : "");
        setNote(latest.personalRating?.note ?? "");
        setMessage(latest.personalRating ? "Personal rating saved." : "Personal rating removed.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to save rating.");
      }
    });
  };

  return (
    <section className="detail-sidebar stack">
      <div>
        <h2>Your tracking</h2>
        <p className="supporting-copy">Guest progress is stored in the database with a browser cookie identity.</p>
      </div>
      <div className="row">
        <button
          className="button"
          disabled={isPending}
          onClick={() => updateEntry({ isInWatchlist: !userState.isInWatchlist })}
        >
          {userState.isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
        </button>
        <button
          className="button-secondary"
          disabled={isPending}
          onClick={() => updateEntry({ isWatched: !userState.isWatched })}
        >
          {userState.isWatched ? "Mark unwatched" : "Mark watched"}
        </button>
      </div>
      <div className="stack">
        <label htmlFor="score">Personal rating (1-10)</label>
        <input
          id="score"
          className="input"
          inputMode="numeric"
          max={10}
          min={1}
          value={score}
          onChange={(event) => setScore(event.target.value)}
          placeholder="8"
        />
        <label htmlFor="note">Personal note</label>
        <textarea
          id="note"
          className="textarea"
          rows={5}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What stood out, what worked, what didn't..."
        />
        <div className="row">
          <button className="button" disabled={isPending} onClick={submitRating}>
            Save rating
          </button>
          <button
            className="button-secondary"
            disabled={isPending}
            onClick={() => {
              setScore("");
              setNote("");
              startTransition(async () => {
                try {
                  await mutate({
                    kind: "rating",
                    mediaType,
                    sourceId,
                    score: null,
                    note: null
                  });
                  setMessage("Personal rating removed.");
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Unable to remove rating.");
                }
              });
            }}
          >
            Clear rating
          </button>
        </div>
      </div>
      <div className="stack">
        <span className={userState.isWatched ? "status-ok" : "muted"}>
          {userState.isWatched ? "Watched" : "Not watched yet"}
        </span>
        <span className={userState.isInWatchlist ? "status-ok" : "muted"}>
          {userState.isInWatchlist ? "In watchlist" : "Not in watchlist"}
        </span>
        {message ? <p>{message}</p> : null}
      </div>
    </section>
  );
}