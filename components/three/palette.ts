/**
 * THE SCENE's colours, in a form a renderer can use.
 *
 * These are the same values as the `--scene-*` and `--fire-*` tokens in
 * `design/tokens.css`, restated rather than referenced, because a material
 * cannot read a CSS custom property: by the time a colour reaches the GPU it
 * is a number, and there is no cascade out there.
 *
 * That makes this the one duplicated list in the project, so it is kept
 * deliberately short and it names its source. If a depth band changes in the
 * tokens it has to change here, and the comment beside it is the only thing
 * that will say so.
 */
export const scene = {
  /** The ground the renderer clears to, and the fog it fades into. */
  night: "#0d0b09",
  /** Six depth bands, furthest to nearest — the 3D reading of --scene-depth-N. */
  depth: ["#241e18", "#1a1511", "#14100c", "#120e0b", "#0e0b08", "#0a0806"],
  ground: "#171209",
} as const;

export const fire = {
  core: "#e8b070",
  body: "#c4703a",
  ember: "#a6512f",
  log: "#2a1d13",
} as const;

export const camp = {
  timber: "#241a11",
  canvas: "#17120d",
  paper: "#d8c7a5",
} as const;

/**
 * Dusk, as two lights and no sun.
 *
 * The warm key sits low and behind the ridges — the light that has already
 * gone — and the cool fill is the sky doing the rest. Naming them here keeps
 * the lighting rig readable as an intention rather than as four hex codes.
 */
export const light = {
  key: "#d89a5e",
  fill: "#6b7688",
  bounce: "#3c3126",
} as const;
