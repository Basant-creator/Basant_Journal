"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";

export interface CameraRigProps {
  /** Where the camera rests. */
  home?: [number, number, number];
  /** What it looks at when nothing is framed. */
  target?: [number, number, number];
  /**
   * A point to frame. Null returns to `home`. This is the same vocabulary the
   * 2D SceneCamera uses, deliberately: a scene should not need a different
   * mental model because it happens to be rendered with a GPU.
   */
  focus?: [number, number, number] | null;
  /** How far toward a focused point the camera travels. Never all the way. */
  pull?: number;
  /** Metres of pointer sway, horizontal and vertical. */
  sway?: [number, number];
  /** Damping rate. Higher is tighter; this is not a snappy camera. */
  lambda?: number;
}

/**
 * The camera.
 *
 * Not OrbitControls, and the omission is the design. Orbit makes the scene an
 * object the visitor spins, and this is a place they look into — the same
 * distinction the 2D engine draws when it gives scenes a reticle and documents
 * a pointer. A portfolio that can be turned upside down by dragging is a demo.
 *
 * So: the camera rests at `home`, looks at `target`, and the pointer moves it
 * a little. The 2D depth tokens call their own version "a head tilt, not a
 * swoop" and the amounts here are chosen to match — under half a metre at the
 * extremes, on a scene six metres deep.
 *
 * Three things are load-bearing rather than incidental:
 *
 *   1. **Damping is frame-rate independent.** `1 - exp(-lambda * dt)` rather
 *      than a fixed per-frame fraction, so the camera behaves identically at
 *      60Hz, 120Hz and whatever a throttled background tab produces. The naive
 *      version is twice as fast on a 120Hz display, which is the kind of bug
 *      that is invisible on the machine it was written on.
 *   2. **Delta is capped.** SceneCanvas stops the frameloop when the canvas
 *      leaves the viewport, so the first frame after it returns can carry an
 *      arbitrarily large delta. Uncapped, the camera lurches on scroll-back.
 *   3. **Nothing is allocated per frame.** The vectors are created once and
 *      mutated. Sixty allocations a second, thrown away, is how a scene earns
 *      a stutter every few seconds when the collector runs.
 *
 * Reduced motion is not handled here because it cannot arrive here: ThreeScene
 * resolves capability before mounting and renders the illustrated fallback
 * instead, and it re-checks if the setting changes mid-visit. A guard in this
 * file would be dead code that implies the opposite.
 */
export function CameraRig({
  home = [0, 1.6, 6],
  target = [0, 0.6, 0],
  focus = null,
  pull = 0.42,
  sway = [0.55, 0.28],
  lambda = 2.4,
}: CameraRigProps) {
  const { camera } = useThree();

  /* Allocated once. See note 3 above. */
  const desired = useRef(new Vector3());
  const lookAt = useRef(new Vector3(...target));
  const homeVec = useRef(new Vector3(...home));
  const focusVec = useRef(new Vector3());

  /*
    A coarse pointer is not a pointer to sway with — the same rule the 2D Scene
    applies when it ignores everything that is not a mouse. ThreeScene already
    refuses to mount below 860px, but a large tablet clears that bar and still
    has no cursor to follow.
  */
  const fine = useRef(true);
  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const sync = () => {
      fine.current = query.matches;
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const k = 1 - Math.exp(-lambda * dt);

    homeVec.current.set(home[0], home[1], home[2]);
    desired.current.copy(homeVec.current);

    /* Framing: travel part of the way toward the point, never onto it. The
       scene has to stay readable behind whatever is being looked at. */
    if (focus) {
      focusVec.current.set(focus[0], focus[1], focus[2]);
      desired.current.lerp(focusVec.current, pull);
    }

    /* The tilt. state.pointer is already normalised to -1..1 by the Canvas. */
    if (fine.current) {
      desired.current.x += state.pointer.x * sway[0];
      desired.current.y += state.pointer.y * sway[1];
    }

    camera.position.lerp(desired.current, k);

    /* The aim leans by the same fraction the position travels, rather than
       snapping onto the focused point. Looking *straight at* an object puts
       it dead centre and swings everything else toward the edges — measured
       on Camp at 140% across the viewport, with a neighbouring object pushed
       clean out of frame. Biasing the aim keeps the group in view and still
       says which one is being attended to. */
    const bias = focus ? pull : 0;
    for (let i = 0; i < 3; i += 1) {
      const base = target[i];
      const aim = focus ? base + (focus[i] - base) * bias : base;
      const key = i === 0 ? "x" : i === 1 ? "y" : "z";
      lookAt.current[key] += (aim - lookAt.current[key]) * k;
    }
    camera.lookAt(lookAt.current);
  });

  return null;
}
