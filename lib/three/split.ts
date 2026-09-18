import { Color, Vector2, type Material } from "three";

/**
 * The diagonal, as a property of every surface rather than a layer over them.
 *
 * §12 is the requirement that decides this file's existence: both hours must
 * occupy the *same geometry*. The obvious implementations all fail it —
 * two canvases double the GPU cost and §49 forbids it, two scenes let the
 * herd drift out of step and §21 forbids that, and a `clip-path` over a
 * screenshot is §10's named anti-pattern.
 *
 * So there is one scene, drawn once, and every material asks the same
 * question per fragment: *which side of the boundary am I on?* A pixel left of
 * the line is lit by one hour and a pixel right of it by the other, and
 * because it is the same triangle either way, a horse crossing the boundary
 * is one horse in changing light — which is precisely what §21 says the
 * visitor must subconsciously understand.
 *
 * Cost: one `mix()` and a little noise per fragment. No extra draw calls, no
 * duplicated geometry, no render targets.
 */

/* -------------------------------------------------------------------------
   THE SHARED CLOCK

   Every patched material points at *these* objects, not copies. One assignment
   moves the boundary across the whole world; if each material held its own
   uniforms they would need to be walked and updated in step, and the first one
   anybody forgot would tear.
   ------------------------------------------------------------------------- */

export const split = {
  /** Where the boundary is, 0..1 along its own axis. */
  uSweep: { value: 1.1 },
  /** Dawnness behind the boundary (the hour being left). 0 dusk, 1 dawn. */
  uFrom: { value: 0 },
  /** Dawnness ahead of it (the hour arriving). */
  uTo: { value: 0 },
  /** The diagonal's direction. Normalised, in screen space. */
  uDir: { value: new Vector2(0.78, 0.63) },
  /** Half-width of the blend, in the same units as uSweep. */
  uBand: { value: 0.075 },
  /** How much the edge wanders. 0 is a ruler; §10.4 wants it not to be. */
  uJitter: { value: 0.055 },
  /** Viewport, for turning gl_FragCoord into a 0..1 axis. */
  uViewport: { value: new Vector2(1, 1) },
  uTime: { value: 0 },
};

/**
 * Parks the boundary off-screen so nothing is masked.
 *
 * Called whenever a crossing finishes. A resting sweep of exactly 1 would
 * leave the trailing half of the blend band still on screen — hence 1.1,
 * which is past the far corner by more than `uBand`.
 */
export function settle(dawnness: number): void {
  split.uFrom.value = dawnness;
  split.uTo.value = dawnness;
  split.uSweep.value = 1.1;
}

/* -------------------------------------------------------------------------
   THE GLSL

   Kept in one string so the two injection sites cannot drift apart.

   The noise is a two-octave value noise over a hash — not because the scene
   needs good noise, but because §10 and §17 both turn on the edge *not* being
   a straight line. A ruled diagonal reads as a slide transition however
   prettily it is coloured; the same diagonal with a few world-units of wander
   in it reads as light coming over broken ground.
   ------------------------------------------------------------------------- */

const NOISE = /* glsl */ `
float splitHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float splitNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(splitHash(i + vec2(0.0, 0.0)), splitHash(i + vec2(1.0, 0.0)), u.x),
    mix(splitHash(i + vec2(0.0, 1.0)), splitHash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}
`;

/**
 * Where this fragment sits relative to the boundary. 0 = the arriving hour
 * has reached it, 1 = it is still in the hour being left.
 *
 * Three things move the axis before it is compared:
 *
 *   - **noise**, at two scales, so the edge wanders (§10.4);
 *   - **height**, so a fragment high above the ground is reached slightly
 *     earlier — the line bends around a silhouette instead of slicing it,
 *     which is §11's "allow the mountain to influence the cut";
 *   - **time**, very slowly, so a boundary caught mid-sweep is never quite
 *     still.
 */
