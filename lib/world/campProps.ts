/**
 * What is in the camp, and where.
 *
 * Data, deliberately outside `components/three`: it decides composition, and
 * composition is a design question that should be legible without opening a
 * renderer. Nothing here imports three; the scene reads it and places what it
 * is told.
 *
 * The props themselves are baked out of the supplied packs by
 * `scripts/bake-camp-props.mjs` into one GLB of geometry with no materials —
 * see `docs/camp-assets.md` for what was taken, what was refused, and why.
 *
 * §5 asks for a hierarchy the eye can read, and the surest way to lose one is
 * to scatter objects evenly and hope. So placement is written by hand, in
 * metres, in three bands:
 *
 *   FOREGROUND  close to the table, where detail is paid for
 *   MIDGROUND   the working camp — supplies, storage, the second tent
 *   BACKGROUND  silhouettes that give the ground somewhere to go
 *
 * And §6 asks the place to look worked in rather than arranged. Every angle
 * below is a number somebody chose; none of them is zero, and none of them is
 * a multiple of another. A crate square to the world reads as a crate somebody
 * placed in a level editor.
 */

export type PropId =
  | "fireRing"
  | "barrel"
  | "bucket"
  | "crate"
  | "axe"
  | "leanTent"
  | "supplyCrate"
  | "caskSmall"
  | "sacks"
  | "wagonWheel"
  | "bale";

/** How much attention an object is worth, and therefore what it costs. */
export type PropBand = "foreground" | "midground" | "background";

/** Which material family the Camp dresses it in. §13: one world, one look. */
export type PropSurface = "timber" | "timberDark" | "canvas" | "rock" | "iron" | "sack";

export interface PropPlacement {
  id: PropId;
  band: PropBand;
  surface: PropSurface;
  /** Metres, in the Camp's own space. The table sits near [0, 0, 1.8]. */
  at: [number, number, number];
  /** Radians about Y. */
  turn: number;
  /** Uniform, applied to the baked metre-scale geometry. */
  scale?: number;
  /** Degrees of lean, x then z — nothing in a camp is plumb. */
  tilt?: [number, number];
  /**
   * The cheapest tier that still draws it. Everything is drawn on "high";
   * "medium" drops the decorative tail; "low" keeps only what the composition
   * would collapse without.
   */
  from?: "high" | "medium" | "low";
}

/**
 * The camp, laid out.
 *
 * Read this as a plan view, and read it against the frame rather than against
 * the world — which is the mistake this file made first time and which is
 * worth writing down, because it is invisible in code and obvious on screen.
 *
 * The camera *arrives* from [1.9, 3.6, 16.2] and that number is seductive: it
 * suggests a scene tens of metres wide. It is not where anybody looks from.
 * The camera comes to rest at [0.35, 1.62, 5.6] on a 36-degree lens, so at the
 * fire's depth the frame is about seven metres across and everything beyond
 * x = ±3.5 is outside it. The first pass put nine props between four and nine
 * metres out, which is to say it put them where no one would ever see them,
 * and the scene gained two thousand triangles and nothing else.
 *
 * So:
 *
 *   FOREGROUND  z from 0 to +2.2, x within ±2.6 — the fire's own light
 *   MIDGROUND   z from −1.2 to −3.4 — the working camp behind it
 *   BACKGROUND  z from −6 to −10, where the frame widens to about thirteen
 *
 * The fire is at [−1.15, 0, −0.35] and the table at [0.75, 0, 1.85], so the
 * left of the frame is already occupied and the right is empty. The supplies
 * go right. That is the composition: warm and busy on the left, worked and
 * stacked on the right, the table between them.
 */
