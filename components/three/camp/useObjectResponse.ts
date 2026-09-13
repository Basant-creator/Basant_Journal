"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from "three";

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
  /**
   * An optional second thing an object can do when reached for.
   *
   * Most objects only lift and warm. The map also has a mark on it that
   * means something — §18 wants its route to come up, because that route is
   * how a visitor recognises this as the map they arrived from rather than
   * as a map. Carrying it here keeps one frame loop and one set of timings;
   * a second useFrame for one opacity would be a second place for the
   * damping rules to drift.
   */
  const accent = useRef<MeshBasicMaterial | null>(null);
  /**
   * The dark under the object, which does not rise with it.
   *
   * §36 lists a shadow change among the things a hero object should do when
   * it is reached for, and nothing in the scene could deliver one: the fire
   * casts real shadows and its map is frozen after six frames, so a lift has
   * no shadow consequence at all. An object rising with its shadow unchanged
   * does not read as rising — it reads as getting bigger, which is the one
   * response §36 explicitly rules out.
   *
   * This is a mesh rather than a material because both its scale and its
   * opacity move. It lives outside the lifting group, on the table, and is
   * driven from here so the whole response stays in one frame loop and one
   * set of damping constants.
   */
  const shade = useRef<Mesh | null>(null);
  /**
   * A cover, on its hinge.
   *
   * The third thing an object can optionally do, alongside the map's accent.
   * Only the notebook uses it, and §37 is why: opening it is named as one of
   * the signature moments of the phase, and an object that becomes a document
   * without ever appearing to open is a link with a picture on it.
   *
   * Slower than the lift. A cover has mass and a lift does not — the same
   * damping on both would make the board snap up like a lid on a spring.
   */
  const cover = useRef<Group | null>(null);

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
    if (cover.current) {
      /* 85 degrees. Ninety would stand it dead vertical and edge-on; past
         ninety it leans off the table, which was measured at 100 degrees
         reaching x -0.203 against a table edge at -0.200. At 85 the inner
         face turns toward the camera, which is the face §37 wants seen. */
      const angle = state === "active" ? 1.48 : 0;
      const slow = 1 - Math.exp(-5.5 * dt);
      cover.current.rotation.z += (angle - cover.current.rotation.z) * slow;
    }

    if (shade.current) {
      /* Wider and fainter as the object leaves the surface, which is what a
         shadow from a broad dim source actually does with separation — the
         cheap trick and the physics agree here. */
      const spread = 1 + (lift / 0.055) * 0.34;
      const dark = state === "rest" ? 1 : state === "hover" ? 0.78 : 0.6;
      const s = shade.current.scale;
      s.setScalar(s.x + (spread - s.x) * k);
      const material = shade.current.material as MeshBasicMaterial;
      material.opacity += (dark * 0.55 - material.opacity) * k;
    }

    if (accent.current) {
      /* Further than the warmth goes, because a line has to clear the
         parchment under it to read at all, and subtler than it sounds:
         0.9 of a two-pixel dashed rule at four metres is a hint. */
      const mark = state === "active" ? 0.9 : state === "hover" ? 0.62 : 0;
      accent.current.opacity += (mark - accent.current.opacity) * k;
    }
  });

  return { group, face, accent, shade, cover };
}