const AXIS = /* glsl */ `
float splitAxis(vec2 frag, float worldHeight) {
  vec2 uv = frag / max(uViewport, vec2(1.0));
  float axis = dot(uv - 0.5, normalize(uDir)) + 0.5;

  float coarse = splitNoise(uv * 3.4 + uTime * 0.03) - 0.5;
  float fine = splitNoise(uv * 11.0 - uTime * 0.05) - 0.5;
  axis += (coarse * 0.8 + fine * 0.35) * uJitter;

  // §11: the ridge line pulls the boundary forward over high ground.
  axis -= clamp(worldHeight * 0.012, -0.06, 0.06);

  return axis;
}
`;

/** Injected into every patched fragment shader. */
export const SPLIT_FRAGMENT_HEAD = /* glsl */ `
uniform float uSweep;
uniform float uFrom;
uniform float uTo;
uniform vec2 uDir;
uniform float uBand;
uniform float uJitter;
uniform vec2 uViewport;
uniform float uTime;
varying vec3 vSplitWorld;
${NOISE}
${AXIS}
`;

export const SPLIT_VERTEX_HEAD = /* glsl */ `
varying vec3 vSplitWorld;
`;

export const SPLIT_VERTEX_BODY = /* glsl */ `
vSplitWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;

/**
 * Patches a material so its base colour is two colours and a boundary.
 *
 * `onBeforeCompile` rather than a hand-written `ShaderMaterial` on purpose:
 * three's own lighting, fog and tone mapping are worth more than the control
 * a bespoke shader would buy, and this scene wants all three. What is
 * replaced is exactly one line — the diffuse colour — and everything
 * downstream of it still happens normally.
 *
 * The `customProgramCacheKey` matters more than it looks. Without it three
 * caches the compiled program by material parameters alone, so two materials
 * patched with different colours can be handed the same program and one of
 * them silently wears the other's palette.
 */
export function splitMaterial<T extends Material>(
  material: T,
  duskHex: string,
  dawnHex: string,
): T {
  const duskColour = new Color(duskHex);
  const dawnColour = new Color(dawnHex);

  /* Unannotated on purpose: three renamed this parameter's type between
     versions (`Shader` is gone in r18x), and inferring it from the
     property keeps this compiling across the upgrade rather than pinning
     it to whichever name is current today. */
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSweep = split.uSweep;
    shader.uniforms.uFrom = split.uFrom;
    shader.uniforms.uTo = split.uTo;
    shader.uniforms.uDir = split.uDir;
    shader.uniforms.uBand = split.uBand;
    shader.uniforms.uJitter = split.uJitter;
    shader.uniforms.uViewport = split.uViewport;
    shader.uniforms.uTime = split.uTime;
    shader.uniforms.uDusk = { value: duskColour };
    shader.uniforms.uDawn = { value: dawnColour };

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${SPLIT_VERTEX_HEAD}`)
      .replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>\n${SPLIT_VERTEX_BODY}`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>\nuniform vec3 uDusk;\nuniform vec3 uDawn;\n${SPLIT_FRAGMENT_HEAD}`,
      )
      .replace(
        "#include <color_fragment>",
        /* glsl */ `
        #include <color_fragment>
        {
          float axis = splitAxis(gl_FragCoord.xy, vSplitWorld.y);
          float side = smoothstep(uSweep - uBand, uSweep + uBand, axis);
          float dawnness = mix(uTo, uFrom, side);
          diffuseColor.rgb *= mix(uDusk, uDawn, dawnness);

          // A thin warm lip riding the boundary itself: the light arriving,
          // rather than a colour changing. §17 - it is what stops the sweep
          // reading as a wipe.
          float lip = 1.0 - smoothstep(0.0, uBand * 1.35, abs(axis - uSweep));
          diffuseColor.rgb += vec3(0.16, 0.10, 0.05) * lip * step(uSweep, 1.0);
        }
        `,
      );
  };

  /* Two materials with different colours must not share a compiled program. */
  material.customProgramCacheKey = () => `split:${duskHex}:${dawnHex}`;
  material.needsUpdate = true;

  return material;
}
