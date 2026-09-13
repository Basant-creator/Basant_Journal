/**
 * Where everything in Camp stands.
 *
 * One file, because the scene, the camera, its bounds and the DOM controls
 * over it all have to agree about where the table is — and the 2D camp was
 * already bitten once by the same positions living in two places, which put
 * every hit area half its own width off the object it named.
 *
 * World units are metres. A person is about 1.7 of them; the table is 0.75
 * high. Keeping that honest is what stops the scene reading as a diorama.
 *
 * The composition is the brief's §4 order, far to near:
 *
 *   sky · mountains · distant terrain · treeline · mid-ground
 *   campfire · tent · table · chair · lantern · props · foreground
 *
 * Depth is not evenly spread. Everything a visitor looks *at* sits between
 * z 3 and z -4; everything beyond z -12 exists to be behind it. That gap is
 * what makes a small scene feel like open country rather than a stage set.
 */

export type Vec3 = [number, number, number];

/* --- the ground the camp stands on --------------------------------------- */

export const GROUND_Y = 0;

/* --- the anchor ----------------------------------------------------------- */

/**
 * The fire, and the whole reason the scene has a focal point.
 *
 * Back and to the left, matching the illustrated camp: its SMOKE_PLUMES rise
 * from x 646 of 1600 with the objects low and centre. Centred, the smoke goes
 * up behind the papers instead of beside them — which quietly makes the drawn
 * camp and the rendered one different places.
 */
export const FIRE: Vec3 = [-1.15, GROUND_Y, -0.35];
export const FIRE_RADIUS = 0.46;

/* --- the furniture -------------------------------------------------------- */

/** Nearer than the fire and right of it, so the light rakes across the table
 *  rather than falling on it flatly. */
export const TABLE: Vec3 = [0.75, GROUND_Y, 1.85];
export const TABLE_TOP = 0.74;
export const TABLE_SIZE: [number, number] = [1.9, 1.05];

/** Behind the fire, angled. It reads as shelter without competing for the eye. */
export const TENT: Vec3 = [-2.75, GROUND_Y, -1.5];
export const TENT_TURN = 0.34;

/** Pulled back from the fire by roughly the distance someone would actually
 *  sit — close enough to be warm, far enough not to be in it. */
export const CHAIR: Vec3 = [-0.2, GROUND_Y, 0.55];

/** On the table's far corner, so it lights the objects from behind and throws
 *  their edges toward the camera. */
export const LANTERN: Vec3 = [1.42, TABLE_TOP, 1.45];

/* --- the four things a visitor can pick up -------------------------------- */

/**
 * §22 caps interaction at four objects, and the cap is the point: every extra
 * button spends the discovery of the ones that matter.
 *
 * The ids are the same `CampObjectId`s the DOM tablist and the illustrated
 * artwork use, so a hover in one is a hover in all three without anything
 * translating between two vocabularies.
 *
 * Laid out as things set down rather than as a row — the brief asks for a
 * table that is naturally cluttered, and a naturally cluttered table is one
 * where nothing shares an axis with anything else.
 */
export const OBJECTS = {
  notebook: { at: [0.18, TABLE_TOP, 2.02] as Vec3, turn: -0.22 },
  map: { at: [1.18, TABLE_TOP, 2.11] as Vec3, turn: 0.16 },
  photograph: { at: [0.52, TABLE_TOP, 1.62] as Vec3, turn: 0.38 },
  notes: { at: [1.05, TABLE_TOP, 1.68] as Vec3, turn: -0.09 },
} as const;

export type CampObject = keyof typeof OBJECTS;
export const OBJECT_ORDER = Object.keys(OBJECTS) as CampObject[];
/**
 * Where a label over the canvas should stand, per object.
 *
 * Not the object's own position. An anchor at the object's origin projects to
 * the table surface it is lying on, and a control centred there covers the
 * thing it names — which is the version that feels like a hotspot map rather
 * than like a place. These sit a little above and a little toward the camera,
 * so the label reads as belonging to the object without sitting on it.
 *
 * The lift is fixed rather than following the object up when it is picked up.
 * A control that moves while being pointed at is a control that can slide out
 * from under the pointer, and §23's whole point is that the response is small
 * enough to notice the object rather than the effect.
 */
export const ANCHORS: Record<CampObject, Vec3> = {
  notebook: [0.18, TABLE_TOP + 0.09, 2.08],
  map: [1.18, TABLE_TOP + 0.07, 2.17],
  photograph: [0.52, TABLE_TOP + 0.07, 1.68],
  notes: [1.05, TABLE_TOP + 0.08, 1.74],
};


/* --- the country behind it ------------------------------------------------ */

/** Three bands, each far enough past the last that aerial perspective does the
 *  work rather than scale alone. */
