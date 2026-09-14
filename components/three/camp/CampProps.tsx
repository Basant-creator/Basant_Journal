"use client";

import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  type BufferGeometry,
  Color,
  DoubleSide,
  InstancedMesh,
  type Mesh,
  MeshStandardMaterial,
  Object3D,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { QualityTier } from "@/lib/three/quality";
import { CAMP_PROPS, type PropId, type PropPlacement, type PropSurface, propsFor } from "@/lib/world/campProps";
import { useTimberTexture } from "./CampTimber";
import { camp } from "./palette";

/**
 * The supplied props, dressed in the Camp's own materials.
 *
 * Two packs were supplied and neither ships in one piece. `bake-camp-props`
 * takes thirteen shapes out of eighty and writes them as geometry with no
 * materials at all, which is the important half of §13: the packs came from
 * two artists with two ideas about what wood looks like, and the Camp has
 * spent twenty steps deciding for itself. A barrel that arrives in its own
 * brown beside a table built from `useTimberTexture` is one object announcing
 * that it came from somewhere else.
 *
 * So the geometry arrives and the surfaces are the scene's. Six families,
 * shared across every prop, which is also six materials instead of forty-nine
 * — the fort pack alone shipped one material per mesh, most of them copies of
 * each other.
 *
 * Repeats are instanced (§20). Two rails, two barrels and two supply crates
 * are three draw calls rather than six, and the cost of adding a third of
 * anything is a matrix.
 */

const MODEL = "/frontier/camp/models/camp-props.glb";

/** Degrees, because the placements are written in them. */
const RAD = Math.PI / 180;

function useSurfaces(): Record<PropSurface, MeshStandardMaterial> {
  /* The same procedural timber the table and the tent poles are built from.
     Repeated tightly: a crate is small, and a grain that reads correctly on a
     two-metre trestle is a smear on a 58cm box. */
  const timber = useTimberTexture(2, 2);

  const materials = useMemo(() => {
    const make = (colour: string, roughness: number, metalness = 0) =>
      new MeshStandardMaterial({ color: new Color(colour), roughness, metalness });

    return {
      timber: make(camp.timber, 0.88),
      timberDark: make(camp.timberDark, 0.92),
      /* Canvas is the lightest thing in the camp and the fire paints it —
         double-sided because a tent you can see the inside of is a tent. */
      canvas: Object.assign(make(camp.canvas, 0.96), { side: DoubleSide }),
      rock: make(camp.rock, 0.94),
      /* Capped well below 1: without an envMap a metal in three has nothing
         to reflect and renders black. Same cap the brass carries. */
      iron: make("#3b3d42", 0.58, 0.45),
      sack: make(camp.rope, 0.98),
    } satisfies Record<PropSurface, MeshStandardMaterial>;
  }, []);

  /* The timber map arrives a frame or two after the materials; assigning it
     when it lands is cheaper than rebuilding the set. */
  useEffect(() => {
    if (!timber) return;
    materials.timber.map = timber;
    materials.timberDark.map = timber;
    materials.timber.needsUpdate = true;
    materials.timberDark.needsUpdate = true;
  }, [materials, timber]);

  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);

  return materials;
}

/** One InstancedMesh per (model, surface) pair, seated by the registry. */
function Instanced({
  geometry,
  material,
  placements,
}: {
  geometry: BufferGeometry;
  material: MeshStandardMaterial;
  placements: PropPlacement[];
}) {
  const mesh = useMemo(() => {
    const instanced = new InstancedMesh(geometry, material, placements.length);
    instanced.castShadow = true;
    instanced.receiveShadow = true;

    const dummy = new Object3D();
    placements.forEach((p, i) => {
      dummy.position.set(p.at[0], p.at[1], p.at[2]);
      dummy.rotation.set((p.tilt?.[0] ?? 0) * RAD, p.turn, (p.tilt?.[1] ?? 0) * RAD);
      dummy.scale.setScalar(p.scale ?? 1);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
    /* Written once and never again, so three can stop checking. */
    instanced.frustumCulled = false;

    return instanced;
  }, [geometry, material, placements]);

  useEffect(() => () => mesh.dispose(), [mesh]);

  return <primitive object={mesh} />;
}

export function CampProps({ tier }: { tier: QualityTier }) {
  const gltf = useLoader(GLTFLoader, MODEL);
  const surfaces = useSurfaces();

  /* The baked file is one node per prop, named by its registry id. */
  const geometries = useMemo(() => {
    const out = new Map<PropId, BufferGeometry>();
    gltf.scene.traverse((node) => {
      const mesh = node as Mesh;
      if (mesh.isMesh) out.set(mesh.name as PropId, mesh.geometry);
    });
    return out;
  }, [gltf]);

  /* Grouped so each distinct model/surface pair becomes one draw call. */
  const groups = useMemo(() => {
    const wanted = tier === "fallback" ? [] : propsFor(tier);
    const byKey = new Map<string, PropPlacement[]>();
    for (const p of wanted) {
      const key = `${p.id}|${p.surface}`;
      const list = byKey.get(key);
      if (list) list.push(p);
      else byKey.set(key, [p]);
    }
    return [...byKey.entries()].map(([key, placements]) => ({ key, placements }));
  }, [tier]);

  return (
    <group>
      {groups.map(({ key, placements }) => {
        const geometry = geometries.get(placements[0].id);
        if (!geometry) return null;
        return (
          <Instanced
            key={key}
            geometry={geometry}
            material={surfaces[placements[0].surface]}
            placements={placements}
          />
        );
      })}
    </group>
  );
}

/** How many props the registry holds, for the docs and the budget. */
export const CAMP_PROP_COUNT = CAMP_PROPS.length;
