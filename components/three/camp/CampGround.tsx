"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, PlaneGeometry, RepeatWrapping } from "three";
import { GROUND_MIN, groundHeight } from "@/lib/world/camp";
import { GROUND_Y } from "./layout";
import { camp, land, tint } from "./palette";

/**
 * What the camp is standing on.
 *
 * §10 asks for layered terrain rather than one large detailed mesh, and this
 * is the layer that was missing. The scene had a single flat 220-metre plane,
 * unlit and one colour, which is why the camp read as furniture on a floor
 * with scenery behind it. Two layers now, and the split is about attention:
 *
 *   near    a displaced mesh out to 22 metres, where the fire's light lands
 *           and the camera looks down
 *   far     the old flat plane, well below the near one, doing nothing but
 *           closing the horizon under fog
 *
 * The displacement is small — a hundred millimetres from crest to trough —
 * and that is enough. At blue hour with one low light raking across it, the
 * difference between flat and not flat is most of what says "outdoors"; a
 * landscape would say "terrain demo".
 *
 * The far plane sits below the lowest point the near mesh can reach, so no
 * part of it can surface through a trough. At that distance the step is
 * invisible and the fog has it anyway.
 *
 * §10 also says not to rely entirely on geometry, and the texture is the
 * other half. Soil is not a colour, it is a colour with grit in it: the
 * mottle is what keeps the near ground from flattening back out under the
 * firelight, where a single value would.
 */

const NEAR_SIZE = 44;
/** 88 segments across 44 metres is one vertex every half metre — enough to
 *  carry a wave of this length and nothing like enough to be a heightmap. */
const NEAR_SEGMENTS = 88;
const SOIL_PX = 512;

function useSoil() {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    canvas.width = SOIL_PX;
    canvas.height = SOIL_PX;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = land.ground;
    ctx.fillRect(0, 0, SOIL_PX, SOIL_PX);

    /* Large, soft patches first: ground is not uniform before it is grainy.
       Seeded off a fixed sequence rather than Math.random, so the texture is
       the same every time it is generated. */
    let seed = 0x2f6e2b1;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };

    for (let i = 0; i < 26; i += 1) {
      const r = 40 + rand() * 130;
      const g = ctx.createRadialGradient(
        rand() * SOIL_PX,
        rand() * SOIL_PX,
        0,
        rand() * SOIL_PX,
        rand() * SOIL_PX,
        r,
      );
      const warm = rand() > 0.5;
      g.addColorStop(0, tint(warm ? camp.timberDark : camp.rock, 0.16));
      g.addColorStop(1, tint(camp.rock, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, SOIL_PX, SOIL_PX);
    }

    /* Then the grit. Single pixels, both lighter and darker, so the surface
       has something for the light to catch that is smaller than a vertex. */
    for (let i = 0; i < 5200; i += 1) {
      const light = rand() > 0.42;
      ctx.fillStyle = tint(light ? camp.rock : camp.timberDark, 0.1 + rand() * 0.26);
      const s = rand() > 0.88 ? 2 : 1;
      ctx.fillRect(rand() * SOIL_PX, rand() * SOIL_PX, s, s);
    }

    const map = new CanvasTexture(canvas);
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    /* One tile every four metres. Larger and the repeat is findable; smaller
       and it stops reading as ground and starts reading as carpet. */
    map.repeat.set(NEAR_SIZE / 4, NEAR_SIZE / 4);
    return map;
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

export function CampGround() {
  const soil = useSoil();

  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(NEAR_SIZE, NEAR_SIZE, NEAR_SEGMENTS, NEAR_SEGMENTS);
    const pos = geo.attributes.position;

    /* The mesh is rotated -90 degrees about X, which sends local y to world
       -z and local z to world y. So the height for a vertex is sampled at
       (x, -y) and written into z. Getting that mapping wrong produces a
       surface that undulates correctly and is flat in the wrong place, which
       is invisible until the camp is standing in a trough. */
    for (let i = 0; i < pos.count; i += 1) {
      pos.setZ(i, groundHeight(pos.getX(i), -pos.getY(i)));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      {/* Near: displaced, textured, and the only ground that catches light. */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, 0]}>
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial
          map={soil ?? undefined}
          color={soil ? undefined : land.ground}
          roughness={1}
          metalness={0}
          dithering
        />
      </mesh>

      {/* Far: flat, cheap, and below every trough the near mesh can dig. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y + GROUND_MIN - 0.05, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color={land.ground} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}