export const RIDGE_Z = [-58, -34, -19] as const;
export const TREELINE_Z = -12;

/* --- the camera ----------------------------------------------------------- */

/**
 * Where the camera comes to rest, and what it looks at.
 *
 * §7 wants the mountain, the fire, the table and the tent all in frame, which
 * means standing back and slightly above — a person arriving at a camp, not a
 * person crouched at it.
 */
export const CAMERA_HOME: Vec3 = [0.35, 1.62, 5.6];
/**
 * What the camera looks at.
 *
 * Raised from 0.82 after the sky went in and the arithmetic showed what it
 * cost: aiming at the fire pitched the camera 8.3 degrees down and spent
 * 70% of the frame on ground. §7 wants the mountain, the fire, the table and
 * the tent in one view, and a scene that is two-thirds floor has no room
 * left for the first of those.
 *
 * At 1.15 the pitch is 4.9 degrees, the sky takes 39% of the frame, and the
 * table — the nearest thing that must stay in view — lands 69% down, which
 * is comfortably inside it. Past about 1.3 the table starts crowding the
 * bottom edge.
 */
export const CAMERA_TARGET: Vec3 = [-0.15, 1.15, 0.15];
export const CAMERA_FOV = 41;

/**
 * How far the visitor may move it. §10.
 *
 * Deliberately small. These are the limits of leaning, not of walking: the
 * whole box is under a metre and a half wide, which is a head moving rather
 * than a body. Past it the scene has nothing to show — unfinished terrain,
 * the backs of silhouettes, the edge of the ground plane — and the one thing
 * a scene like this must never do is let someone see that it stops.
 */
export const CAMERA_BOUNDS = {
  minX: -0.72,
  maxX: 0.72,
  minY: 1.34,
  maxY: 1.92,
  minZ: 5.1,
  maxZ: 6.15,
} as const;

/**
 * The arrival. §8.
 *
 * High and well back, so the approach descends: distant country first, the
 * camp reading as a silhouette, then the fire, then the table resolving as
 * the camera comes down to standing height. That sequence is a consequence of
 * where it starts rather than something choreographed beat by beat — a camera
 * falling from 4.6m to 1.62m over sixteen metres of ground passes through all
 * of it on the way.
 *
 * 1900ms, inside the brief's 1.2–2.5s with room at both ends. The upper bound
 * is the one that matters: past it a visitor stops feeling that the site is
 * showing them something and starts feeling that it is making them wait.
 */
export const CAMERA_ARRIVAL = {
  from: [1.9, 4.7, 16.2] as Vec3,
  ms: 1900,
};

/* --- the sky -------------------------------------------------------------- */

/** Behind the furthest ridge, far enough that leaning cannot reveal it as a
 *  flat plane standing in the world. */
export const SKY_Z = -86;
export const SKY_SIZE: [number, number] = [420, 150];

/** How high the furthest ridge crests. The sky and the ridges have to agree
 *  about this or the afterglow ends up behind the mountains. */
export const RIDGE_CREST = 9.2;

/**
 * Where the afterglow band sits on the sky plane.
 *
 * Aimed, not guessed — the same discipline the vista needed and the same
 * mistake it made first. The furthest ridge crests at 9.2 units, 63.6 metres
 * from the camera, which puts its top 6.6 degrees above eye level. The band
 * has to clear that, so it is placed at 8 degrees:
 *
 *     y = camera height + sky distance * tan(8 deg)
 *       = 1.62 + 90.6 * 0.1405
 *       ≈ 14.3
 *
 * Below the crest line the gradient is academic; the ridges are drawn over it.
 * Above it is the only light in the picture.
 */
export const SKY_BAND_Y = 14.3;

/* --- the mountains -------------------------------------------------------- */

/**
 * How the survey sheet's ridge silhouettes become mountains.
 *
 * The illustrated camp already stands in front of these — "the country,
 * borrowed from the survey's own mountains" — so the rendered one uses the
 * same three, read from `silhouettePoints()`. Anything else makes two places
 * that share a name.
 *
 * `crest` is how high each ridge rises in metres; the scale that gets it there
 * is derived from the silhouette's own amplitude, so a change to the map's
 * mountains moves Camp's mountains with it.
 *
 * Each crest clears the land band in front of it by enough to still be read as
 * a ridge rather than as more ground: 9.2 over a 4.3 band, 6.5 over 2.8, 4.2
 * over 1.9.
 */
export const MOUNTAINS = [
  { z: RIDGE_Z[0], crest: RIDGE_CREST },
  { z: RIDGE_Z[1], crest: 6.5 },
  { z: RIDGE_Z[2], crest: 4.2 },
] as const;

/** The sheet is 1600 wide; its middle is what the camp faces. */
export const SHEET_MIDDLE = 800;
