"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AnimationMixer,
  Color,
  type Group,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { splitMaterial } from "@/lib/three/split";
import { HERD_RANGE, type HerdHorse } from "@/lib/world/frontier";
import { hours } from "../hours";

const MODEL = "/frontier/landing/horse.glb";

/** The clip the herd runs on. Baked into the model beside `Idle`. */
const GALLOP = "Gallop";

interface HorseHerd3DProps {
  horses: HerdHorse[];
  /** Still, for reduced motion: the herd stands rather than gallops. */
  still?: boolean;
}

/**
 * Wild horses, crossing the middle distance.
 *
 * The animation is the whole reason this is three dimensions rather than a
 * drawing. A gallop is a four-beat gait with a moment of suspension in it, and
 * hand-authoring one as path data was tried in this phase and failed three
 * times — the supplied model has the real cycle in it, rigged, and playing it
 * is the one thing a renderer does here that nothing else could.
 *
 * Everything else stays flat on purpose. The horses render as near-black
 * silhouettes against the sky, because the landing is a tonal composition and
 * eight lit materials from an asset pack would read as a different world
 * dropped into this one — the same §13 problem the Camp's props had, and the
 * same answer: the forms come through and the surfaces stay behind.
 *
 * Three details that are not obvious and cost a session each when missed:
 *
 *   1. **A skinned mesh cannot be cloned with `.clone()`.** The copy shares
 *      its skeleton with the original and every instance then plays the same
 *      pose. `SkeletonUtils.clone` rebuilds the bone hierarchy per copy, which
 *      is what lets six horses be at six points in the same stride.
 *   2. **One mixer per horse.** A mixer owns a time, so a shared one is a
 *      shared stride.
 *   3. **The gait is tied to the ground speed.** A faster horse whose legs
 *      turn over at the clip's authored rate is skating, and skating is the
 *      single most obvious tell in an animated crowd.
 */
export function HorseHerd3D({ horses, still = false }: HorseHerd3DProps) {
  const gltf = useLoader(GLTFLoader, MODEL);

  /*
    One material for the whole herd.

    The model arrives with eight — coat, mane, muzzle, hooves, two eye
    materials — and at this distance every one of them resolves to the same
    dark shape. Overriding them is both the cheaper draw and the correct
    picture.
  */
  const coat = useMemo(
    () =>
      splitMaterial(
        new MeshStandardMaterial({
          /*
            White, with the colour coming from the split instead.

            The patched shader *multiplies* the hour's tone into whatever the
            material already holds, so leaving the old dark blue here would
            square it and the herd would go to black. White is the identity
            for that multiply, which makes both hour colours mean exactly what
            they say.

            This is also all §21 needs: the herd is the same meshes, the same
            mixers and the same gallop either side of the boundary. Nothing
            reloads, nothing teleports - the light simply reaches them.
          */
          color: new Color("#ffffff"),
          roughness: 0.94,
          metalness: 0,
        }),
        hours.dusk.creature,
        hours.dawn.creature,
      ),
    [],
  );

  /* Built once per horse: a rebuilt skeleton, a mixer of its own, and the
     gallop wound forward to its own point in the stride. */
  const instances = useMemo(() => {
    return horses.map((horse) => {
      const object = cloneSkinned(gltf.scene) as Object3D;

      object.traverse((node) => {
        if (node instanceof Mesh) {
          node.material = coat;
          /* The herd is in the middle distance and casts nothing anyone can
             resolve; §29 says spend the shadow budget where it reads. */
          node.castShadow = false;
          node.receiveShadow = false;
        }
      });

      const mixer = new AnimationMixer(object);
      const clip = gltf.animations.find((a) => a.name === GALLOP) ?? gltf.animations[0];
      const action = mixer.clipAction(clip);
      action.play();
      action.timeScale = horse.gait;
      /* Wound forward rather than delayed: a delayed action holds its first
         frame, so six horses would stand still together and then start. */
      mixer.setTime(horse.phase);

      return { horse, object, mixer };
    });
  }, [coat, gltf.animations, gltf.scene, horses]);

  /* Materials and mixers are this component's, so this component frees them.
     The cloned scenes share the source geometry, which belongs to the loader
     cache and must not be disposed here. */
  useEffect(() => {
    return () => {
      for (const { mixer } of instances) mixer.stopAllAction();
      coat.dispose();
    };
  }, [coat, instances]);

  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (still) return;
    for (const { horse, object, mixer } of instances) {
      mixer.update(delta);
      object.position.x += horse.speed * delta;
      /* Off the end of the run and back to the far edge. The wrap is silent
         because it happens well outside the frame. */
      if (object.position.x > HERD_RANGE.to) {
        object.position.x = HERD_RANGE.from;
      }
    }
  });

  return (
    <group ref={group}>
      {instances.map(({ horse, object }) => (
        <primitive
          key={horse.id}
          object={object}
          position={[horse.x, 0, horse.z]}
          /* The model faces -z; the herd runs along +x. */
          rotation={[0, Math.PI / 2, 0]}
          scale={horse.scale}
        />
      ))}
    </group>
  );
}
