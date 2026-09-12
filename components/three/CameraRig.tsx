"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";

export type Vec3 = [number, number, number];

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

/**
 * Smootherstep: eased at both ends, symmetric about the middle.
 *
 * Not --ease-cinematic, and deliberately not. That curve is a strong
 * ease-out built for something appearing — it covers 97% of its distance
 * in the first half, which is right for a card settling onto a page and
 * wrong for a camera crossing sixteen metres. Measured on this arrival, it
 * finished visually in under a second and spent the remaining nine hundred
 * milliseconds creeping, which reads as a snap followed by a wait rather
 * than as an approach.
 *
 * A camera that starts at rest and ends at rest wants easing at both ends.
 * This covers 16% by a third of the way, half at the midpoint and 84% by
 * two thirds — so the travel is visible for the whole duration, which is
 * what makes a stated 1.9 seconds actually last 1.9 seconds.
 */
const settle = (t: number) => t * t * t * (t * (6 * t - 15) + 10);

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
  /**
   * The arrival. Where the camera starts, and how long it takes to reach
   * `home`.
   *
   * Driven by an eased parameter rather than by damping, because damping
   * has no duration — it approaches forever and "arrived" is a judgement
   * about how close is close enough. A brief that says 1.2 to 2.5 seconds
   * needs a number that is actually the number.
   */
  arrival?: { from: Vec3; ms: number };
  /**
   * Where the camera may go once it has arrived.
   *
   * Applied to the *desired* position rather than to the camera's own, so
   * the camera damps toward a legal point and never has to be shoved back
   * from an illegal one — clamping the result instead makes a camera that
   * sticks at the edge and jitters.
   *
   * Not applied during the arrival, which deliberately starts outside it.
   */
  bounds?: Bounds;
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
  arrival,
  bounds,
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
  /* Seeded on the first frame rather than at mount: a scene deferred to
     idle can mount well before it is allowed to draw, and an arrival whose
     clock started then would already be over by the time anyone saw it. */
  const began = useRef<number | null>(null);
  const arrived = useRef(!arrival);
  const fromVec = useRef(new Vector3());

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

    /* The approach. While it runs, the camera is placed rather than damped,
       and the pointer's share is scaled in from nothing — a visitor who
       moves the mouse during the arrival should not find themselves
       fighting it, and should not have it snap to attention either. */
    let entering = 0;
    if (arrival && !arrived.current) {
      if (began.current === null) began.current = state.clock.elapsedTime;
      const t = Math.min(1, ((state.clock.elapsedTime - began.current) * 1000) / arrival.ms);
      if (t >= 1) arrived.current = true;
      else entering = 1 - settle(t);
    }

    /* Framing: travel part of the way toward the point, never onto it. The
       scene has to stay readable behind whatever is being looked at. */
    if (focus) {
      focusVec.current.set(focus[0], focus[1], focus[2]);
      desired.current.lerp(focusVec.current, pull);
    }

    /* The tilt. state.pointer is already normalised to -1..1 by the Canvas. */
    if (fine.current) {
      const share = 1 - entering;
      desired.current.x += state.pointer.x * sway[0] * share;
      desired.current.y += state.pointer.y * sway[1] * share;
    }

    /* The box, and only once the arrival is over — it starts outside it. */
    if (bounds && arrived.current) {
      desired.current.x = Math.min(bounds.maxX, Math.max(bounds.minX, desired.current.x));
      desired.current.y = Math.min(bounds.maxY, Math.max(bounds.minY, desired.current.y));
      desired.current.z = Math.min(bounds.maxZ, Math.max(bounds.minZ, desired.current.z));
    }

    if (entering > 0 && arrival) {
      fromVec.current.set(arrival.from[0], arrival.from[1], arrival.from[2]);
      camera.position.copy(desired.current).lerp(fromVec.current, entering);
    } else {
      camera.position.lerp(desired.current, k);
    }

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
      /* During the approach the aim is placed on the same eased curve as
         the position, so the two cannot disagree about how far in the
         arrival is; damping it would let the camera reach its mark while
         still looking somewhere else. */
      lookAt.current[key] +=
        (aim - lookAt.current[key]) * (entering > 0 ? 1 - entering * 0.86 : k);
    }
    camera.lookAt(lookAt.current);
  });

  return null;
}
