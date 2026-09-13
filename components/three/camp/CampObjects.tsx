"use client";

import { useEffect, useMemo, useState } from "react";
import { CanvasTexture, DoubleSide, SRGBColorSpace } from "three";
import { CAMP_PRINT } from "@/lib/world/camp";
import type { SceneProps } from "../types";
import { OBJECTS, type CampObject } from "./layout";
import { useObjectResponse, type ObjectState } from "./useObjectResponse";
import { props } from "./palette";

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
 * The map's face, drawn rather than loaded.
 *
 * §18 wants this to resemble the survey map so a visitor understands it is the
 * map they arrived from. Rasterising the real SVG at runtime would be the
 * faithful route; what actually carries the resemblance at this size is much
 * cheaper — parchment, a few contours, a neatline, and the red route, which is
 * the one mark on the frontier map nobody forgets.
 */
/**
 * The red route, drawn once and used twice.
 *
 * It appears on the sheet itself, dim, the way a line of ink sits on
 * parchment — and again on its own transparent layer, brighter, which is
 * what comes up when the map is reached for. Two draws of the same path
 * from one function, because a highlight that does not trace the mark
 * underneath it is two routes rather than one being noticed.
 */
function drawRoute(ctx: CanvasRenderingContext2D, lit: boolean) {
  ctx.strokeStyle = lit ? "#d4584a" : "#8c2f2a";
  ctx.lineWidth = lit ? 3.4 : 2.6;
  ctx.setLineDash([9, 6]);
  ctx.beginPath();
  ctx.moveTo(38, 132);
  ctx.bezierCurveTo(92, 116, 118, 74, 168, 64);
  ctx.lineTo(214, 46);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = lit ? "#d4584a" : "#8c2f2a";
  for (const [x, y] of [[38, 132], [214, 46]]) {
    ctx.beginPath();
    ctx.arc(x, y, lit ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The mark on its own, over nothing, so it can be faded in over the sheet. */
function useRouteTexture(): CanvasTexture | null {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 176;
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
    canvas.width = 256;
    canvas.height = 176;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = props.parchment;
    ctx.fillRect(0, 0, 256, 176);

    ctx.strokeStyle = "rgba(74, 58, 43, 0.45)";
    ctx.lineWidth = 1.4;
    for (let r = 0; r < 3; r += 1) {
      ctx.beginPath();
      for (let x = 20; x <= 236; x += 8) {
        const y = 58 + r * 16 + Math.sin((x + r * 40) / 26) * (9 - r * 2);
        if (x === 20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(74, 58, 43, 0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 236, 156);

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
  return (
    <group ref={group} position={o.at} rotation={[0, o.turn, 0]}>
      <mesh position={[0, 0.022, 0]}>
        <boxGeometry args={[0.23, 0.044, 0.17]} />
        {/* The cover takes the warmth, not the pages: leather catching a
            little more firelight is a book being noticed, and glowing
            paper is a screen. */}
        <meshStandardMaterial
          ref={face}
          color={props.leather}
          emissive={props.glow}
          emissiveIntensity={0}
          roughness={0.85}
        />
      </mesh>
      {/* Page block, inset so the cover overhangs it. The overhang is the
          whole reason it reads as bound rather than as a block. */}
      <mesh position={[0.004, 0.021, 0]}>
        <boxGeometry args={[0.215, 0.03, 0.158]} />
        <meshStandardMaterial color={props.paper} roughness={1} />
      </mesh>
      <mesh position={[0.02, 0.045, 0]}>
        <boxGeometry args={[0.018, 0.003, 0.175]} />
        <meshStandardMaterial color={props.ink} roughness={1} />
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

function FieldNotes() {
  const o = OBJECTS.notes;
  /* A stack is only a stack if the sheets disagree with each other. */
  const sheets = [
    { y: 0.004, turn: 0, x: 0, z: 0 },
    { y: 0.009, turn: 0.14, x: 0.008, z: -0.006 },
    { y: 0.014, turn: -0.09, x: -0.006, z: 0.005 },
    { y: 0.019, turn: 0.05, x: 0.003, z: 0.009 },
  ];
  return (
    <group position={o.at} rotation={[0, o.turn, 0]}>
      {sheets.map((s, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, s.turn]} position={[s.x, s.y, s.z]}>
          <planeGeometry args={[0.17, 0.13]} />
          <meshStandardMaterial
            color={i === sheets.length - 1 ? props.paper : props.paperEdge}
            roughness={1}
          />
        </mesh>
      ))}
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
      <FieldNotes />
    </group>
  );
}
