"use client";

import { useEffect, useMemo, useState } from "react";
import { CanvasTexture, DoubleSide, SRGBColorSpace } from "three";
import { locations } from "@/lib/content/portfolio";
import { primaryTrail, trails } from "@/lib/map/locations";
import { SHEET_HEIGHT, SHEET_WIDTH, silhouettePoints, terrain } from "@/lib/map/terrain";
import { CAMP_PRINT } from "@/lib/world/camp";
import type { SceneProps } from "../types";
import { OBJECTS, type CampObject } from "./layout";
import { useObjectResponse, type ObjectState } from "./useObjectResponse";
import { useLeatherTexture, usePageEdgeTexture } from "./CampLeather";
import { camp, land, props, tint } from "./palette";

/**
 * The four things on the table that mean something.
 *
 * Geometry only, for now. Steps 11 to 14 give each one hover, selection and a
 * destination; this is what they will be attached to. Building the objects
 * before the interaction is deliberate — an object that only exists once it is
 * clickable tends to end up looking like a button.
 *
 * Their ids are the same CampObjectIds the DOM tablist and the illustrated
 * artwork already use. One vocabulary, three renderings, which is what lets a
 * hover in any of them be a hover in all of them without translation.
 *
 * Each is built so its silhouette alone says what it is: the notebook is
 * thick, the notes are a loose stack, the photograph has a white border, the
 * map is a sheet with ink on it. Readable before any label is, which is what
 * §23 means by letting the world provide the context.
 */

/**
 * The map on the table is the Frontier map.
 *
 * §16 asks for a miniature of the real survey sheet rather than something
 * that resembles one, and the difference matters: a visitor arrives at Camp
 * *from* that map, and the whole point of the object is the relationship
 * between the place and the drawing of the place. A plausible-looking
 * substitute breaks it quietly — nobody can say what is wrong, but the map on
 * the table is not the map they were just looking at.
 *
 * So this reads `terrain`, `trails` and `locations` — the same modules
 * `/frontier` draws from. The ridges are its ridges, the contours are its
 * contours, the route bows the way its route bows, and Camp and the Journal
 * sit where they sit on the sheet. Nothing here is redrawn to match, because
 * anything redrawn to match eventually stops matching.
 *
 * The whole sheet is fitted into the texture at one scale on both axes, so
 * the drawing keeps its proportions and the parchment takes up the slack as
 * margins — which is what a sheet has anyway.
 */
const MAP_W = 384;
const MAP_H = 260;

/** Puts the canvas into the survey sheet's own 1600x1000 coordinates. */
function inSheet(ctx: CanvasRenderingContext2D, draw: () => void) {
  const scale = Math.min(MAP_W / SHEET_WIDTH, MAP_H / SHEET_HEIGHT);
  ctx.save();
  ctx.translate(
    (MAP_W - SHEET_WIDTH * scale) / 2,
    (MAP_H - SHEET_HEIGHT * scale) / 2,
  );
  ctx.scale(scale, scale);
  draw();
  ctx.restore();
}

/** Strokes a set of SVG path strings. Path2D takes them as they are, which is
 *  why none of this geometry needed reimplementing. */
function strokePaths(ctx: CanvasRenderingContext2D, paths: readonly string[], width: number) {
  ctx.lineWidth = width;
  for (const d of paths) ctx.stroke(new Path2D(d));
}

/**
 * The red route, drawn once and used twice.
 *
 * It appears on the sheet itself, dim, the way a line of ink sits on
 * parchment — and again on its own transparent layer, brighter, which is
 * what comes up when the map is reached for. Two draws of the same path
 * from one function, because a highlight that does not trace the mark
 * underneath it is two routes rather than one being noticed.
 *
 * The path is `primaryTrail` — the Camp-to-Journal line the survey draws in
 * red. Not a curve that looks like it: the curve.
 */
