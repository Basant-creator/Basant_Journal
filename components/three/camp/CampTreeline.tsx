"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { ConeGeometry, Object3D, type Group, type InstancedMesh } from "three";
import { TREE_VARIANTS, buildTreeStand } from "@/lib/world/camp";
import { land } from "./palette";

/**
 * The stand of trees behind the camp.
 *
 * Instanced, because sixty trees drawn one at a time is sixty draw calls on
 * the machines least able to afford it.
 *
 * Unlit, like everything else out here. A cone that catches light at blue hour
 * reads as plastic; a dark cone against a lighter band reads as a tree.
 *
 * ---
 *
 * §11 asks for a small library of shapes distributed deterministically rather
 * than one shape repeated, and the treeline is where that matters most: these
 * are silhouettes against the brightest part of the frame, so the outline is
 * the entire object. Sixty identical outlines is a pattern, and the eye finds
 * a pattern in a treeline immediately.
 *
 * Four shapes, each built as tiers in unit space — base at zero, tip at one —
 * so a single per-tree matrix of (radius, height, radius) places every tier at
 * once. Each tier is its own instanced mesh sharing that matrix, which avoids
 * merging geometry and keeps the whole stand at nine draw calls.
 */

type Tier = { r: number; h: number; c: number; seg: number };

/**
 * The library. Read as profiles rather than as numbers:
 *
 *   spire    one clean cone — the shape the stand used to be, entirely
 *   stepped  three skirts, which is what a fir actually looks like
 *   broad    low and wide, the tree that had room
 *   sparse   thin, with a tuft on top; the old one that lost its lower limbs
 */
const TREES: Tier[][] = [
  [{ r: 1, h: 1, c: 0.5, seg: 6 }],
  [
    { r: 1, h: 0.5, c: 0.25, seg: 6 },
    { r: 0.72, h: 0.42, c: 0.55, seg: 6 },
    { r: 0.44, h: 0.34, c: 0.8, seg: 5 },
  ],
  [
    { r: 1.18, h: 0.62, c: 0.31, seg: 6 },
    { r: 0.7, h: 0.5, c: 0.68, seg: 5 },
  ],
  [
    { r: 0.62, h: 0.86, c: 0.43, seg: 5 },
    { r: 0.3, h: 0.3, c: 0.85, seg: 5 },
  ],
];

function Tiers({
  tiers,
  matrices,
}: {
  tiers: Tier[];
  matrices: Object3D[];
}) {
  const geometries = useMemo(
    () => tiers.map((t) => new ConeGeometry(t.r, t.h, t.seg).translate(0, t.c, 0)),
    [tiers],
  );

  useLayoutEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);

  return (
    <>
      {geometries.map((geometry, i) => (
        <Instanced key={i} geometry={geometry} matrices={matrices} />
      ))}
    </>
  );
}

function Instanced({ geometry, matrices }: { geometry: ConeGeometry; matrices: Object3D[] }) {
  const mesh = useRef<InstancedMesh | null>(null);

  useLayoutEffect(() => {
    const node = mesh.current;
    if (!node) return;
    matrices.forEach((m, i) => node.setMatrixAt(i, m.matrix));
    node.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  if (matrices.length === 0) return null;

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, matrices.length]}
      frustumCulled={false}
    >
      <primitive object={geometry} attach="geometry" />
      <meshBasicMaterial color={land.treeline} fog />
    </instancedMesh>
  );
}

export function CampTreeline({ count }: { count: number }) {
  const trees = useMemo(() => buildTreeStand(count), [count]);
  const stand = useRef<Group | null>(null);

  /* One matrix per tree, sorted into the variant it belongs to. Built once,
     outside any frame, and shared by every tier of that variant. */
  const byVariant = useMemo(() => {
    const groups: Object3D[][] = Array.from({ length: TREE_VARIANTS }, () => []);
    trees.forEach((tree) => {
      const o = new Object3D();
      o.position.set(tree.x, 0, tree.z);
      o.rotation.set(0, 0, tree.lean);
      o.scale.set(tree.radius, tree.height, tree.radius);
      o.updateMatrix();
      groups[tree.variant % TREE_VARIANTS].push(o);
    });
    return groups;
  }, [trees]);

  /*
    §12 asks for very subtle tree movement, and the matrices above are
    written once on purpose — animating them would mean re-uploading the
    whole instance buffer every frame to move sixty trees a few
    centimetres, which is the precise cost the instancing was for.

    So the stand leans as one thing instead. A single group transform per
    frame, no buffer touched, and at this distance the difference between
    sixty trees moving independently and sixty trees moving together is not
    visible — the same trick the Phase 5 dust uses, and for the same reason.

    Two slow waves, well under a degree. Trees at forty metres in still air
    at dusk should be almost, but not quite, still.
  */
  useFrame((state) => {
    const node = stand.current;
    if (!node) return;
    const t = state.clock.elapsedTime;
    node.rotation.z = Math.sin(t * 0.17) * 0.004 + Math.sin(t * 0.41) * 0.0018;
  });

  return (
    <group ref={stand}>
      {TREES.map((tiers, i) => (
        <Tiers key={i} tiers={tiers} matrices={byVariant[i]} />
      ))}
    </group>
  );
}
