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
  /**
   * Where the boundary is, along its own axis.
   *
   * The axis runs roughly -0.2 at the bottom-left corner to 1.2 at the
   * top-right. Everything *below* this value wears dusk and everything above
   * it wears dawn, so the one number says which hour the frame is in:
   * 1.3 is all dusk, -0.3 is all dawn, and 0.62 is the resting split.
   *
   * Starts at the split, because the split is what a first visit shows.
   */
  uSweep: { value: 0.62 },
  /**
   * Which hour each side of the boundary wears. These are *constants*, not a
   * from/to pair.
   *
   * The first cut swapped them on every crossing, which meant the shader had
   * to be told both where the line was and what it separated — two pieces of
   * state that could disagree, and did, for the frame between a React update
   * and the next animation tick. Fixing the sides and moving only the line
   * removed the disagreement entirely and made the reverse crossing free: it
   * is the same number travelling the other way.
   */
  uFrom: { value: 1 },
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
  /* The two airs. Set once from the hour palettes; see the fog note below. */
  uDuskFog: { value: new Color("#1b1410") },
  uDawnFog: { value: new Color("#bfae97") },
};

/** Puts the boundary somewhere along its axis. That is the whole API now. */
export function sweepTo(position: number): void {
  split.uSweep.value = position;
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
  vec2 dir = normalize(uDir);

  /*
    Normalised so that 0 is the corner the boundary starts from and 1 is the
    opposite corner, *whatever shape the window is*.

    The first version was a bare dot product, whose range depends on the
    direction vector and therefore on nothing the caller can predict: a sweep
    of 0.62 put the line near the middle on one aspect ratio and down in a
    corner on another, and the resting split came out as a small wedge instead
    of covering the title. The span below is the half-extent of that dot product
    over the unit square, so dividing by it makes the sweep mean exactly
    "this fraction of the way across" on any window.
  */
  float span = (abs(dir.x) + abs(dir.y)) * 0.5;
  float axis = (dot(uv - 0.5, dir) + span) / (2.0 * span);

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
uniform vec3 uDuskFog;
uniform vec3 uDawnFog;
varying vec3 vSplitWorld;
/* Worked out once in color_fragment and read again by the fog below. */
float gSplitDawn = 0.0;
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
    shader.uniforms.uDuskFog = split.uDuskFog;
    shader.uniforms.uDawnFog = split.uDawnFog;

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${SPLIT_VERTEX_HEAD}`)
      .replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>\n${SPLIT_VERTEX_BODY}`,
      );

    /*
      The air is part of the hour, and this is the line that proves it.

      Fog is a scene-wide uniform in three, so the first cut had one fog colour
      for both sides of the boundary — and because fog dominates everything at
      distance, dawn's pale haze washed straight across the dusk half. At the
      resting split the whole frame came out light and the title lost its
      background. Measured by eye and unmistakable: a territory that was
      supposed to be two-thirds dusk read as entirely dawn.

      So the fog chunk is replaced with the same mix the surface already made.
      Near and far stay global — they are distances, not colours, and the
      difference between the two hours there is small enough to interpolate.
    */
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <fog_fragment>",
        /* glsl */ `
        #ifdef USE_FOG
          float splitFogFactor = smoothstep( fogNear, fogFar, vFogDepth );
          gl_FragColor.rgb = mix(
            gl_FragColor.rgb,
            mix(uDuskFog, uDawnFog, gSplitDawn),
            splitFogFactor
          );
        #endif
        `,
      )
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
          gSplitDawn = dawnness;
          diffuseColor.rgb *= mix(uDusk, uDawn, dawnness);

          // A thin warm lip riding the boundary itself: the light arriving,
          // rather than a colour changing. §17 - it is what stops the sweep
          // reading as a wipe.
          /* The warm lip rides the boundary itself: the light arriving,
             rather than a colour changing (§17). Faded out once the boundary
             has left the frame in either direction, so a settled world has no
             stray glow along a corner. */
          float onScreen = smoothstep(-0.16, -0.04, uSweep) * (1.0 - smoothstep(1.04, 1.16, uSweep));
          float lip = 1.0 - smoothstep(0.0, uBand * 1.35, abs(axis - uSweep));
          diffuseColor.rgb += vec3(0.16, 0.10, 0.05) * lip * onScreen;
        }
        `,
      );
  };

  /* Two materials with different colours must not share a compiled program. */
  material.customProgramCacheKey = () => `split:${duskHex}:${dawnHex}`;
  material.needsUpdate = true;

  return material;
}
