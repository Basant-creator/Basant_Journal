"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Object3D, type InstancedMesh } from "three";
import { buildCampScatter, groundHeight } from "@/lib/world/camp";
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
 */
function Instances({
  items,
  colour,
  children,
}: {
  items: ReturnType<typeof buildCampScatter>;
  colour: string;
  children: React.ReactNode;
}) {
  const mesh = useRef<InstancedMesh | null>(null);

  useLayoutEffect(() => {
    const node = mesh.current;
    if (!node) return;

    const scratch = new Object3D();
    items.forEach((item, i) => {
      /* On the ground, not at the height the ground used to be. Everything
         out here is past the flat patch the camp is pitched on, so a tuft
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

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, items.length]} frustumCulled={false}>
      {children}
      <meshStandardMaterial color={colour} roughness={1} metalness={0} />
    </instancedMesh>
  );
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
    () => buildCampScatter("camp-grass", grassCount, { x: 7.5, near: 4.6, far: -5.5 }),
    [grassCount],
  );
  const stones = useMemo(
    () => buildCampScatter("camp-stones", stoneCount, { x: 6.5, near: 3.4, far: -6.5 }),
    [stoneCount],
  );

  return (
    <group>
      <Instances items={grass} colour={camp.grass}>
        {/* A tuft, not a blade: four sides and a point, scaled small. One
            blade per instance would need ten times the instances to read. */}
        <coneGeometry args={[0.09, 0.34, 4]} />
      </Instances>

      <Instances items={stones} colour={camp.rock}>
        {/* Low and faceted. A sphere reads as a ball; an icosahedron half
            sunk in the ground reads as a stone. */}
        <icosahedronGeometry args={[0.16, 0]} />
      </Instances>
    </group>
  );
}
