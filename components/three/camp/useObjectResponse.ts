"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, MeshStandardMaterial } from "three";

export type ObjectState = "rest" | "hover" | "active";

/**
 * How an object answers being reached for.
 *
 * §23 is specific about the vocabulary and, more usefully, about its limits:
 * slight brightness, a tiny elevation, a small field label — and no giant
 * tooltip boxes, because the world itself is supposed to supply the context.
 * So the response here is two things only, a lift and a warmth, and both are
 * small enough that you notice the object rather than the effect.
 *
 * The lift is what does the work. An object that brightens has been
 * highlighted; an object that rises has been *picked up a little*, which is
 * the difference §24 is after between handling something and clicking a
 * hyperlink.
 *
 * Three states, not four. Focus belongs to the DOM control over the object —
 * a focus ring is the focusable thing's business — so a focused object arrives
 * here as `hover` and the geometry answers the keyboard exactly as it answers
 * a pointer. That is the same split the illustrated camp already makes.
 *
 * Frame-rate independent, and nothing allocated per frame: the same two rules
 * everything else in this folder is built on.
 */
export function useObjectResponse(state: ObjectState, base: number) {
  const group = useRef<Group | null>(null);
  const face = useRef<MeshStandardMaterial | null>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    /* Faster than the camera. A held object should feel light in the hand;
       a slow lift reads as machinery. */
    const k = 1 - Math.exp(-9 * dt);

    const lift = state === "active" ? 0.055 : state === "hover" ? 0.022 : 0;
    const warmth = state === "active" ? 0.34 : state === "hover" ? 0.16 : 0;
    if (group.current) {
      group.current.position.y += (base + lift - group.current.position.y) * k;
    }
    if (face.current) {
      face.current.emissiveIntensity +=
        (warmth - face.current.emissiveIntensity) * k;
    }
  });

  return { group, face };
}
