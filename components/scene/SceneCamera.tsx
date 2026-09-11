"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useScene } from "./SceneContext";
import styles from "./SceneCamera.module.css";

export interface CameraTarget {
  /** Point to centre, in the scene's own coordinate space. */
  focus?: [number, number] | null;
  zoom?: number;
}

interface SceneCameraProps {
  children: ReactNode;
  target?: CameraTarget;
  /** Milliseconds. The camera is deliberately slow — it is a sheet being
   *  moved across a table, not a game camera snapping. */
  duration?: number;
}

/**
 * The camera.
 *
 * Frames a point in the scene by translating and scaling the whole stage
 * group. `transform-origin: 0 0` is what keeps the maths this simple: the
 * composed transform is exactly translate(x, y) scale(k), so centring a point
 * is one subtraction rather than a matrix.
 *
 * Under reduced motion the camera never moves. It is the single most
 * motion-heavy thing in a scene and the least load-bearing.
 */
export function SceneCamera({ children, target, duration = 900 }: SceneCameraProps) {
  const { width, height, reducedMotion } = useScene();

  const resting = { x: 0, y: 0, scale: 1 };
  let frame = resting;

  if (!reducedMotion && target?.focus) {
    const zoom = target.zoom ?? 1.28;
    frame = {
      x: width / 2 - target.focus[0] * zoom,
      y: height / 2 - target.focus[1] * zoom,
      scale: zoom,
    };
  }

  return (
    <motion.g
      className={styles.camera}
      initial={false}
      animate={frame}
      transition={{ duration: reducedMotion ? 0 : duration / 1000, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.g>
  );
}