export const CAMP_PROPS: PropPlacement[] = [
  /* ---- foreground: inside the fire's reach -------------------------------
     These are the only props the fire actually lights, so they are the only
     ones whose material anybody will read — and the only ones worth their
     triangles. */

  /* A ring of stones around a fire that has been burning all along. The fire
     is drawn rather than modelled and always was; this is the one thing it
     has been missing, and it is why the flame now sits *in* something. */
  { id: "fireRing", band: "foreground", surface: "rock", at: [-1.15, 0, -0.35], turn: 0.31, scale: 0.94, from: "low" },

  /* Water, one step from the fire, which is where a bucket lives. */
  { id: "bucket", band: "foreground", surface: "timber", at: [-2.05, 0, 0.42], turn: -0.62, scale: 0.95, tilt: [1.5, -2], from: "low" },

  /* The crate the survey gear travelled in, at the end of the table and
     turned away from it: put down, not placed. */
  { id: "crate", band: "foreground", surface: "timber", at: [2.15, 0, 1.32], turn: 0.44, scale: 1.02, from: "low" },

  /* Cut wood and the axe left standing in it. §6 asks for evidence that
     somebody works here, and one tool left mid-job says it better than
     another barrel. */
  { id: "bale", band: "foreground", surface: "sack", at: [-2.34, 0, -0.62], turn: 0.22, scale: 0.82, from: "medium" },
  { id: "axe", band: "foreground", surface: "iron", at: [-2.34, 0.4, -0.62], turn: 1.12, scale: 1.05, tilt: [0, -58], from: "medium" },

  /* ---- midground: the working camp ---------------------------------------
     The right of the frame is empty — the fire and the tent hold the left —
     so the supplies go there and the table sits between the two. */

  /*
    Spread, because four objects inside a metre is one object.

    The first arrangement put a barrel, two crates and a cask in a cluster
    about a metre across and they intersected each other into a single dark
    slab the size of the table — §22's "intersecting meshes" and "obvious
    clipping" in one go, and from the camera it read as a wall rather than as
    supplies. Each of these now stands clear of its neighbours by more than
    its own width, except the two crates, which are stacked on purpose.
  */
  { id: "barrel", band: "midground", surface: "timber", at: [1.48, 0, -0.28], turn: 0.9, scale: 0.95, from: "low" },
  { id: "supplyCrate", band: "midground", surface: "timber", at: [2.62, 0, -1.42], turn: -0.28, scale: 0.95, from: "low" },
  /* Stacked, and not squarely: the top crate is the one that gets moved.
     y = 0.59 is the lower crate's own height at this scale, so it rests on
     it rather than hovering over it. */
  { id: "supplyCrate", band: "midground", surface: "timberDark", at: [2.7, 0.59, -1.5], turn: 0.51, scale: 0.84, tilt: [2, 3], from: "medium" },
  { id: "caskSmall", band: "midground", surface: "timberDark", at: [3.25, 0, -0.45], turn: -0.7, scale: 0.85, tilt: [0, 4], from: "medium" },
  { id: "sacks", band: "midground", surface: "sack", at: [2.1, 0, -2.35], turn: 0.36, scale: 0.85, from: "medium" },

  /* The wheel off whatever brought all of it, leaning where it was leaned. */
  { id: "wagonWheel", band: "midground", surface: "timberDark", at: [3.62, 0, -2.62], turn: 1.24, scale: 0.78, tilt: [0, 16], from: "medium" },

  /* A second, lower tent behind the first and turned away from it. Two tents
     read as a camp; one reads as a tent. */
  { id: "leanTent", band: "midground", surface: "canvas", at: [-3.75, 0, -4.3], turn: 0.78, scale: 0.58, from: "medium" },

  /* ---- background: nothing, and that is the decision ---------------------
     Three props were placed back here and all three are gone.

     Two fence rails: at six metres out a 1.2m rail lands exactly on the
     horizon, and what it drew was a horizontal bar across the mountains — a
     line cutting the composition in half at the precise height the depth was
     coming from.

     And a telegraph pole, which was the better idea of the two. A surveyed
     line is the one piece of infrastructure that belongs in a surveyor's
     country: somebody measured where it would go. But it is seven metres of
     vertical in a frame whose whole back half is already vertical — a
     treeline and three ridges — and at any distance where it read as a
     landmark it took a third of the frame height and argued with the trees.

     The landscape behind this camp was finished at upgrade 07. The packs had
     nothing to add to it, and the honest answer to §34 is to say so rather
     than to keep the object because it was supplied. */
];

/** Every distinct model the scene has to load. */
export const CAMP_PROP_IDS: PropId[] = [...new Set(CAMP_PROPS.map((p) => p.id))];

const RANK = { low: 0, medium: 1, high: 2 } as const;

/**
 * What this machine draws.
 *
 * §16 asks the tiers to change density rather than composition, so the cut is
 * made band by band from the back: a machine on "low" loses the silhouettes
 * and the dressing and keeps the fire ring, the bucket, the crate and the
 * barrel — the objects that make the working end of the camp read as one.
 */
export function propsFor(tier: "high" | "medium" | "low"): PropPlacement[] {
  return CAMP_PROPS.filter((p) => RANK[p.from ?? "high"] <= RANK[tier]);
}
