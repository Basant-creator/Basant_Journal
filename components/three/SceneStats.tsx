"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { BufferGeometry, LightShadow, Material, Object3D, Scene, Texture } from "three";
import { markScene, sceneTimings } from "@/lib/three/profile";
import { detectQualityTier } from "@/lib/three/quality";
import styles from "./SceneStats.module.css";

/**
 * §38's overlay: what the scene actually costs, while it is being built.
 *
 * Development only, and enforced by never importing this module in a
 * production build — `SceneCanvas` decides with a folded constant, so the
 * dynamic import below it is dead code webpack removes and this file does not
 * become a chunk at all. A profiler that ships is a profiler that has to be
 * designed, and this one has not been.
 *
 * It is two pieces because the numbers are on two sides of a wall. Everything
 * about the frame lives inside the renderer and can only be read from a
 * `useFrame`; everything about the panel is DOM and cannot be inside a Canvas.
 * The sampler writes into a ref that the panel reads on a timer, rather than
 * setting state per frame — a profiler that re-renders React sixty times a
 * second is measuring itself.
 */

export interface SceneSample {
  fps: number;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
  /** Estimated bytes of texture on the GPU, mipmaps included. */
  textureBytes: number;
  frame: number;
  /** The renderer's own drawing-buffer scale, which is the tier's dpr cap. */
  dpr: number;
}

const EMPTY: SceneSample = {
  fps: 0,
  calls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  programs: 0,
  textureBytes: 0,
  frame: 0,
  dpr: 0,
};

/* Shared between the two halves. One scene is on screen at a time. */
const live = { sample: EMPTY, at: 0 };

/**
 * How much texture memory a scene is holding.
 *
 * three counts textures and does not weigh them, and the difference matters:
 * this scene's textures are canvases it drew for itself, and the tier's
 * `textureScale` multiplies every one of their dimensions. Counting them tells
 * you nothing about what doubling that number costs.
 *
 * Four bytes a texel, and a third again where mipmaps are generated — the
 * standard 1 + 1/4 + 1/16 + ... series, which converges to 4/3. An estimate,
 * clearly, but the right order of magnitude and it moves when the thing it is
 * measuring moves.
 */
function textureBytes(scene: Scene): number {
  const seen = new Set<object>();
  let bytes = 0;

  const measure = (texture: Texture | null | undefined) => {
    if (!texture || seen.has(texture)) return;
    seen.add(texture);

    const image = texture.image as { width?: number; height?: number } | null;
    const w = image?.width ?? 0;
    const h = image?.height ?? 0;
    if (!w || !h) return;

    bytes += w * h * 4 * (texture.generateMipmaps ? 4 / 3 : 1);
  };

  const measureMaterial = (material: Material) => {
    for (const value of Object.values(material as unknown as Record<string, unknown>)) {
      if ((value as Texture | null)?.isTexture) measure(value as Texture);
    }
  };

  scene.traverse((object: Object3D) => {
    const node = object as Object3D & {
      geometry?: BufferGeometry;
      material?: Material | Material[];
      shadow?: LightShadow;
    };

    if (Array.isArray(node.material)) node.material.forEach(measureMaterial);
    else if (node.material) measureMaterial(node.material);

    /* A shadow map is not on any material and is usually the largest single
       allocation in the scene. A cube shadow is six faces of it. */
    const shadow = node.shadow;
    if (shadow?.map) {
      const faces = (shadow.map.texture as { isCubeTexture?: boolean })?.isCubeTexture ? 6 : 1;
      bytes += shadow.mapSize.x * shadow.mapSize.y * 4 * faces;
    }
  });

  return bytes;
}

