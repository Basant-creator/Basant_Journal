"use client";

import { useFrame } from "@react-three/fiber";
import { useEmberBedTexture, useFlameTexture } from "./CampFlame";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, type Group, type Mesh, type PointLight } from "three";
import { FIRE, FIRE_RADIUS } from "./layout";
import { fire } from "./palette";

/**
 * The fire, which is the reason the rest of the camp is visible at all.
 *
 * §11 asks for it to feel alive and says plainly what it must not become: a
 * particle demo. So the whole thing is three flame shapes, nine embers and one
 * light, and the light does most of the work. Everything built in step 07 is a
 * standard material with nothing to catch until now — the tent, the stool, the
 * grass and the ground are all waiting on this.
 *
 * The flicker is two sines at unrelated frequencies. It is the same trick the
 * illustrated camp uses and the same reasoning: a single sine is a pulse, and
 * an ear or an eye finds a pulse in about two seconds. Two that never line up
 * read as something burning.
 *
 * Nothing here allocates per frame and nothing writes a buffer. The flames are
 * three meshes whose scale is set directly; the embers are nine meshes whose
 * height is a function of elapsed time and a fixed phase, so they loop without
 * any state to keep or reset.
 */

/** Where each ember starts and how fast it climbs. Fixed, so a rise is a
 *  calculation rather than a simulation. */
const EMBER_POOL = Array.from({ length: 14 }, (_, i) => ({
  phase: (i * 0.618) % 1,
  speed: 0.38 + (i % 4) * 0.07,
  drift: Math.sin(i * 2.3) * 0.22,
  swing: 0.1 + (i % 3) * 0.05,
  size: 0.012 + (i % 3) * 0.004,
}));

