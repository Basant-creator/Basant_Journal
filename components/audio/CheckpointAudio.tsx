"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { setMusic } from "@/lib/audio/atmosphere";
import type { MusicState } from "@/lib/audio/music";
import { checkpointFor } from "@/lib/world/trail";

/**
 * What each place on the trail sounds like.
 *
 * §39, and it is an arc rather than a lookup table: the world gets quieter
 * the further along it the visitor walks, the same instruction §24 gives the
 * light. Sparse at the survey, reflective at the fire, nothing at all inside
 * the book — where the paper is the subject and a guitar over it would be
 * scoring somebody's reading — a little air again when they step back
 * outside at the Board, and then down to the wind.
 *
 * "silence" is not the absence of sound. The wind bed belongs to the
 * territory and plays wherever the atmosphere is switched on; this is only
 * the music, so a silent checkpoint is a place with weather and no score.
 */
const SOUND: Record<string, MusicState> = {
  frontier: "sparse",
  camp: "reflective",
  records: "silence",
  board: "reflective",
  archive: "silence",
  "trail-end": "silence",
};

/**
 * One owner for the music, everywhere except the landing.
 *
 * It is mounted in the root layout, which is the whole point: the previous
 * arrangement had each place set its own state on mount and reset it to
 * silence on unmount, and two places doing that across a route change race
 * each other — the outgoing Camp's cleanup runs after the incoming page's
 * effect, so arriving anywhere from Camp silenced the destination. That is
 * the same class of bug the transition system was built to end, one layer
 * down, and the fix is the same: one component that owns the decision, above
 * the router, reacting to where the visitor is rather than to what mounted.
 *
 * The landing is the deliberate exception. It has a *progression* rather than
 * a state — environment, then a phrase at fourteen seconds, then more at
 * forty-six — and stepping through it is LandingAudio's job. This never
 * touches `/`.
 *
 * Camp keeps `setNearFire`, because a fire is a fact about a place rather
 * than a musical decision, and the place is the only thing that knows it has
 * one.
 *
 * Safe with the sound switched off, which is how it almost always is:
 * `setMusic` records the state and starts nothing.
 */
export function CheckpointAudio() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") return;

    const checkpoint = checkpointFor(pathname);
    /* Off the trail — the professional view, the lab. A recruiter reading a
       résumé is not in a scene. */
    setMusic(checkpoint ? SOUND[checkpoint.id] ?? "silence" : "silence");
  }, [pathname]);

  return null;
}
