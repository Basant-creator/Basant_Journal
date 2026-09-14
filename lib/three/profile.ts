/**
 * When the scene was asked for, and when it arrived.
 *
 * §38 wants scene load time and asset load time on a development overlay, and
 * neither can be measured from inside the renderer: by the time there is a
 * renderer to ask, the chunk has already been fetched and evaluated. The two
 * interesting moments happen either side of that, so they are marked where
 * they happen and read later.
 *
 *   request  ThreeScene decided to mount the scene. `next/dynamic` starts
 *            fetching 880kB of renderer at this instant.
 *   created  the WebGLRenderer exists. request -> created is the chunk: the
 *            network, the parse, and the module evaluation.
 *   drawn    the first frame is on screen. created -> drawn is the scene
 *            building itself — every texture drawn onto its canvas, every
 *            geometry built, every shader compiled.
 *
 * Development only. NODE_ENV is a constant at build time, so the bodies fold
 * away and the calls go with them.
 */

const DEV = process.env.NODE_ENV !== "production";

export type SceneMark = "request" | "created" | "drawn";

export interface SceneTimings {
  request: number | null;
  created: number | null;
  drawn: number | null;
  /** request -> created: fetching and evaluating the renderer chunk. */
  asset: number | null;
  /** request -> drawn: everything, from the decision to the first frame. */
  scene: number | null;
}

const marks: Record<SceneMark, number | null> = { request: null, created: null, drawn: null };

export function markScene(mark: SceneMark): void {
  if (!DEV || typeof performance === "undefined") return;

  /*
    A second visit is a second measurement, not an addition to the first, so
    "request" clears what came before it. Without this the overlay would show
    the first visit's numbers for the rest of the session and look stable
    while being wrong.
  */
  if (mark === "request") {
    marks.created = null;
    marks.drawn = null;
  }

  marks[mark] = performance.now();
}

export function sceneTimings(): SceneTimings {
  const { request, created, drawn } = marks;
  return {
    request,
    created,
    drawn,
    asset: request !== null && created !== null ? created - request : null,
    scene: request !== null && drawn !== null ? drawn - request : null,
  };
}
