"use client";

import { type ReactNode, useEffect, useState } from "react";
import styles from "./SceneTransition.module.css";

type Kind = "settle" | "rise" | "surface";

interface SceneTransitionProps {
  children: ReactNode;
  kind?: Kind;
  /** Milliseconds before this part arrives. Scenes stagger their contents. */
  delay?: number;
  className?: string;
}

/**
 * Entry and exit for a part of a scene.
 *
 * One rule governs the construction: the resting state is *visible*. Every
 * transition animates away from and back to the finished state, so an
 * animation that never runs leaves the content present and readable rather
 * than parked at opacity 0. That is the difference between a reveal and a
 * gate, and it is why this can be used freely without any of it becoming
 * load-bearing.
 */
export function SceneTransition({
  children,
  kind = "rise",
  delay = 0,
  className,
}: SceneTransitionProps) {
  const [mounted, setMounted] = useState(false);

  // Play on mount rather than on render, so a server-rendered document is
  // always complete before anything animates.
  useEffect(() => setMounted(true), []);

  return (
    <div
      className={[styles.part, styles[kind], className].filter(Boolean).join(" ")}
      data-play={mounted ? "true" : undefined}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
