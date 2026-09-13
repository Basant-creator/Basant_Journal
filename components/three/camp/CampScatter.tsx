"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  ConeGeometry,
  DodecahedronGeometry,
  IcosahedronGeometry,
  Object3D,
  OctahedronGeometry,
  type InstancedMesh,
} from "three";
import {
  ROCK_VARIANTS,
  SHRUB_VARIANTS,
  type Scattered,
  buildCampScatter,
  groundHeight,
} from "@/lib/world/camp";
import { camp } from "./palette";

/**
 * The ground the camp is standing on, and the edge of the frame.
 *
 * Grass and stones, both instanced, both placed once. §4 puts the foreground
 * last in its composition order and it belongs there: something near and dark
 * along the bottom edge is what stops a scene reading as a painting held at
 * arm's length. Without it the ground plane runs to the frame edge as a flat
 * wash and the whole thing flattens.
 *
 * Denser toward the camera and cleared around the fire and the table, both
 * decided in the generator rather than here — grass growing through the middle
 * of a campsite says nobody has been standing there, which is the one thing
 * this scene must not say.
 *
 * ---
 *
 * §11 asks for a small library of shapes rather than one repeated, and the
 * foreground is the second place that matters: this is the nearest geometry in
 * the frame and the camera is looking down at it. A field of identical
 * icosahedra is not a stony bank, it is the same stone forty times.
 *
 * Four rocks and three shrubs, each a different solid rather than the same
 * solid rescaled — a dodecahedron and an octahedron catch the firelight on
 * different numbers of faces, which is most of what makes a scatter look
 * gathered rather than generated.
 */

function Instanced({
  items,
  geometry,
  colour,
}: {
  items: Scattered[];
  geometry: BufferGeometry;
  colour: string;
}) {
  const mesh = useRef<InstancedMesh | null>(null);

  useLayoutEffect(() => {
    const node = mesh.current;
    if (!node) return;

    const scratch = new Object3D();
    items.forEach((item, i) => {
      /* On the ground, not at the height the ground used to be. Everything
         out here is past the flat patch the camp is pitched on, so an item
         placed at zero would hang above a trough or sink into a crest —
         which at this size means half of them would look wrong. */
      scratch.position.set(item.x, groundHeight(item.x, item.z), item.z);
      scratch.rotation.set(0, item.turn, 0);
      scratch.scale.setScalar(item.scale);
      scratch.updateMatrix();
      node.setMatrixAt(i, scratch.matrix);
    });
    node.instanceMatrix.needsUpdate = true;
  }, [items]);

  if (items.length === 0) return null;

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, items.length]} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={colour} roughness={1} metalness={0} />
    </instancedMesh>
  );
}

/** Sorts a scatter into one bucket per variant, once. */
function useBuckets(items: Scattered[], variants: number) {
  return useMemo(() => {
    const out: Scattered[][] = Array.from({ length: variants }, () => []);
    items.forEach((item) => out[item.variant % variants].push(item));
    return out;
  }, [items, variants]);
}

export function CampScatter({
  grass: grassCount,
  stones: stoneCount,
}: {
  grass: number;
  stones: number;
}) {
  /* Two passes rather than one: grass wants to reach the camera, stones want
     to stay out among the cleared ground where they read as ground rather
     than as litter. */
  const grass = useMemo(
    () =>
      buildCampScatter(
        "camp-grass",
        grassCount,
        { x: 7.5, near: 4.6, far: -5.5 },
        SHRUB_VARIANTS,
      ),
    [grassCount],
  );
  const stones = useMemo(
    () =>
      buildCampScatter(
        "camp-stones",
        stoneCount,
        { x: 6.5, near: 3.4, far: -6.5 },
        ROCK_VARIANTS,
      ),
    [stoneCount],
  );

  /*
    A tuft, not a blade — one blade per instance would need ten times the
    instances to read at all. What changes between the three is how much of
    the ground each one claims: a low clump, the standard tuft, and a thin
    sprig that has come up on its own.
  */
  const shrubs = useMemo(
    () => [
      new ConeGeometry(0.09, 0.34, 4),
      new ConeGeometry(0.135, 0.22, 5),
      new ConeGeometry(0.055, 0.44, 4),
    ],
    [],
  );

  /*
    Low and faceted. A sphere reads as a ball; a solid half sunk in the ground
    reads as a stone. The flattened one is the same icosahedron squashed,
    because a bank of stones has slabs in it as well as lumps.
  */
  const rocks = useMemo(
    () => [
      new IcosahedronGeometry(0.16, 0),
      new DodecahedronGeometry(0.15, 0),
      new OctahedronGeometry(0.17, 0),
      new IcosahedronGeometry(0.19, 0).scale(1, 0.52, 1),
    ],
    [],
  );

  useLayoutEffect(
    () => () => [...shrubs, ...rocks].forEach((g) => g.dispose()),
    [shrubs, rocks],
  );

  const shrubBuckets = useBuckets(grass, SHRUB_VARIANTS);
  const rockBuckets = useBuckets(stones, ROCK_VARIANTS);

  return (
    <group>
      {shrubs.map((geometry, i) => (
        <Instanced key={`shrub-${i}`} items={shrubBuckets[i]} geometry={geometry} colour={camp.grass} />
      ))}

      {rocks.map((geometry, i) => (
        <Instanced key={`rock-${i}`} items={rockBuckets[i]} geometry={geometry} colour={camp.rock} />
      ))}
    </group>
  );
}