/** Inside the Canvas. Samples the renderer; renders nothing. */
export function SceneStatsProbe() {
  const { gl, scene } = useThree();
  const frames = useRef(0);
  const since = useRef(0);
  const heavy = useRef(0);
  const bytes = useRef(0);
  const first = useRef(true);

  useFrame(() => {
    if (first.current) {
      first.current = false;
      markScene("drawn");
    }

    frames.current += 1;
    const now = performance.now();
    if (since.current === 0) since.current = now;

    const elapsed = now - since.current;
    if (elapsed < 250) return;

    /* Walking the scene for texture sizes is not a per-frame cost. Every two
       seconds is often enough to notice a texture arriving and cheap enough
       not to be the reason the frame rate dropped. */
    if (now - heavy.current > 2000) {
      heavy.current = now;
      bytes.current = textureBytes(scene);
    }

    live.sample = {
      fps: Math.round((frames.current / elapsed) * 1000),
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length ?? 0,
      textureBytes: bytes.current,
      frame: gl.info.render.frame,
      dpr: gl.getPixelRatio(),
    };
    live.at = now;

    frames.current = 0;
    since.current = now;
  });

  return null;
}

function mb(bytes: number): string {
  if (!bytes) return "—";
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function ms(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)} ms`;
}

function count(value: number): string {
  return value.toLocaleString("en-GB");
}

/**
 * Beside the Canvas, in the DOM — and portalled to the body, because beside
 * the Canvas is not far enough out.
 *
 * `ThreeScene`'s picture layer carries `z-index: 0` with `position: absolute`,
 * which makes it a stacking context. A `position: fixed` child of a stacking
 * context does not escape it: the panel's z-index of 160 was being resolved
 * *inside* a layer that itself sits at 0, so the record paper — painted later
 * in the document, at no z-index at all — covered it completely. Measured:
 * `elementFromPoint` at the centre of the panel returned the record's body
 * text.
 *
 * Same family as the bug at upgrade 27. There a position rule collapsed a box;
 * here a z-index rule quietly re-parents what "on top" means. The transition
 * readout never hits this because it is mounted in the root layout, outside
 * every scene layer — so the panel goes where that one already is.
 */
export function SceneStatsPanel() {
  const [sample, setSample] = useState<SceneSample>(EMPTY);
  const [stale, setStale] = useState(false);
  const [open, setOpen] = useState(true);
  /*
    The portal target, taken after mount rather than during render.

    Reading `document.body` inline threw "Target container is not a DOM
    element" into the console — caught by the route's error boundary, so the
    panel recovered and rendered, and the only evidence was three red lines
    nobody had reason to read. A development tool that cries wolf on every
    load trains you to ignore the console, which is where the last two bugs in
    this phase were found.
  */
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.body), []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSample(live.sample);
      /* The loop stops when the canvas leaves the viewport or the tab hides,
         which is correct and makes every number below a fossil. Say so
         rather than showing 60fps for a scene that is not drawing. */
      setStale(live.at !== 0 && performance.now() - live.at > 1200);
    }, 300);
    return () => window.clearInterval(id);
  }, []);

  const timings = sceneTimings();
  const tier = detectQualityTier();

  if (!host) return null;

  if (!open) {
    return createPortal(
      <button type="button" className={styles.reopen} onClick={() => setOpen(true)}>
        stats
      </button>,
      host,
    );
  }

  return createPortal(
    <div className={styles.panel} data-stale={stale || undefined}>
      <div className={styles.head}>
        <span className={styles.tier}>{tier}</span>
        <span className={styles.fps}>{stale ? "paused" : `${sample.fps} fps`}</span>
        <button type="button" className={styles.close} onClick={() => setOpen(false)}>
          ×
        </button>
      </div>

      <dl className={styles.rows}>
        <dt>draw calls</dt>
        <dd>{count(sample.calls)}</dd>

        <dt>triangles</dt>
        <dd>{count(sample.triangles)}</dd>

        <dt>geometries</dt>
        <dd>{count(sample.geometries)}</dd>

        <dt>textures</dt>
        <dd>
          {count(sample.textures)} <span className={styles.aside}>{mb(sample.textureBytes)}</span>
        </dd>

        <dt>programs</dt>
        <dd>{count(sample.programs)}</dd>

        <dt>pixel ratio</dt>
        <dd>{sample.dpr.toFixed(2)}</dd>

        <dt>asset load</dt>
        <dd>{ms(timings.asset)}</dd>

        <dt>scene load</dt>
        <dd>{ms(timings.scene)}</dd>

        <dt>frames</dt>
        <dd>{count(sample.frame)}</dd>
      </dl>
    </div>,
    host,
  );
}
