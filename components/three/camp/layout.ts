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
 *
 * But cluttered on the table is not the same as cluttered on screen, and the
 * first arrangement was only checked on the table. Projected, `notes` and
 * `map` overlapped each other by half a percent of frame width, and all four
 * sat inside the right-hand quarter with the rest of the table bare. Nothing
 * looks wrong in the scene; it goes wrong the moment anything has to be
 * pointed at.
 *
 * These positions were chosen against the projection rather than against the
 * tabletop: worst-case gap between neighbours is 5.9% of frame width, and the
 * group spans 48.7% to 79.0% instead of 50.9% to 78.4% with a collision in
 * the middle of it. The depths still disagree — the row is not a row — but
 * they disagree by amounts that survive being seen from the camera.
 */
export const OBJECTS = {
  notebook: { at: [-0.05, TABLE_TOP, 1.95] as Vec3, turn: -0.22 },
  map: { at: [1.4, TABLE_TOP, 1.98] as Vec3, turn: 0.16 },
  photograph: { at: [0.45, TABLE_TOP, 1.62] as Vec3, turn: 0.38 },
  notes: { at: [0.92, TABLE_TOP, 1.66] as Vec3, turn: -0.09 },
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
  notebook: [-0.05, TABLE_TOP + 0.09, 2.01],
  map: [1.4, TABLE_TOP + 0.07, 2.04],
  photograph: [0.45, TABLE_TOP + 0.07, 1.68],
  notes: [0.92, TABLE_TOP + 0.08, 1.72],
};
/**
 * How wide the control over each object should be, in metres.
 *
 * Each object's own width plus 90mm of margin either side. A control the
 * exact size of a photograph is a control nobody can hit; a control the size
 * of the illustrated camp's box is four controls that overlap. Projected from
 * these numbers the four span 44.6-52.8, 55.5-61.9, 64.2-71.2 and 74.1-83.9
 * percent of frame width, which leaves gaps of 2.7, 2.3 and 2.9 and no
 * collision anywhere.
 *
 * The margin is symmetrical and the object is centred in it, so the control
 * is always over the thing it names however far away the camera is.
 */
export const ANCHOR_WIDTHS: Record<CampObject, number> = {
  notebook: 0.41,
  photograph: 0.34,
  notes: 0.35,
  map: 0.49,
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
/**
 * The lens. §18 asks for a focal length to be chosen rather than inherited.
 *
 * 36 degrees vertical is about a 37mm equivalent on full frame — a normal
 * lens, slightly long. It was 41, which is 32mm and wide enough to be doing
 * something: a wide lens on a small set makes the set look small, because it
 * pushes everything away from the centre and shrinks whatever is nearest.
 *
 * The five degrees buy the one thing this scene has been short of since the
 * objects were placed. Measured across the four:
 *
 *            fov 41    fov 36
 *   notebook   8.4%      9.7%
 *   map       10.9%     12.6%
 *   min gap    2.5%      2.8%
 *   span      40.5%     46.6%
 *
 * Fifteen percent more object, and the gaps between their controls get
 * wider rather than narrower — which is not obvious, and is the reason to
 * measure rather than assume: a longer lens spreads the table across more of
 * the frame at the same time as it enlarges what is on it.
 *
 * Nothing is lost at the edges. The tent apex moves from 25% to 21% across
 * and stays well inside; the near edge of the table moves from 75% to 79%
 * down, leaving a fifth of the frame as the foreground §4 asks for; the sky
 * keeps 37% against 39%. And the afterglow band still clears the far ridge —
 * by 3.1% of frame height rather than 2.7%, so the failure SKY_BAND_Y exists
 * to prevent gets further away rather than closer.
 *
 * Stopping here rather than at 34 or 32, both of which also fit. Past this
 * the foreground below the table starts to go, and the foreground is what
 * stops the scene reading as a picture held at arm's length.
 *
 * **No depth of field.** §18 asks for it to be considered and then says not
 * to overuse it, and §29 says the raw scene should already look good. Real
 * bokeh means a post-processing pipeline — a dependency, a second render
 * target, and a blur over the exact objects §18 also requires to stay
 * readable. The distance is already softened by fog, measured at §11: 0% on
 * the table, 2% at the tree stand, 60% at the far ridge. That is the effect
 * depth of field would be bought for, and it is already paid for.
 */
export const CAMERA_FOV = 36;

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
 * Well back, so the approach descends: distant country first, the camp
 * reading as a silhouette, then the fire, then the table resolving as the
 * camera comes down to standing height. That sequence is a consequence of
 * where it starts rather than something choreographed beat by beat — a camera
 * falling toward 1.62m over sixteen metres of ground passes through all of it
 * on the way. Measured across the move, as a share of the frame:
 *
 *            t=0    t=0.4   t=0.8    t=1
 *   fire     7.8%    9.8%   20.1%   22.3%
 *   tent    12.8%   15.9%   30.0%   32.7%
 *   table   11.1%   14.6%   38.6%   45.4%
 *
 * Everything grows and nothing overtakes anything, which is §19's order
 * happening by itself.
 *
 * **It used to start too high.** At 4.7m the camera was pitched 12.4 degrees
 * down, which put the horizon at 16% and the afterglow band at 0.7% — off the
 * top of the frame for all practical purposes. So the opening shot of a scene
 * whose second named beat is "mountain silhouette" had almost no sky in it
 * and the ridges crushed into the top six percent. The beat had nowhere to
 * happen.
 *
 * 3.6m pitches 8.6 degrees instead: horizon at 27%, ridges at 15%, and the
 * band at 10% where it can be seen. The distance is unchanged, so the camp is
 * still small — the table opens at 11% of frame width and ends at 45% — and
 * the sky opens from 27% to 36% as the camera comes down, which is the right
 * direction for a shot that is arriving somewhere.
 *
 * 1900ms, inside the brief's 1.2–2.5s with room at both ends. The upper bound
 * is the one that matters: past it a visitor stops feeling that the site is
 * showing them something and starts feeling that it is making them wait.
 *
 * The curve stays smootherstep. It spends the first fifth of the move
 * covering about a fiftieth of the distance, which sounds like a fault and is
 * §19's second beat — "slow camera movement" — written down. Nothing is
 * waiting on it either way: the controls over the canvas are live from the
 * first frame, so what is easing is the camera and not the visitor.
 */
export const CAMERA_ARRIVAL = {
  from: [1.9, 3.6, 16.2] as Vec3,
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
