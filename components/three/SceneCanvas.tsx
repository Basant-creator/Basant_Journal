"use client";

import { Canvas } from "@react-three/fiber";
import { type ReactNode, useEffect, useRef, useState } from "react";
import * as THREE from "three";

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
  const [visible, setVisible] = useState(true);

  // Stop drawing when the scene is off screen. A fire nobody is looking at is
  // a fire nobody needs rendered.
  useEffect(() => {
    const node = holder.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={holder} style={{ width: "100%", height: "100%" }}>
      <Canvas
        frameloop={visible ? "always" : "never"}
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

          const canvas = gl.domElement;
          const onLost = (event: Event) => {
            event.preventDefault();
            onContextLost?.();
          };
          canvas.addEventListener("webglcontextlost", onLost);

          // R3F disposes the tree; the renderer's own GPU memory is ours.
          return () => {
            canvas.removeEventListener("webglcontextlost", onLost);
            gl.dispose();
          };
        }}
      >
        {children}
      </Canvas>
    </div>
  );
}
