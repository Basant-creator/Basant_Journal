"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { CameraRig } from "../CameraRig";
import { CampLight } from "../CampLight";
import { ObjectAnchors, type AnchorMap } from "../ObjectAnchors";
import { SceneCanvas } from "../SceneCanvas";
import { Terrain } from "../Terrain";
import { camp, fire, scene } from "../palette";
import type { SceneProps } from "../types";

/**
 * Where the four objects lie on the table.
 *
 * The ids are `CampObjectId`s and that is the entire point of the bridge: the
 * DOM's tablist, the 2D artwork and this scene all name the same four things,
 * so a hover in one is a hover in all of them without anything translating
 * between two vocabularies.
 *
 * Left to right in the same order the 2D camp lays them out, so moving between
 * the two renderings does not rearrange the table.
 */
const OBJECTS = {
  notebook: [-1.45, 0.66, 2.15],
  photograph: [-0.48, 0.66, 2.32],
  notes: [0.5, 0.66, 2.28],
  map: [1.5, 0.66, 2.1],
} as const satisfies AnchorMap;

type ObjectId = keyof typeof OBJECTS;

/** One object on the table, reacting to a selection made in the DOM. */
function CampObject({
  id,
  state,
}: {
  id: ObjectId;
  state: "rest" | "hover" | "active";
}) {
  const group = useRef<Group | null>(null);
  const [x, y, z] = OBJECTS[id];

  /* Lift and settle. The same three states the 2D artwork uses, and the same
     reading of them: focus is the control's business, so a focused object
     arrives here as "hover" and the drawing answers the keyboard exactly as it
     answers a pointer. */
  const lift = state === "active" ? 0.14 : state === "hover" ? 0.06 : 0;

  useFrame((_, delta) => {
    if (!group.current) return;
    const k = 1 - Math.exp(-6 * Math.min(delta, 0.1));
    group.current.position.y += (y + lift - group.current.position.y) * k;
  });

  return (
    <group ref={group} position={[x, y, z]}>
      <mesh rotation={[-Math.PI / 2, id === "map" ? 0.18 : -0.12, 0]}>
        <planeGeometry args={[0.62, 0.46]} />
        <meshStandardMaterial
          color={camp.paper}
          roughness={0.92}
          emissive={fire.body}
          emissiveIntensity={state === "rest" ? 0 : state === "hover" ? 0.12 : 0.22}
        />
      </mesh>
    </group>
  );
}

function Rig({ activeId, hoverId, anchorTarget }: SceneProps) {
  const embers = useRef<Group | null>(null);

  const ids = useMemo(() => Object.keys(OBJECTS) as ObjectId[], []);

  useFrame((state) => {
    if (!embers.current) return;
    embers.current.rotation.y = state.clock.elapsedTime * 0.08;
  });

  return (
    <>
      <CameraRig
        home={[0, 1.35, 5.6]}
        target={[0, 0.7, 1.6]}
        focus={activeId && activeId in OBJECTS ? OBJECTS[activeId as ObjectId] : null}
        /* A lean, not a dive. At 0.5 the camera travelled far enough onto the
           chosen object to throw the other three out of frame entirely —
           measured at 166% and 280% across the viewport — which is the
           opposite of what picking something up should do. The 2D camp does
           not move its camera on selection at all; this is the smallest
           amount that still reads as attention. */
        pull={0.16}
      />
      <CampLight at={[0, 0.5, 0.9]} />
      <Terrain />

      {/* The fire: three logs and a scatter of embers. The light does the
          work — this is only what the light is coming from. */}
      <group position={[0, 0, 0.9]}>
        {[-0.34, 0, 0.32].map((offset, i) => (
          <mesh key={i} position={[offset, 0.09, i === 1 ? 0.12 : 0]} rotation={[0, i * 0.7, 0.08]}>
            <cylinderGeometry args={[0.07, 0.08, 0.78, 6]} />
            <meshStandardMaterial color={fire.log} roughness={1} />
          </mesh>
        ))}
        <group ref={embers}>
          {Array.from({ length: 12 }).map((_, i) => (
            <mesh
              key={`ember-${i}`}
              position={[
                Math.sin(i * 2.4) * 0.3,
                0.3 + (i % 4) * 0.16,
                Math.cos(i * 1.7) * 0.26,
              ]}
            >
              <sphereGeometry args={[0.015, 5, 5]} />
              <meshBasicMaterial color={fire.core} />
            </mesh>
          ))}
        </group>
      </group>

      {/* The tent, as a silhouette behind the fire. */}
      <mesh position={[-2.6, 0.72, -0.4]} rotation={[0, 0.42, 0]}>
        <coneGeometry args={[1.25, 1.5, 4]} />
        <meshStandardMaterial color={camp.canvas} roughness={1} />
      </mesh>

      {/* The table the record lies on. */}
      <mesh position={[0, 0.62, 2.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.2, 1.5]} />
        <meshStandardMaterial color={camp.timber} roughness={0.95} />
      </mesh>

      {ids.map((id) => (
        <CampObject
          key={id}
          id={id}
          state={activeId === id ? "active" : hoverId === id ? "hover" : "rest"}
        />
      ))}

      {anchorTarget ? <ObjectAnchors anchors={OBJECTS} into={anchorTarget} /> : null}
    </>
  );
}

/**
 * Camp, rendered.
 *
 * The same place as the 2D camp and not a second one: the ridges behind it are
 * built from the survey map's own seeded profile, and the four objects on the
 * table carry the same ids the DOM tablist and the illustrated scene use. The
 * renderer changes; the world does not.
 */
export function CampScene3D(props: SceneProps) {
  return (
    <SceneCanvas
      background={scene.night}
      fog={{ color: scene.night, near: 10, far: 52 }}
      camera={{ position: [0, 1.35, 5.6], fov: 44 }}
    >
      <Rig {...props} />
    </SceneCanvas>
  );
}