function drawRoute(ctx: CanvasRenderingContext2D, lit: boolean) {
  /* Captured before the closure: narrowing does not survive into a callback,
     because TypeScript cannot know the callback runs immediately. */
  const route = primaryTrail;
  if (!route) return;

  inSheet(ctx, () => {
    ctx.strokeStyle = lit ? props.markLit : props.mark;
    ctx.lineWidth = lit ? 11 : 8;
    ctx.setLineDash([26, 18]);
    ctx.lineCap = "round";
    ctx.stroke(new Path2D(route.path));
    ctx.setLineDash([]);

    /* The two ends, because a dashed line with nothing at either end is a
       decoration rather than a journey. */
    ctx.fillStyle = lit ? props.markLit : props.mark;
    for (const id of [route.from, route.to]) {
      const at = locations.find((l) => l.id === id);
      if (!at) continue;
      ctx.beginPath();
      ctx.arc(at.coord[0], at.coord[1], lit ? 15 : 12, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** The mark on its own, over nothing, so it can be faded in over the sheet. */
function useRouteTexture(): CanvasTexture | null {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = MAP_W;
    canvas.height = MAP_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    drawRoute(ctx, true);
    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

function useMapTexture(): CanvasTexture | null {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = MAP_W;
    canvas.height = MAP_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = props.parchment;
    ctx.fillRect(0, 0, MAP_W, MAP_H);

    inSheet(ctx, () => {
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      /* Ridges first, furthest back. Filled rather than stroked: on the sheet
         these are silhouettes, and at this size a stroked outline would read
         as a scribble. */
      ctx.fillStyle = tint(camp.timber, 0.13);
      for (const ridge of silhouettePoints()) {
        const path = new Path2D();
        path.moveTo(ridge[0].x, SHEET_HEIGHT);
        for (const point of ridge) path.lineTo(point.x, point.y);
        path.lineTo(ridge[ridge.length - 1].x, SHEET_HEIGHT);
        path.closePath();
        ctx.fill(path);
      }

      /* Contours, thinned. Every third line: the sheet carries enough of them
         to read as a survey at full size, and all of them at a third of the
         scale is a grey wash. §2 asks for detail where it can be seen. */
      ctx.strokeStyle = tint(camp.timber, 0.3);
      strokePaths(ctx, terrain.contours.filter((_, i) => i % 3 === 0), 3);

      ctx.strokeStyle = tint(camp.timber, 0.42);
      strokePaths(ctx, terrain.mountains.ridges.slice(0, 12), 3.4);

      /* Water, and the one thing on the sheet that is not brown. */
      ctx.strokeStyle = tint(land.far, 0.55);
      strokePaths(ctx, [terrain.river.channel, terrain.river.tributary], 6);

      ctx.strokeStyle = tint(camp.timber, 0.5);
      strokePaths(ctx, terrain.road.lanes, 3);

      /* The neatline. */
      ctx.strokeStyle = tint(props.ink, 0.5);
      strokePaths(ctx, [terrain.frame.inner], 4);
      ctx.strokeStyle = tint(props.ink, 0.32);
      strokePaths(ctx, terrain.frame.ticks.filter((_, i) => i % 2 === 0), 2.4);

      /* The trails between stations, in ink. The red one is drawn after, by
         drawRoute, so it sits on top the way it does on the sheet. */
      ctx.strokeStyle = tint(props.ink, 0.42);
      ctx.setLineDash([14, 12]);
      strokePaths(
        ctx,
        trails.filter((t) => t.kind === "route").map((t) => t.path),
        4.5,
      );
      ctx.setLineDash([]);

      /* Every station on the survey, not only the two the route joins. A map
         with two marks on it is a diagram of a journey; a map with six is a
         territory that a journey crosses. */
      for (const at of locations) {
        ctx.strokeStyle = tint(props.ink, 0.62);
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.arc(at.coord[0], at.coord[1], 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = tint(props.ink, 0.5);
        ctx.beginPath();
        ctx.arc(at.coord[0], at.coord[1], 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    drawRoute(ctx, false);

    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

/**
 * The notebook. §14, and the first object in the camp that answers back.
 *
 * Its annotation in the DOM is "Notebook — who is keeping this record",
 * which is the label the illustrated camp already uses and the one the
 * content model supports. §14 suggests "FIELD NOTES" for it, but that is
 * the name of a different object three sections later; two things in one
 * scene answering to the same name is worse than a slightly plainer word.
 */
function Notebook({ state }: { state: ObjectState }) {
  const o = OBJECTS.notebook;
  const { group, face } = useObjectResponse(state, o.at[1]);
  const leather = useLeatherTexture();
  const edges = usePageEdgeTexture();

  return (
    <group ref={group} position={o.at} rotation={[0, o.turn, 0]}>
      {/* The back board. */}
      <mesh position={[0, 0.00275, 0]}>
        <boxGeometry args={[0.23, 0.0055, 0.17]} />
        <meshStandardMaterial
          map={leather ?? undefined}
          color={leather ? undefined : props.leather}
          roughness={0.85}
          metalness={0}
        />
      </mesh>

      {/*
        The pages, and they can be seen now.

        This block was already here and was entirely inside the cover: the
        cover was one solid box from the back board to the front, 0.23 by
        0.044 by 0.17, and the page block sat within all three spans. It has
        been drawn every frame since it was written and never once been
        visible. Its own comment claimed the cover overhangs it — which is
        true of the numbers and irrelevant when the thing overhanging is
        solid.

        The covers are boards now, one above and one below, and the block is
        inset eight millimetres so the boards stand proud of it. That inset is
        what makes an object read as bound rather than as a brick.
      */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.214, 0.029, 0.156]} />
        <meshStandardMaterial
          map={edges ?? undefined}
          color={edges ? undefined : props.paper}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/*
        Two leaves that do not lie flat. §15 asks for uneven edges and small
        bends, and this is the whole of it: a notebook that has been written
        in does not close square, and two leaves at a fraction of a degree
        say that more clearly than any amount of texture.
      */}
      {[
        { y: 0.0344, turn: 0.012, x: 0.0015 },
        { y: 0.0352, turn: -0.008, x: -0.001 },
      ].map((leaf, i) => (
        <mesh key={`leaf-${i}`} position={[leaf.x, leaf.y, 0]} rotation={[0, leaf.turn, 0]}>
          <boxGeometry args={[0.219, 0.0008, 0.159]} />
          <meshStandardMaterial color={props.paper} roughness={1} metalness={0} />
        </mesh>
      ))}

      {/* The front board, which takes the warmth. Leather catching a little
          more firelight is a book being noticed; glowing paper is a screen,
          which is why the emissive lives here and not on the block. */}
      <mesh position={[0, 0.0385, 0]}>
        <boxGeometry args={[0.23, 0.006, 0.17]} />
        <meshStandardMaterial
          ref={face}
          map={leather ?? undefined}
          color={leather ? undefined : props.leather}
          emissive={props.glow}
          emissiveIntensity={0}
          roughness={0.85}
          metalness={0}
        />
      </mesh>

      {/* The spine, rounded over the fold. A bound book has no sharp edge on
          the hinge side, and that curve is most of what separates one from a
          stack of card. */}
      <mesh position={[-0.113, 0.0205, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.019, 0.019, 0.17, 8, 1, false, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial
          map={leather ?? undefined}
          color={leather ? undefined : props.leather}
          roughness={0.85}
          metalness={0}
        />
      </mesh>

      {/* The marker, out of the top and down the front. */}
      <mesh position={[0.02, 0.0418, 0]}>
        <boxGeometry args={[0.018, 0.0012, 0.184]} />
        <meshStandardMaterial color={props.ink} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

/**
 * The survey map. §18.
 *
 * The one object here whose job is to be recognised rather than opened.
 * It goes back to /frontier, and the whole point of it sitting on the table
 * is the relationship between the place and the drawing of the place — so
 * what answers when it is reached for is the route, not the paper.
 */
function SurveyMap({ state }: { state: ObjectState }) {
  const o = OBJECTS.map;
  const texture = useMapTexture();
  const route = useRouteTexture();
  const { group, face, accent } = useObjectResponse(state, o.at[1]);
  return (
    <group ref={group} position={o.at} rotation={[0, o.turn, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <planeGeometry args={[0.31, 0.21]} />
        <meshStandardMaterial
          ref={face}
          map={texture ?? undefined}
          color={props.parchment}
          emissive={props.glow}
          emissiveIntensity={0}
          roughness={1}
        />
      </mesh>

      {/* The mark coming up. A hair above the sheet so it cannot z-fight,
          and unlit so the route reads as ink rather than as something
          switched on. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0055, 0]}>
        <planeGeometry args={[0.31, 0.21]} />
        <meshBasicMaterial
          ref={accent}
          map={route ?? undefined}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      {/* A curled corner. A sheet that has been folded never lies flat, and a
          perfectly flat rectangle reads as a screen. */}
      <mesh rotation={[-Math.PI / 2 + 0.5, 0, 0]} position={[0.108, 0.018, -0.086]}>
        <planeGeometry args={[0.09, 0.055]} />
        <meshStandardMaterial color={props.paperEdge} roughness={1} side={DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * The photograph on the table. §19.
 *
 * The one object in the camp whose content is a person. Everything else here
 * is drawn; this is printed, off the same file the illustrated camp prints and
 * through the same colour matrix — see CAMP_PRINT. Two renderings of one
 * photograph, not two photographs.
 *
 * A modern colour snapshot laid into a blue-hour frontier reads as a
 * screenshot of a different website, which is the entire reason the treatment
 * exists. It is applied here rather than to the file, so it stays a decision
 * that can be changed instead of a thing baked into an asset.
 *
 * What is deliberately *not* baked in is the firelight. The illustrated camp
 * paints a sheen across the print because it has no light of its own; this
 * scene has a real one, two and a half metres away, and painting a second
 * would light the object from a direction it is not lit from — and would keep
 * lighting it from there once it lifts.
 */
const PRINT_PX = 256;

function usePrintTexture(): CanvasTexture | null {
  const [texture, setTexture] = useState<CanvasTexture | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    let live = true;
    let made: CanvasTexture | null = null;
    const image = new window.Image();
    image.decoding = "async";

    image.onload = () => {
      if (!live) return;
      const canvas = document.createElement("canvas");
      canvas.width = PRINT_PX;
      canvas.height = Math.round(
        (PRINT_PX * CAMP_PRINT.window.h) / CAMP_PRINT.window.w,
      );
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      /* The same crop the illustrated camp takes: cover the window, centre it
         across, and sit CAMP_PRINT.anchor of the way down the slack — which is
         where the face is, and is not the top. */
      const want = canvas.width / canvas.height;
      const have = image.width / image.height;
      const sw = have > want ? image.height * want : image.width;
      const sh = have > want ? image.height : image.width / want;
      ctx.drawImage(
        image,
        (image.width - sw) / 2,
        (image.height - sh) * CAMP_PRINT.anchor,
        sw,
        sh,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      /* The colour matrix, by hand. An feColorMatrix over sRGB is a per-pixel
         multiply-and-offset and getImageData hands back sRGB bytes, so this
         is the same arithmetic on the same numbers rather than a canvas
         effect that resembles it. The clamped array does the rounding. */
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = frame.data;
      const [mr, mg, mb] = CAMP_PRINT.matrix;
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        px[i] = mr[0] * r + mr[1] * g + mr[2] * b + mr[4] * 255;
        px[i + 1] = mg[0] * r + mg[1] * g + mg[2] * b + mg[4] * 255;
        px[i + 2] = mb[0] * r + mb[1] * g + mb[2] * b + mb[4] * 255;
      }
      ctx.putImageData(frame, 0, 0);

      /* Seated, not moody. Enough darkening at the edges that the print is an
         object on a table rather than a decal on one; a portrait is the
         content here, so it stops well short of the face. */
      const edge = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height * 0.42,
        canvas.width * 0.3,
        canvas.width / 2,
        canvas.height * 0.42,
        canvas.width * 0.62,
      );
      edge.addColorStop(0, "transparent");
      edge.addColorStop(1, props.printEdge);
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;

      made = new CanvasTexture(canvas);
      made.colorSpace = SRGBColorSpace;
      setTexture(made);
    };

    image.src = CAMP_PRINT.src;

    return () => {
      live = false;
      image.onload = null;
      made?.dispose();
    };
  }, []);

  return texture;
}

/* The mount and its window, in metres, off the same ratios the illustrated
   camp draws — 168x132 of card around a 140x92 window, sitting high in it so
   the wide margin faces the reader. A print mount is asymmetric; a centred
   window reads as a coaster. */
const MOUNT: [number, number] = [0.16, 0.126];
const WINDOW: [number, number] = [0.133, 0.088];
const WINDOW_Z = -0.006;

function Photograph({ state }: { state: ObjectState }) {
  const o = OBJECTS.photograph;
  const print = usePrintTexture();
  const { group, face } = useObjectResponse(state, o.at[1]);

  return (
    <group ref={group} position={o.at} rotation={[0, o.turn, 0]}>
      {/* The mount, with a real thickness. The border is the silhouette cue —
          a bordered rectangle is a print, an unbordered one is a card — and
          the card only reads as card from across the table if it has an edge
          the firelight can catch. */}
      <mesh position={[0, 0.0018, 0]}>
        <boxGeometry args={[MOUNT[0], 0.0036, MOUNT[1]]} />
        {/* The warmth goes on the mount, never on the print. Card catching a
            little more firelight is a photograph being noticed; a face that
            brightens on hover is a screen. The notebook makes the same split
            between its cover and its pages. */}
        <meshStandardMaterial
          ref={face}
          color={props.paper}
          emissive={props.glow}
          emissiveIntensity={0}
          roughness={1}
        />
      </mesh>

      {/* The window, which is what is there before the print arrives and
          what stays there if it never does. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0038, WINDOW_Z]}>
        <planeGeometry args={WINDOW} />
        <meshStandardMaterial color={props.ink} roughness={1} />
      </mesh>

      {/* The print, on its own mesh rather than as a map on the window. A map
          multiplies against the material colour, and the window is nearly
          black — the photograph would arrive and disappear. */}
      {print ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0042, WINDOW_Z]}>
          <planeGeometry args={WINDOW} />
          <meshStandardMaterial map={print} roughness={1} />
        </mesh>
      ) : null}
    </group>
  );
}

/**
 * The face of a working sheet.
 *
 * Ruled lines and a red tick in the margin — marks, not words. §20 is explicit
 * that this object must not carry invented diary entries, and drawn letterforms
 * would be exactly that with deniability: something that reads as writing at a
 * glance is writing, whatever the pixels technically are. What is actually
 * written on these sheets is the interests list, and it appears when the notes
 * are opened, in text, from the content model.
 *
 * The tick is THE HAND — annotation, in red, on paper. It is also the only
 * thing that tells this stack from the map's parchment at four metres, which
 * is the same job the route does for the map.
 */
function useNotesTexture(): CanvasTexture | null {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 146;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = props.paper;
    ctx.fillRect(0, 0, 192, 146);

    /* Ruled, not written on. */
    ctx.strokeStyle = tint(camp.timber, 0.28);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 7; i += 1) {
      const y = 30 + i * 15;
      ctx.beginPath();
      ctx.moveTo(26, y);
      ctx.lineTo(168, y);
      ctx.stroke();
    }

    /* The margin rule, and the tick against one line of it. */
    ctx.strokeStyle = tint(props.mark, 0.5);
    ctx.beginPath();
    ctx.moveTo(20, 12);
    ctx.lineTo(20, 134);
    ctx.stroke();

    ctx.strokeStyle = props.mark;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(8, 74);
    ctx.lineTo(13, 80);
    ctx.lineTo(17, 66);
    ctx.stroke();

    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

/**
 * The field notes. §20.
 *
 * A stack, and a stack is only a stack if the sheets disagree with each other.
 * Four of them at four angles, the top one ruled and the ones beneath it plain,
 * because that is all that is visible of them and a texture nobody can see is
 * a texture that costs memory for nothing.
 *
 * Lift and warmth, and no third thing. The map earns its accent because §18
 * asks for the route specifically; §21's warning about every object becoming a
 * button applies just as well to every object acquiring a trick.
 */
function FieldNotes({ state }: { state: ObjectState }) {
  const o = OBJECTS.notes;
  const ruled = useNotesTexture();
  const { group, face } = useObjectResponse(state, o.at[1]);

  const sheets = [
    { y: 0.004, turn: 0, x: 0, z: 0 },
    { y: 0.009, turn: 0.14, x: 0.008, z: -0.006 },
    { y: 0.014, turn: -0.09, x: -0.006, z: 0.005 },
  ];

  return (
    <group ref={group} position={o.at} rotation={[0, o.turn, 0]}>
      {sheets.map((s, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, s.turn]} position={[s.x, s.y, s.z]}>
          <planeGeometry args={[0.17, 0.13]} />
          <meshStandardMaterial color={props.paperEdge} roughness={1} />
        </mesh>
      ))}

      {/* The top sheet, which is the only one anybody reads. It takes the
          warmth for the whole stack — the sheets under it are edges. */}
      <mesh rotation={[-Math.PI / 2, 0, 0.05]} position={[0.003, 0.019, 0.009]}>
        <planeGeometry args={[0.17, 0.13]} />
        <meshStandardMaterial
          ref={face}
          map={ruled ?? undefined}
          color={props.paper}
          emissive={props.glow}
          emissiveIntensity={0}
          roughness={1}
        />
      </mesh>
    </group>
  );
}

/**
 * Which of the four the DOM says is being reached for.
 *
 * The selection lives in the tablist over the canvas, not in here. R3F
 * renders into its own reconciler root so context does not cross the
 * Canvas, and rather than bridge it for two strings the values arrive as
 * plain props — the same arrangement Phase 5 settled on and wrote down.
 */
function stateOf(id: CampObject, active?: string | null, hover?: string | null): ObjectState {
  if (active === id) return "active";
  return hover === id ? "hover" : "rest";
}

export function CampObjects({ activeId, hoverId }: SceneProps) {
  return (
    <group>
      <Notebook state={stateOf("notebook", activeId, hoverId)} />
      <SurveyMap state={stateOf("map", activeId, hoverId)} />
      <Photograph state={stateOf("photograph", activeId, hoverId)} />
      <FieldNotes state={stateOf("notes", activeId, hoverId)} />
    </group>
  );
}
