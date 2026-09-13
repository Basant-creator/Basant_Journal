"use client";

import { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute, Path, Shape } from "three";
import { CHAIR, TENT, TENT_TURN } from "./layout";
import { camp } from "./palette";

/* Shared by the walls and both end panels so they cannot drift apart. */
const W = 1.12;
const H = 1.58;
const L = 2.7;
const DOOR_W = 0.46;
const DOOR_H = 1.02;

/**
 * The tent's walls.
 *
 * They used to be a triangle extruded along its length, which is as cheap as
 * a tent gets and has one problem: an extrusion has perfectly flat sides, and
 * nothing made of cloth has a perfectly flat side. Under a raking light that
 * reads as folded card.
 *
 * So the walls are built rather than extruded — ten slices along the length,
 * six steps from ridge to hem — and two things happen across that grid which
 * cannot happen to a prism:
 *
 *   the ridge dips a little between its end poles, because a ridge line
 *   carries its own weight
 *
 *   each panel draws in slightly at the middle, because canvas pegged at the
 *   hem and hung from a pole is under tension, and tensioned cloth is
 *   concave rather than straight
 *
 * Both are small — forty and fifty-five millimetres — and neither is
 * noticeable as an effect. What is noticeable is that the light now moves
 * across the wall instead of landing on it evenly.
 */
