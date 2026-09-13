"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, DoubleSide } from "three";
import { OBJECTS } from "./layout";
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

    ctx.strokeStyle = "#8c2f2a";
    ctx.lineWidth = 2.6;
    ctx.setLineDash([9, 6]);
    ctx.beginPath();
    ctx.moveTo(38, 132);
    ctx.bezierCurveTo(92, 116, 118, 74, 168, 64);
    ctx.lineTo(214, 46);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#8c2f2a";
    for (const [x, y] of [[38, 132], [214, 46]]) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

function Notebook() {
  const o = OBJECTS.notebook;
  return (
    <group position={o.at} rotation={[0, o.turn, 0]}>
      <mesh position={[0, 0.022, 0]}>
        <boxGeometry args={[0.23, 0.044, 0.17]} />
        <meshStandardMaterial color={props.leather} roughness={0.85} />
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

function SurveyMap() {
  const o = OBJECTS.map;
  const texture = useMapTexture();
  return (
    <group position={o.at} rotation={[0, o.turn, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <planeGeometry args={[0.31, 0.21]} />
        <meshStandardMaterial map={texture ?? undefined} color={props.parchment} roughness={1} />
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

function Photograph() {
  const o = OBJECTS.photograph;
  return (
    <group position={o.at} rotation={[0, o.turn, 0]}>
      {/* The border is the silhouette cue: a bordered rectangle is a print,
          an unbordered one is a card. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <planeGeometry args={[0.15, 0.18]} />
        <meshStandardMaterial color={props.paper} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -0.008]}>
        <planeGeometry args={[0.125, 0.135]} />
        <meshStandardMaterial color={props.ink} roughness={1} />
      </mesh>
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

export function CampObjects() {
  return (
    <group>
      <Notebook />
      <SurveyMap />
      <Photograph />
      <FieldNotes />
    </group>
  );
}
