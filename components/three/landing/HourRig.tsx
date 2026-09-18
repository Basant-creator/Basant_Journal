"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Color, Fog } from "three";
import type { DirectionalLight, HemisphereLight, AmbientLight } from "three";
import { split, sweepTo } from "@/lib/three/split";
import {
  DEFAULT_HOUR,
  SWEEP_MS,
  SWEEP_MS_REDUCED,
  dawnFraction,
  readHour,
  subscribeHour,
  sweepFor,
} from "@/lib/world/hour";
import { hours } from "../hours";

/**
 * The light, the air, and the thing that moves the boundary.
 *
 * Two jobs that have to stay in one component because they share a clock.
 *
 * **The sweep.** The boundary's two sides are fixed — dusk below the line,
 * dawn above it — and the only thing that ever moves is the line. At rest it
 * stands on screen and the territory holds both hours at once; choosing dusk
 * pushes it off the top-right corner and choosing dawn pushes it off the
 * bottom-left. §16's opposite directions are not arranged anywhere, they are
 * just what one number does when it travels to a smaller value instead of a
 * larger one, and §15's "same mechanism backwards" is literal.
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
  const { size, gl } = useThree();

  const sun = useRef<DirectionalLight>(null);
  const ambient = useRef<AmbientLight>(null);
  const bounce = useRef<HemisphereLight>(null);

  /* The crossing in progress, if there is one. */
  const sweep = useRef<{ from: number; to: number; start: number; ms: number } | null>(
    null,
  );
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

  /*
    The viewport, for turning gl_FragCoord into a 0..1 axis.

    **The drawing buffer, not the CSS size.** `gl_FragCoord` is measured in
    framebuffer pixels, which on a 2x display is twice the element's CSS
    dimensions — so dividing by `size` ran the axis out to 2.6 at the far
    corner instead of 1.2, and the boundary sat in a completely different
    place on a retina screen than on an ordinary one. Measured: a 1200x850
    element backed by a 2400x1700 buffer.

    `getDrawingBufferSize` is the renderer's own answer to that question,
    which also keeps this correct if the dpr cap ever changes.
  */
  useEffect(() => {
    gl.getDrawingBufferSize(split.uViewport.value);
  }, [gl, size.width, size.height]);

  /* The two airs, from the palette rather than from literals in the shader
     module. Set once: they are the hours' own fog colours and never change. */
  useEffect(() => {
    split.uDuskFog.value.set(hours.dusk.air.fog);
    split.uDawnFog.value.set(hours.dawn.air.fog);
  }, []);

  /* Start a crossing when the hour changes. */
  useEffect(() => {
    if (previous.current === hour) return;
    previous.current = hour;

    /*
      §48: the newest selection wins, and it wins from wherever the boundary
      actually is. Starting the crossing at the *current* sweep rather than at
      an edge means an interrupted crossing carries on from the line the
      visitor can see, instead of snapping to a corner and running again.
      Rapid toggling therefore looks like one boundary being pushed back and
      forth, which is what it is.

      §16 falls out of this rather than being arranged: going to dawn moves
      the number down and going to dusk moves it up, so the same boundary
      travels in opposite directions without a second animation or a negated
      vector.
    */
    sweep.current = {
      from: split.uSweep.value,
      to: sweepFor(hour),
      start: performance.now(),
      /* §39: reduced motion keeps the dawn/dusk identity and drops the
         journey across the territory. */
      ms: prefersReducedMotion() ? SWEEP_MS_REDUCED : SWEEP_MS,
    };
  }, [hour]);

  useFrame((state, delta) => {
    split.uTime.value += delta;

    const target = sweepFor(hour);
    const run = sweep.current;

    if (run) {
      const t = Math.min(1, (performance.now() - run.start) / run.ms);
      sweepTo(lerp(run.from, run.to, ease(t)));
      if (t >= 1) {
        sweep.current = null;
        sweepTo(target);
      }
    } else if (split.uSweep.value !== target) {
      /* No crossing ran — first paint, or a hydration that arrived already
         holding a chosen hour. Put the boundary where it belongs. */
      sweepTo(target);
    }

    /* The lighting rides the boundary rather than the state, so the sun keeps
       pace with the line instead of jumping when React flips the attribute. */
    const mix = dawnFraction(split.uSweep.value);
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
