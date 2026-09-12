"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BOOT_EXIT,
  BOOT_MAX,
  BOOT_MIN,
  BOOT_MIN_SHORT,
  BOOT_SETTLE,
  type BootPhase,
  whenReady,
} from "@/lib/boot/boot";
import { FrontierBootMark } from "./FrontierBootMark";
import styles from "./BootScreen.module.css";

/**
 * The boot layer.
 *
 * Rendered by the server on every route, so it is in the very first frame the
 * browser paints on the one route that boots. Everywhere else a global rule
 * hides it outright — without that it would flash for a frame on every hard
 * load before hydration could remove it, which is the exact fault this whole
 * layer exists to prevent, merely inverted.
 *
 * Being in the first painted frame is the whole of how §1 is satisfied: a
 * pre-paint script in the head stamps `data-boot` on the document, CSS hides
 * the application and shows this, and neither waits for React. By the time
 * this component hydrates the boot screen has already been on screen for a
 * while.
 *
 * The application underneath is mounted and laid out the entire time — §9
 * asks for exactly that — merely not visible. Home is not built when the boot
 * ends; it is uncovered.
 *
 * The state machine is deterministic and every path reaches HOME_VISIBLE:
 *
 *   BOOT_INIT → BOOT_LOADING → BOOT_READY → BOOT_EXIT → HOME_VISIBLE
 *
 * and three separate things guarantee the last step. This component's own
 * maximum, the exit timer, and — for the failure that matters, the
 * application never starting at all — a timeout inside the inline script
 * itself, which does not need React to be alive.
 */
export function BootScreen() {
  const [phase, setPhase] = useState<BootPhase>("BOOT_INIT");
  const timers = useRef<number[]>([]);
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setPhase("BOOT_EXIT");

    const id = window.setTimeout(() => {
      setPhase("HOME_VISIBLE");
      document.documentElement.setAttribute("data-boot", "done");
    }, BOOT_EXIT);
    timers.current.push(id);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mode = root.getAttribute("data-boot");

    // Either the stamp never ran, or the failsafe already fired, or this is a
    // navigation rather than a load. Nothing to do.
    if (mode !== "play" && mode !== "short") {
      setPhase("HOME_VISIBLE");
      return;
    }

    setPhase("BOOT_LOADING");
    const started = Date.now();
    const floor = mode === "short" ? BOOT_MIN_SHORT : BOOT_MIN;
    let cancelled = false;

    const settle = () => {
      if (cancelled || done.current) return;
      setPhase("BOOT_READY");
      timers.current.push(window.setTimeout(finish, BOOT_SETTLE));
    };

    whenReady().then(() => {
      if (cancelled) return;
      // Ready early is the common case, and it does not shorten the beat
      // below its minimum: a boot screen that flickers past is worse than no
      // boot screen at all.
      const held = Math.max(0, floor - (Date.now() - started));
      timers.current.push(window.setTimeout(settle, held));
    });

    // Whatever happens upstream, the door opens.
    timers.current.push(window.setTimeout(settle, BOOT_MAX));

    return () => {
      cancelled = true;
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    };
  }, [finish]);

  useEffect(() => {
    document.documentElement.setAttribute("data-boot-phase", phase);
  }, [phase]);

  if (phase === "HOME_VISIBLE") return null;

  return (
    <div className={styles.boot} data-boot-layer="" data-phase={phase}>
      <div className={styles.field} aria-hidden="true">
        <FrontierBootMark />
        <p className={styles.wordmark}>The Frontier</p>
      </div>

      {/*
        The one thing here that is not decoration. A visitor using a screen
        reader is told the site is starting, once, and is not otherwise held:
        there is nothing focusable in this layer to be trapped by, and the
        application beneath becomes available the moment the boot ends.
      */}
      <p role="status" className={styles.announce}>
        Loading The Frontier
      </p>
    </div>
  );
}
