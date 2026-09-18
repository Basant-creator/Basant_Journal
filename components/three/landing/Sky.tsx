"use client";

import { useMemo } from "react";
import { BackSide, Color, ShaderMaterial, SphereGeometry } from "three";
import { split } from "@/lib/three/split";
import { hours } from "../hours";

/**
 * The sky, as a gradient on the inside of a very large sphere.
 *
 * Not three's fog colour and not a clear colour: §24 wants dusk and dawn to
 * be distinctly different skies rather than one sky at two brightnesses, and
 * that needs at least three stops — upper, the warm band, and the horizon —
 * with the band sitting at a *different height* in each hour. A clear colour
 * cannot do that, and a texture would be a file.
 *
 * Its own `ShaderMaterial` rather than a patched Lambert, because a sky is
 * the one surface in the scene that must not be lit. It is the light.
 *
 * `depthWrite: false` and it renders first, so every solid thing in the world
 * draws over it regardless of how far away the sphere is.
 */

const VERTEX = /* glsl */ `
varying vec3 vDirection;

void main() {
  vDirection = normalize(position);
  vec4 world = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * world;
}
`;

const FRAGMENT = /* glsl */ `
precision highp float;

varying vec3 vDirection;

uniform vec3 uDuskTop;
uniform vec3 uDuskMid;
uniform vec3 uDuskHorizon;
uniform vec3 uDawnTop;
uniform vec3 uDawnMid;
uniform vec3 uDawnHorizon;

uniform float uSweep;
uniform float uFrom;
uniform float uTo;
uniform vec2 uDir;
uniform float uBand;
uniform float uJitter;
uniform vec2 uViewport;
uniform float uTime;

float skyHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float skyNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(skyHash(i + vec2(0.0, 0.0)), skyHash(i + vec2(1.0, 0.0)), u.x),
    mix(skyHash(i + vec2(0.0, 1.0)), skyHash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

/*
  One hour's sky, as a function of height.

  Two smoothsteps rather than a single three-stop mix: the warm band needs to
  be *narrow* near the horizon and the upper gradient *wide*, and a linear ramp
  through three colours gives both the same width — which is the difference
  between a sunset and a flag.
*/
vec3 band(vec3 top, vec3 middle, vec3 horizon, float h) {
  float lower = smoothstep(-0.02, 0.16, h);
  float upper = smoothstep(0.10, 0.62, h);
  vec3 low = mix(horizon, middle, lower);
  return mix(low, top, upper);
}

void main() {
  float h = vDirection.y;

  vec3 duskSky = band(uDuskTop, uDuskMid, uDuskHorizon, h);
  vec3 dawnSky = band(uDawnTop, uDawnMid, uDawnHorizon, h);

  /* §11: the division stays cleaner in the sky than on the ground. Half the
     jitter, and no height term - there is no silhouette up here to bend
     around, and wobble against open sky reads as a rendering fault. */
  vec2 uv = gl_FragCoord.xy / max(uViewport, vec2(1.0));
  float axis = dot(uv - 0.5, normalize(uDir)) + 0.5;
  axis += (skyNoise(uv * 2.6 + uTime * 0.02) - 0.5) * uJitter * 0.45;

  float side = smoothstep(uSweep - uBand, uSweep + uBand, axis);
  float dawnness = mix(uTo, uFrom, side);

  vec3 colour = mix(duskSky, dawnSky, dawnness);

  /* The light on the leading edge, brightest where the sky is already warm. */
  float lip = 1.0 - smoothstep(0.0, uBand * 1.5, abs(axis - uSweep));
  colour += vec3(0.20, 0.13, 0.07) * lip * step(uSweep, 1.0) * (1.0 - smoothstep(0.1, 0.7, h));

  gl_FragColor = vec4(colour, 1.0);
  #include <colorspace_fragment>
}
`;

export function Sky() {
  const geometry = useMemo(() => new SphereGeometry(170, 24, 16), []);

  const material = useMemo(() => {
    const duskSky = hours.dusk.sky;
    const dawnSky = hours.dawn.sky;

    return new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uDuskTop: { value: new Color(duskSky.top) },
        uDuskMid: { value: new Color(duskSky.middle) },
        uDuskHorizon: { value: new Color(duskSky.horizon) },
        uDawnTop: { value: new Color(dawnSky.top) },
        uDawnMid: { value: new Color(dawnSky.middle) },
        uDawnHorizon: { value: new Color(dawnSky.horizon) },
        /* Shared by reference: one assignment moves the boundary everywhere. */
        uSweep: split.uSweep,
        uFrom: split.uFrom,
        uTo: split.uTo,
        uDir: split.uDir,
        uBand: split.uBand,
        uJitter: split.uJitter,
        uViewport: split.uViewport,
        uTime: split.uTime,
      },
    });
  }, []);

  /* renderOrder -1: the sky is behind the world whatever the depth buffer
     thinks, and it writes no depth of its own. */
  return <mesh geometry={geometry} material={material} renderOrder={-1} frustumCulled={false} />;
}
