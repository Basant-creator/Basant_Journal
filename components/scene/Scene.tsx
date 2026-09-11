"use client";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SceneContext } from "./SceneContext";
import styles from "./Scene.module.css";

interface SceneProps {
  children: ReactNode;
  /** Coordinate space of the scene's artwork. */
  width?: number;
  height?: number;
  /** Aspect on small screens, where the full frame is usually too tall. */
  compactRatio?: string;
  /** Pointer parallax. Off for scenes that are read rather than looked into. */
  parallax?: boolean;
  /** Plays the entry choreography on mount. */
  entry?: boolean;
  label?: string;
  className?: string;
}

/**
 * THE SCENE — the stage.
 *
 * A Scene is a fixed-ratio frame that establishes a coordinate space, a set of
 * depth bands, and a pointer position. Everything inside positions itself
 * against those, which is what lets an artwork layer and an interactive
 * object sit at the same place at every width without either knowing the
 * other exists.
 *
 * The ratio is load-bearing, not decorative: SceneObject positions its hit
 * areas as percentages, so the frame has to keep the artwork's proportions or
 * the controls drift off the things they belong to.
 */
export function Scene({
  children,
  width = 1600,
  height = 900,
  compactRatio = "16 / 10",
  parallax = true,
  entry = true,
  label,
  className,
}: SceneProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const frame = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", onChange);
    setReady(true);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!parallax || reducedMotion) return;
      if (event.pointerType !== "mouse") return;

      const stage = stageRef.current;
      if (!stage || frame.current !== null) return;

      const { clientX, clientY } = event;
      frame.current = window.requestAnimationFrame(() => {
        frame.current = null;
        const box = stage.getBoundingClientRect();
        stage.style.setProperty("--px", ((clientX - box.left) / box.width - 0.5).toFixed(3));
        stage.style.setProperty("--py", ((clientY - box.top) / box.height - 0.5).toFixed(3));
      });
    },
    [parallax, reducedMotion],
  );

  const rest = useCallback(() => {
    stageRef.current?.style.setProperty("--px", "0");
    stageRef.current?.style.setProperty("--py", "0");
  }, []);

  const value = useMemo(
    () => ({ width, height, ready, reducedMotion }),
    [width, height, ready, reducedMotion],
  );

  return (
    <SceneContext.Provider value={value}>
      <div
        ref={stageRef}
        className={[styles.stage, className].filter(Boolean).join(" ")}
        style={
          {
            "--scene-ratio": `${width} / ${height}`,
            "--scene-ratio-compact": compactRatio,
            "--px": 0,
            "--py": 0,
          } as CSSProperties
        }
        data-entry-scene={entry ? "true" : undefined}
        onPointerMove={onPointerMove}
        onPointerLeave={rest}
        role={label ? "img" : undefined}
        aria-label={label}
      >
        {children}
      </div>
    </SceneContext.Provider>
  );
}