function useTentWalls() {
  const geometry = useMemo(() => {
    const SLICES = 10;
    const STEPS = 6;
    const RIDGE_SAG = 0.04;
    const BOW = 0.055;

    const positions: number[] = [];
    const indices: number[] = [];

    for (const sign of [-1, 1]) {
      const base = positions.length / 3;

      for (let i = 0; i <= SLICES; i += 1) {
        const t = i / SLICES;
        const z = -L / 2 + t * L;
        const ridgeY = H - RIDGE_SAG * Math.sin(Math.PI * t);

        for (let j = 0; j <= STEPS; j += 1) {
          const s = j / STEPS;
          /* Deepest at the middle of the panel and the middle of the length,
             nothing at any edge — the edges are where the pole and the pegs
             are, and those are the parts that really are straight. */
          const bow = BOW * Math.sin(Math.PI * s) * Math.sin(Math.PI * t);
          positions.push(sign * (W * s - bow), ridgeY * (1 - s) - bow * 0.25, z);
        }
      }

      for (let i = 0; i < SLICES; i += 1) {
        for (let j = 0; j < STEPS; j += 1) {
          const a = base + i * (STEPS + 1) + j;
          const b = a + (STEPS + 1);
          /* Wound so both walls face outward despite being mirrored. */
          if (sign < 0) indices.push(a, b, a + 1, b, b + 1, a + 1);
          else indices.push(a, a + 1, b, b, a + 1, b + 1);
        }
      }
    }

    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

/** An end panel, with the doorway cut out of it rather than laid over it. */
function endPanel(withDoor: boolean) {
  const shape = new Shape();
  shape.moveTo(-W, 0);
  shape.lineTo(0, H);
  shape.lineTo(W, 0);
  shape.closePath();

  if (withDoor) {
    const door = new Path();
    door.moveTo(-DOOR_W, 0);
    door.lineTo(0, DOOR_H);
    door.lineTo(DOOR_W, 0);
    door.closePath();
    shape.holes.push(door);
  }

  return shape;
}

/**
 * The tent.
 *
 * An A-frame, because a dome is a different century, and its mouth faces the
 * fire, because that is where the mouth of a tent goes.
 */
function Tent() {
  const walls = useTentWalls();
  const front = useMemo(() => endPanel(true), []);
  const back = useMemo(() => endPanel(false), []);

  return (
    <group position={TENT} rotation={[0, TENT_TURN, 0]}>
      <mesh>
        <primitive object={walls} attach="geometry" />
        {/* Cloth: no metal, no gloss, and rough enough that the only thing
            shaping it is its own form. */}
        <meshStandardMaterial color={camp.canvas} roughness={0.97} metalness={0} />
      </mesh>

      {/* The way in. The doorway is a hole in the end panel now rather than a
          dark triangle sitting in front of it, so the canvas has an edge all
          the way round the opening — which is the part that reads as a flap. */}
      <mesh position={[0, 0, L / 2]}>
        <shapeGeometry args={[front]} />
        <meshStandardMaterial color={camp.canvas} roughness={0.97} metalness={0} />
      </mesh>

      {/* What is behind the doorway: nothing, lit by nothing. */}
      <mesh position={[0, 0.34, L / 2 - 0.26]}>
        <planeGeometry args={[DOOR_W * 2.1, DOOR_H * 1.1]} />
        <meshStandardMaterial color={camp.canvasShade} roughness={1} metalness={0} />
      </mesh>

      <mesh position={[0, 0, -L / 2]} rotation={[0, Math.PI, 0]}>
        <shapeGeometry args={[back]} />
        <meshStandardMaterial color={camp.canvas} roughness={0.97} metalness={0} />
      </mesh>

      {/* The ridge pole, proud of the canvas at both ends. A tent whose pole
          stops exactly where the cloth does was never put up by anybody. */}
      <mesh position={[0, H - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.026, 0.026, L + 0.34, 5]} />
        <meshStandardMaterial color={camp.timber} roughness={0.86} metalness={0} />
      </mesh>

      {/*
        Three lines and their pegs, not one. Guying is the detail that says
        someone put this up, and one line reads as a mistake — a tent held
        down on a single corner would not still be standing.
      */}
      {[
        { x: 1.52, z: 1.46, turn: -0.74 },
        { x: -1.52, z: 1.32, turn: 0.74 },
        { x: 1.46, z: -1.5, turn: -0.7 },
      ].map((guy, i) => (
        <group key={i}>
          <mesh position={[guy.x * 0.5, 0.62, guy.z]} rotation={[0, 0, guy.turn]}>
            <cylinderGeometry args={[0.008, 0.008, 1.72, 4]} />
            <meshStandardMaterial color={camp.rope} roughness={1} metalness={0} />
          </mesh>
          <mesh position={[guy.x, 0.05, guy.z]} rotation={[0, 0, guy.turn * 0.4]}>
            <cylinderGeometry args={[0.016, 0.01, 0.22, 4]} />
            <meshStandardMaterial color={camp.timberDark} roughness={1} metalness={0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Something to sit in.
 *
 * §3 lists a chair among the hero objects and the scene had a stool: a slab
 * and four sticks. A folding camp chair is barely more geometry and a far
 * better silhouette — the back is the part that reads, because it is the only
 * vertical thing between the fire and the treeline.
 *
 * Turned away from square, because a chair squared to the fire looks placed
 * and a chair at an angle looks sat in and left.
 */
function Chair() {
  return (
    <group position={CHAIR} rotation={[0, -0.5, 0]}>
      {/* Seat and back, both canvas slung on the frame. */}
      <mesh position={[0, 0.43, 0]} rotation={[0.06, 0, 0]}>
        <boxGeometry args={[0.48, 0.035, 0.42]} />
        <meshStandardMaterial color={camp.canvasShade} roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0, 0.68, -0.2]} rotation={[-0.26, 0, 0]}>
        <boxGeometry args={[0.46, 0.46, 0.03]} />
        <meshStandardMaterial color={camp.canvasShade} roughness={1} metalness={0} />
      </mesh>

      {/* The X-frame, one on each side. A folding chair is two crossed pairs
          and a hinge, and the cross is the whole silhouette. */}
      {[-0.23, 0.23].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.26, 0]} rotation={[0.62, 0, 0]}>
            <boxGeometry args={[0.028, 0.66, 0.028]} />
            <meshStandardMaterial color={camp.timberDark} roughness={1} metalness={0} />
          </mesh>
          <mesh position={[0, 0.26, 0]} rotation={[-0.62, 0, 0]}>
            <boxGeometry args={[0.028, 0.66, 0.028]} />
            <meshStandardMaterial color={camp.timberDark} roughness={1} metalness={0} />
          </mesh>
          {/* The upright the back is slung from. */}
          <mesh position={[0, 0.6, -0.22]} rotation={[-0.26, 0, 0]}>
            <boxGeometry args={[0.026, 0.56, 0.026]} />
            <meshStandardMaterial color={camp.timberDark} roughness={1} metalness={0} />
          </mesh>
        </group>
      ))}

      {/* The rail across the front, which is what stops it reading as two
          separate frames standing near each other. */}
      <mesh position={[0, 0.15, 0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.014, 0.014, 0.46, 4]} />
        <meshStandardMaterial color={camp.timberDark} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

export function CampSite() {
  return (
    <>
      <Tent />
      <Chair />
    </>
  );
}
