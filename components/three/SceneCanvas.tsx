"use client";

import { Canvas } from "@react-three/fiber";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { WebGLRenderer } from "three";

interface SceneCanvasProps {
  children: ReactNode;
  /** Scene-space colour the renderer clears to, behind everything. */
  background?: string;
  /** Linear fog keeps distant geometry from reading as cut-out silhouettes. */
  fog?: { color: string; near: number; far: number };
  camera?: { position: [number, number, number]; fov?: number };
  onContextLost?: () => void;
}

/**
 * The renderer.
 *
 * Four decisions here exist to keep a portfolio from behaving like a demo:
 *
 *   1. `dpr` is capped at 2. Uncapped, a 3x phone or a 4K display renders
 *      four to nine times the pixels for a scene that is deliberately soft —
 *      all cost, no visible gain.
 *   2. `frameloop="demand"` by default is *not* used, because this scene has
 *      a fire in it; but the loop is stopped the moment the canvas leaves the
 *      viewport, so a scene behind a scrolled page draws nothing.
 *   3. Everything is disposed on unmount. R3F unmounts its own tree, but the
 *      renderer holds GPU memory until told otherwise, and a portfolio that
 *      leaks a context per visit will eventually fail to create one.
 *   4. Context loss is caught and reported upward rather than left as a black
 *      rectangle — the caller falls back to the illustrated scene.
 */
export function SceneCanvas({
  children,
  background = "#1a1410",
  fog,
  camera = { position: [0, 1.6, 6], fov: 42 },
  onContextLost,
}: SceneCanvasProps) {
  const holder = useRef<HTMLDivElement | null>(null);
  const renderer = useRef<WebGLRenderer | null>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [awake, setAwake] = useState(true);

  /*
    Stable, because it is added as a listener inside onCreated and has to be
    the same function when the teardown below removes it.
  */
  const lost = useCallback(
    (event: Event) => {
      event.preventDefault();
      onContextLost?.();
    },
    [onContextLost],
  );

  /*
    The context, released on unmount.

    This used to be a cleanup returned from onCreated, which reads perfectly
    and never ran: R3F calls onCreated for its side effects and ignores what it
    returns. The comment claimed the renderer's GPU memory was being handed
    back and nothing was handing it back.

    It showed up as eviction rather than as an error. Entering and leaving Camp
    six times requested twelve contexts and the browser began force-losing
    them — "THREE.WebGLRenderer: Context Lost." four times over — because a
    browser caps how many it will keep alive and starts dropping the oldest.
    The scene that gets dropped is somebody's, and they see a dead canvas.

    forceContextLoss is the part that matters. dispose() releases three's own
    objects; only forcing the loss gives the context itself back, and the cap
    is on contexts.

    It is deferred by a task because of StrictMode, which replays effects on
    a tree that is still mounted: run, tear down, run again. Whether that
    replay destroys the live context depends on whether onCreated has already
    assigned the renderer by then — it usually has not, which is why an
    immediate version appeared to work. That is a race, not a guarantee, and
    the losing side of it is a canvas that renders nothing for the whole
    visit.

    The replay re-runs this effect in the same task, which cancels the
    pending teardown. A real unmount has nothing to cancel it, so the context
    is released a task later. Same shape of fix as the journal cover in Phase
    4: decide on the second run, not the first.

    Verified by exceeding the cap rather than by reasoning: twenty-two
    entries and exits requested eighty-eight contexts and the last scene was
    still rendering, with its context alive and the bridge projecting. Held
    open, a browser refuses new ones somewhere around sixteen.
  */
  const teardown = useRef<number | null>(null);
  useEffect(() => {
    /* Cancels a teardown that a StrictMode replay scheduled a moment ago. */
    if (teardown.current !== null) {
      window.clearTimeout(teardown.current);
      teardown.current = null;
    }

    return () => {
      teardown.current = window.setTimeout(() => {
        teardown.current = null;
        const gl = renderer.current;
        if (!gl) return;
        gl.domElement.removeEventListener("webglcontextlost", lost);
        gl.dispose();
        gl.forceContextLoss();
        renderer.current = null;
      }, 0);
    };
  }, [lost]);

  // Stop drawing when the scene is off screen. A fire nobody is looking at is
  // a fire nobody needs rendered.
  useEffect(() => {
    const node = holder.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /*
    And start again when the tab comes back.
    
    Intersection alone is not a sufficient signal for "should this be
    drawing". A hidden document reports nothing as intersecting, so the loop
    correctly stops — but the observer does not reliably fire again when the
    document returns, because from its point of view the element never moved.
    The loop then stays stopped on a scene the visitor is looking straight at.

    Measured: after ten navigations away and back with the tab hidden in
    between, the canvas was still at its default 300x150 with no frame ever
    drawn and the DOM bridge projecting nothing — scene mode "ready", context
    alive, simply never asked to render.

    Two signals, both required, each watched on its own.
  */
  useEffect(() => {
    const sync = () => setAwake(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    <div ref={holder} style={{ width: "100%", height: "100%" }}>
      <Canvas
        frameloop={onScreen && awake ? "always" : "never"}
        dpr={[1, 2]}
        camera={{ position: camera.position, fov: camera.fov ?? 42, near: 0.1, far: 200 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          // The scene is composited over the page's own dark ground, so the
          // canvas never needs to clear to transparent.
          alpha: false,
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(new THREE.Color(background), 1);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          // Dusk, not daylight — but ACES already rolls the highlights off, so
          // pulling exposure down as well crushed the scene into the clear colour.
          gl.toneMappingExposure = 1.05;
          scene.background = new THREE.Color(background);
          if (fog) {
            scene.fog = new THREE.Fog(new THREE.Color(fog.color), fog.near, fog.far);
          }

          renderer.current = gl;

          const canvas = gl.domElement;
          canvas.addEventListener("webglcontextlost", lost);
        }}
      >
        {children}
      </Canvas>
    </div>
  );
}
