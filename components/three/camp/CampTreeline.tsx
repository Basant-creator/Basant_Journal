"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, type Group, type InstancedMesh } from "three";
import { buildTreeStand } from "@/lib/world/camp";
import { land } from "./palette";

/**
 * The tree line, in one draw call.
 *
 * Sixty-odd conifers as an InstancedMesh rather than sixty-odd meshes, which
 * is what §32 means by instancing where possible: one geometry, one material,
 * one call, and the per-tree difference carried in a matrix. Sixty separate
 * meshes would be sixty state changes a frame to draw the same silhouette.
 *
 * The matrices are written once in a layout effect, not per frame. Nothing
 * about a tree line changes after it is placed, and re-uploading an instance
 * buffer every frame to move nothing is the kind of cost that only shows up on
 * the machines least able to afford it.
 *
 * Unlit, like everything else out here. A cone that catches light at blue hour
 * reads as plastic; a dark cone against a lighter band reads as a tree.
 */
export function CampTreeline() {
  const trees = useMemo(() => buildTreeStand(), []);
  const mesh = useRef<InstancedMesh | null>(null);
  const stand = useRef<Group | null>(null);

  useLayoutEffect(() => {
    const node = mesh.current;
    if (!node) return;

    /* One scratch object, reused. Sixty allocations for sixty trees is sixty
       more than this needs. */
    const scratch = new Object3D();

    trees.forEach((tree, i) => {
      scratch.position.set(tree.x, tree.height / 2, tree.z);
      scratch.rotation.set(0, 0, tree.lean);
      scratch.scale.set(tree.radius, tree.height, tree.radius);
      scratch.updateMatrix();
      node.setMatrixAt(i, scratch.matrix);
    });

    node.instanceMatrix.needsUpdate = true;
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
      <instancedMesh ref={mesh} args={[undefined, undefined, trees.length]} frustumCulled={false}>
      {/* Unit cone, scaled per instance. Four radial segments: at this size
          and this light a rounder tree is more triangles for no picture. */}
        <coneGeometry args={[1, 1, 5]} />
        <meshBasicMaterial color={land.treeline} fog />
      </instancedMesh>
    </group>
  );
}
