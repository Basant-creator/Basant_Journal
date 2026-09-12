"use client";

import { type ReactNode, useEffect, useState } from "react";
import { TornPaperTransition } from "./TornPaperTransition";

interface PaperRevealProps {
  children: ReactNode;
  seed: string;
  /** Milliseconds to hold the cover before it tears. */
  delay?: number;
  /** Drive it yourself instead of on mount — for object-to-document moments. */
  open?: boolean;
  cover?: ReactNode;
  tone?: "paper" | "light" | "dark";
  className?: string;
}

/**
 * Content arriving from under a sheet of paper.
 *
 * The declarative wrapper around TornPaperTransition: cover on, brief hold,
 * tear. Used where a document should feel uncovered rather than faded in —
 * opening a record, or landing on a page from a physical object in a scene.
 *
 * It is a reveal, never a gate. The content renders from the server and is
 * readable the whole time; the cover is a sheet lying on top of it that
 * leaves. Without JavaScript the cover never appears at all, so the page is
 * simply the page — which is the right failure.
 */
export function PaperReveal({
  children,
  seed,
  delay = 240,
  open,
  cover,
  tone = "paper",
  className,
}: PaperRevealProps) {
  // Controlled when `open` is supplied, self-playing otherwise.
  const controlled = open !== undefined;
  const [torn, setTorn] = useState(true);

  useEffect(() => {
    if (controlled) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTorn(true);
      return;
    }

    // Cover on only after mount, so the server-rendered document is never
    // covered — a visitor without JavaScript sees no cover at all.
    setTorn(false);
    const timer = setTimeout(() => setTorn(true), delay);
    return () => clearTimeout(timer);
  }, [controlled, delay]);

  return (
    <TornPaperTransition
      seed={seed}
      open={controlled ? open : torn}
      cover={cover}
      tone={tone}
      className={className}
    >
      {children}
    </TornPaperTransition>
  );
}
