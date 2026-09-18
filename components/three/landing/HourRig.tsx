"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Color, Fog, Vector2 } from "three";
import type { DirectionalLight, HemisphereLight, AmbientLight } from "three";
import { settle, split } from "@/lib/three/split";
import {
  DEFAULT_HOUR,
  SWEEP_MS,
  SWEEP_MS_REDUCED,
  dawnness,
  readHour,
  subscribeHour,
} from "@/lib/world/hour";
import { hours } from "../hours";

/**
 * The light, the air, and the thing that moves the boundary.
 *
 * Two jobs that have to stay in one component because they share a clock.
 *
 * **The sweep.** When the hour changes, the boundary starts off one corner and
 * travels to the opposite one, and every material in the scene reads its
 * position per fragment. §16 asks dusk→dawn to run bottom-left to top-right
 * and the reverse to run back the other way, and §15 insists it be the same
 * mechanism rather than a second animation — so the direction vector is simply
 * negated and the sweep always runs 0 to 1. One path, played forwards or
 * backwards, which is also why rapid toggling cannot desynchronise it.
 *
 * **The light.** §23 warns against flipping every shadow at once, so the sun
 * does not jump from one side to the other: its position, colour and intensity
 * are interpolated across the crossing, along with the ambient, the bounce and
 * the fog. Those are scene-wide rather than per-fragment — three has one sun,
 * not one per side of a diagonal — so the honest description is that the
 * *surfaces* change hour exactly at the boundary while the *lighting* eases
 * across behind it. At these distances, with this much haze, the two read as
 * one event.
 */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Eased so the light leaves and arrives softly rather than at constant speed. */
function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Reads the hour without tearing, and without touching the DOM per frame. */
function useHour() {
  return useSyncExternalStore(subscribeHour, readHour, () => DEFAULT_HOUR);
}

export function HourRig() {
  const hour = useHour();
  const { size } = useThree();

  const sun = useRef<DirectionalLight>(null);
  const ambient = useRef<AmbientLight>(null);
  const bounce = useRef<HemisphereLight>(null);

  /* The crossing in progress, if there is one. */
  const sweep = useRef<{ start: number; ms: number } | null>(null);
  /* What the light is currently showing, 0..1. Not the same as the hour:
     during a crossing it is somewhere between. */
  const lit = useRef(dawnness(hour));
  const previous = useRef(hour);

  /* Scratch colours, reused. Allocating in a frame loop is the one rule this
     repository's renderer notes will not bend on. */
  const scratch = useRef({
    sun: new Color(),
    ambient: new Color(),
    bounce: new Color(),
    fog: new Color(),
    a: new Color(),
    b: new Color(),
  });

  /* The viewport, for turning gl_FragCoord into a 0..1 axis. */
  useEffect(() => {
    split.uViewport.value = new Vector2(size.width, size.height);
  }, [size.width, size.height]);

  /* Start a crossing when the hour changes. */
  useEffect(() => {
    if (previous.current === hour) return;

    const from = previous.current;
    previous.current = hour;

    /*
      §16: dusk→dawn runs bottom-left to top-right; the reverse runs back.
      One vector, negated. The sweep itself always counts 0 to 1, which is
      what makes the reversal feel like the same physical mechanism rather
      than a second animation that happens to look similar.
    */
    const toward = hour === "dawn" ? 1 : -1;
    split.uDir.value.set(0.78 * toward, 0.63 * toward);

    /*
      §48: the newest selection wins, always. Whatever was showing becomes
      the hour being left, so a crossing interrupted halfway never strands a
      half-lit world — the boundary simply starts again from the edge with
      the current appearance behind it.
    */
    split.uFrom.value = dawnness(from);
    split.uTo.value = dawnness(hour);
    split.uSweep.value = -0.25;

    sweep.current = {
      start: performance.now(),
      /* §39: reduced motion keeps the dawn/dusk identity and drops the
         journey across the territory. */
      ms: prefersReducedMotion() ? SWEEP_MS_REDUCED : SWEEP_MS,
    };
  }, [hour]);

  useFrame((state, delta) => {
    split.uTime.value += delta;

    const target = dawnness(hour);
    const run = sweep.current;

    if (run) {
      const t = Math.min(1, (performance.now() - run.start) / run.ms);
      /* -0.25 to 1.25 so the blend band clears both corners entirely. */
      split.uSweep.value = -0.25 + ease(t) * 1.5;

      /* The lighting follows the boundary rather than leading it. */
      lit.current = lerp(split.uFrom.value, split.uTo.value, ease(t));

      if (t >= 1) {
        sweep.current = null;
        lit.current = target;
        settle(target);
      }
    } else if (lit.current !== target) {
      /* No crossing ran — first paint, or a hydration that arrived already
         set to dawn. Snap, and park the boundary off screen. */
      lit.current = target;
      settle(target);
    }

    const mix = lit.current;
    const dusk = hours.dusk;
    const dawn = hours.dawn;
    const c = scratch.current;

    if (sun.current) {
      c.a.set(dusk.sun.colour);
      c.b.set(dawn.sun.colour);
      sun.current.color.copy(c.sun.copy(c.a).lerp(c.b, mix));
      sun.current.intensity = lerp(dusk.sun.intensity, dawn.sun.intensity, mix);
      sun.current.position.set(
        lerp(dusk.sun.position[0], dawn.sun.position[0], mix),
        lerp(dusk.sun.position[1], dawn.sun.position[1], mix),
        lerp(dusk.sun.position[2], dawn.sun.position[2], mix),
      );
    }

    if (ambient.current) {
      c.a.set(dusk.ambient.colour);
      c.b.set(dawn.ambient.colour);
      ambient.current.color.copy(c.ambient.copy(c.a).lerp(c.b, mix));
      ambient.current.intensity = lerp(
        dusk.ambient.intensity,
        dawn.ambient.intensity,
        mix,
      );
    }

    if (bounce.current) {
      c.a.set(dusk.bounce);
      c.b.set(dawn.bounce);
      bounce.current.groundColor.copy(c.bounce.copy(c.a).lerp(c.b, mix));
    }

    /*
      The air. §25 puts most of the scene's depth here: at dawn the fog is the
      *lightest* colour in the picture and closes in, so distance washes toward
      white; at dusk it is the darkest and opens out.
    */
    c.a.set(dusk.air.fog);
    c.b.set(dawn.air.fog);
    c.fog.copy(c.a).lerp(c.b, mix);

    const scene = state.scene;
    if (!(scene.fog instanceof Fog)) {
      scene.fog = new Fog(c.fog.getHex(), dusk.air.near, dusk.air.far);
    }
    const fog = scene.fog as Fog;
    fog.color.copy(c.fog);
    fog.near = lerp(dusk.air.near, dawn.air.near, mix);
    fog.far = lerp(dusk.air.far, dawn.air.far, mix);
  });

  return (
    <>
      <ambientLight ref={ambient} />
      <directionalLight ref={sun} />
      <hemisphereLight
        ref={bounce}
        args={[hours.dusk.sky.middle, hours.dusk.bounce, 0.35]}
      />
    </>
  );
}
