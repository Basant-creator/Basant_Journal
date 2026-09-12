import { routes } from "@/lib/routes";
import { isMajorRoute } from "./chapters";

/**
 * What kind of move this is.
 *
 * Not every route change is the same event, and pretending otherwise is how a
 * site ends up putting a cinematic loading screen between a reader and the
 * next page of the thing they are already reading.
 */
export type TransitionType =
  | "LANDING_TO_WORLD"
  | "WORLD_TO_SCENE"
  | "WORLD_TO_PAPER"
  | "PAPER_TO_RECORD"
  | "RECORD_TO_RECORD"
  | "ANY_TO_PROFESSIONAL"
  /** Not a transition: same page, a fragment, or somewhere with no ceremony. */
  | "NONE";

export interface TransitionProfile {
  /** Show the Frontier mark while the destination is on its way. */
  loader: boolean;
  /** Show the destination's chapter once it has arrived. */
  chapter: boolean;
  /** How long the chapter holds, in milliseconds. */
  dwell: number;
}

/**
 * The profiles.
 *
 * Deliberately small numbers. The loader exists to give the site a
 * recognisable transition identity, not to make the visitor wait — the brief
 * is explicit, and it is right: the loader appears exactly when someone is
 * already waiting, so it must not be the reason they are.
 */
const PROFILES: Record<TransitionType, TransitionProfile> = {
  LANDING_TO_WORLD: { loader: true, chapter: true, dwell: 780 },
  WORLD_TO_SCENE: { loader: true, chapter: true, dwell: 620 },
  WORLD_TO_PAPER: { loader: true, chapter: true, dwell: 620 },
  /* Opening a document inside the journal is not leaving the journal. The
     record pulls forward; nothing covers the view. */
  PAPER_TO_RECORD: { loader: false, chapter: false, dwell: 0 },
  RECORD_TO_RECORD: { loader: false, chapter: false, dwell: 0 },
  /* The recruiter path stays quick: a fade, no ceremony, no chapter. */
  ANY_TO_PROFESSIONAL: { loader: false, chapter: false, dwell: 0 },
  NONE: { loader: false, chapter: false, dwell: 0 },
};

const isRecord = (pathname: string) => pathname.startsWith(`${routes.projects}/`);

/**
 * Classify a move.
 *
 * `from` is null on a direct load or a refresh — there is no previous route,
 * which is itself information: §11 asks for a shorter treatment there, and the
 * controller gets it by knowing the origin is unknown rather than by guessing.
 */
export function transitionFor(from: string | null, to: string): TransitionType {
  if (from === to) return "NONE";
  if (to === routes.professional) return "ANY_TO_PROFESSIONAL";

  if (isRecord(to)) {
    // Journal → record, and record → record. Neither is a new chapter.
    if (from && (isRecord(from) || from === routes.projects)) {
      return isRecord(from) ? "RECORD_TO_RECORD" : "PAPER_TO_RECORD";
    }
    // Arriving at a record from anywhere else — a direct link, the map — is
    // still opening a document rather than entering an act.
    return "PAPER_TO_RECORD";
  }

  if (!isMajorRoute(to)) return "NONE";
  if (from === routes.home) return "LANDING_TO_WORLD";
  if (to === routes.projects) return "WORLD_TO_PAPER";
  return "WORLD_TO_SCENE";
}

export function profileFor(type: TransitionType): TransitionProfile {
  return PROFILES[type];
}
