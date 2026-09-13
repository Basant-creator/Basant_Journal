"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Object3D, type InstancedMesh } from "three";
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

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, trees.length]} frustumCulled={false}>
      {/* Unit cone, scaled per instance. Four radial segments: at this size
          and this light a rounder tree is more triangles for no picture. */}
      <coneGeometry args={[1, 1, 5]} />
      <meshBasicMaterial color={land.treeline} fog />
    </instancedMesh>
  );
}