export function CampFire({
  embers: emberCount,
  shadows,
}: {
  embers: number;
  shadows: { enabled: boolean; mapSize: number };
}) {
  /* Taken off the front of a fixed pool rather than regenerated per tier, so
     a weaker machine sees the same embers as a strong one, just fewer of
     them — not a different fire. */
  const EMBERS = EMBER_POOL.slice(0, emberCount);
  const glow = useRef<PointLight | null>(null);
  /* Counts the frames the shadow map is allowed before it is frozen. A few,
     not one: the first frame can land before every mesh has been added. */
  const settle = useRef(0);
  const flames = useRef<Array<Mesh | null>>([]);

  /*
    One flame texture, cloned per layer.
    
    A clone shares the image — there is one canvas and one GPU upload — but
    carries its own offset, which is the whole point: three layers scrolling
    at one speed is a single sheet with extra steps, and the layers reading
    as separate is what gives the flame depth.
  */
  const flameMap = useFlameTexture();
  const emberBed = useEmberBedTexture();
  const maps = useMemo(
    () => (flameMap ? [0, 1, 2].map(() => flameMap.clone()) : null),
    [flameMap],
  );
  useEffect(() => () => maps?.forEach((m) => m.dispose()), [maps]);
  const embers = useRef<Group | null>(null);
  const bed = useRef<Mesh | null>(null);

  useFrame((state) => {
    if (shadows.enabled && glow.current && settle.current <= 6) {
      settle.current += 1;
      if (settle.current === 6) glow.current.shadow.autoUpdate = false;
    }

    const t = state.clock.elapsedTime;

    /* Two waves, unrelated. Base 5.4 so the camp is legible; the swing is
       about a fifth of it, which is a fire breathing rather than a lamp on a
       loose connection. */
    const flare = 5.4 + Math.sin(t * 2.7) * 0.72 + Math.sin(t * 6.1) * 0.34;
    if (glow.current) glow.current.intensity = flare;

    /* Up through the cone, each layer at its own rate. Negative, because
       texture v runs down and fire does not. Modulo 1 so the offset never
       grows large enough to lose precision in a long-lived tab. */
    if (maps) {
      maps.forEach((map, i) => {
        map.offset.y = -(t * (0.34 + i * 0.13)) % 1;
      });
    }

    flames.current.forEach((flame, i) => {
      if (!flame) return;
      const wobble = Math.sin(t * (3.1 + i * 0.9) + i * 1.7);
      const lick = Math.sin(t * (5.3 + i * 1.3) + i * 0.6);
      flame.scale.set(
        0.85 + wobble * 0.07,
        1 + lick * 0.17 + wobble * 0.06,
        0.85 + lick * 0.06,
      );
      flame.position.x = wobble * 0.024;
    });

    if (bed.current) {
      /* Coals lag the flame. They brighten and dim with it, but at a third
         of the swing and with no sharp edge — a bed that flickered as hard
         as the flame would read as a second flame lying down. */
      const m = bed.current.material as { opacity: number };
      m.opacity = 0.62 + Math.sin(t * 2.7) * 0.07 + Math.sin(t * 1.1) * 0.04;
    }

    if (embers.current) {
      embers.current.children.forEach((ember, i) => {
        const e = EMBERS[i];
        /* 0..1 up the column, wrapping. */
        const climb = (t * e.speed + e.phase) % 1;
        ember.position.y = 0.22 + climb * 1.9;
        ember.position.x = e.drift + Math.sin(t * 0.9 + i) * e.swing * climb;
        /* In quickly, out slowly, gone before the top. */
        const m = ember as unknown as { material: { opacity: number } };
        m.material.opacity = Math.min(1, climb * 6) * (1 - climb) ** 1.6 * 0.9;
      });
    }
  });

  return (
    <group position={FIRE}>
      {/* Three logs, leaned in. Dark, because a log in a fire is a silhouette
          against the flame and not a lit object. */}
      {[-0.5, 0.1, 0.62].map((turn, i) => (
        <mesh
          key={`log-${i}`}
          position={[Math.sin(turn) * 0.2, 0.075, Math.cos(turn) * 0.2 - 0.1]}
          rotation={[0.18, turn * 2.1, 0.1 + i * 0.05]}
        >
          <cylinderGeometry args={[0.055, 0.07, 0.74, 6]} />
          <meshStandardMaterial color={fire.log} roughness={1} />
        </mesh>
      ))}

      {/*
        The flame. Three tapered cones, additively blended so they brighten
        what is behind them instead of punching a hole in it — the difference
        between fire and orange plastic. Depth writing is off for the same
        reason: they should not occlude each other.
      */}
      {[
        { c: fire.ember, h: 0.72, r: 0.2, y: 0.3, o: 0.5 },
        { c: fire.body, h: 0.56, r: 0.15, y: 0.24, o: 0.62 },
        { c: fire.core, h: 0.34, r: 0.09, y: 0.17, o: 0.85 },
      ].map((flame, i) => (
        <mesh
          key={`flame-${i}`}
          ref={(node) => {
            flames.current[i] = node;
          }}
          position={[0, flame.y, 0]}
        >
          <coneGeometry args={[flame.r, flame.h, 7]} />
          <meshBasicMaterial
            map={maps ? maps[i] : undefined}
            color={flame.c}
            transparent
            opacity={flame.o}
            depthWrite={false}
            blending={AdditiveBlending}
            fog={false}
          />
        </mesh>
      ))}

      {/*
        The bed of coals the logs are lying on. §7 asks for ground
        illumination and the point light supplies that, but a light with
        nothing visible at its origin is a fire with no heat in it — the
        flames were floating a centimetre above bare ground.

        Flat on the ground, additive, and slightly larger than the log pile,
        so the hot ring reaches past the wood the way it does in a real fire
        ring. depthWrite off: it is light, and light does not occlude.
      */}
      <mesh
        ref={bed}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.012, 0]}
        renderOrder={1}
      >
        <circleGeometry args={[0.62, 20]} />
        <meshBasicMaterial
          map={emberBed ?? undefined}
          transparent
          opacity={0.62}
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
        />
      </mesh>

      {/*
        The light. Distance is set so the pool stops before the treeline —
        a fire that reaches the mountains is a floodlight, and the falloff is
        most of what says how big the flame is.
      */}
      {/*
        Shadows from the fire, rendered once and then frozen.

        A point light shadow is six faces of render, and a fire that flickers
        sixty times a second would pay for all six every frame. But the flicker
        is intensity, not position — the light never moves, and neither does
        the tent, the table, or the ground under them. So the map is drawn on
        the first frames and then switched off, and what is left is the thing
        that actually sells a campfire at dusk: long shadows reaching away
        from it, in the right direction, for no ongoing cost.

        The objects lift a few centimetres when they are reached for and their
        shadows do not follow. At four metres that is a fraction of a pixel.
      */}
      <pointLight
        ref={glow}
        castShadow={shadows.enabled}
        shadow-mapSize-width={shadows.mapSize}
        shadow-mapSize-height={shadows.mapSize}
        shadow-camera-near={0.12}
        shadow-camera-far={9}
        shadow-bias={-0.0045}
        position={[0, 0.42, 0]}
        intensity={5.4}
        distance={11}
        decay={2}
        color={fire.glow}
      />

      {/* Embers. Nine, which is enough to read as a fire throwing sparks and
          few enough that nobody counts them. */}
      <group ref={embers}>
        {EMBERS.map((e, i) => (
          <mesh key={`ember-${i}`} position={[e.drift, 0.3, 0]}>
            <sphereGeometry args={[e.size, 5, 4]} />
            <meshBasicMaterial
              color={fire.core}
              transparent
              opacity={0}
              depthWrite={false}
              blending={AdditiveBlending}
              fog={false}
            />
          </mesh>
        ))}
      </group>

      {/* The ground taking the light. A disc rather than relying on the plane
          alone: the fire sits in a scorched ring, and the ring is what tells
          you it has been burning a while. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[FIRE_RADIUS * 1.5, 18]} />
        <meshStandardMaterial color={fire.log} roughness={1} />
      </mesh>
    </group>
  );
}
