"use client";

import { useEffect } from "react";
import { WEAK_MACHINE_EVENT, nativeScrollChosen } from "@/lib/motion/budget";
import { probeGpu, sceneStruggled } from "@/lib/three/quality";

/**
 * Puts the machine's motion budget on <html> as `data-motion="still"`.
 *
 * The reasoning is in lib/motion/budget.ts; this only applies it. It renders
 * nothing and sets the attribute at most once — nothing takes it away again
 * in a visit, because a machine that was weak a minute ago still is.
 *
 * The GPU question costs a throwaway WebGL context, so it is asked when the
 * browser is idle rather than during hydration. The other two signals are
 * cheap and are read at once, and again whenever one of them fires.
 */
export function MotionBudget() {
  useEffect(() => {
    const root = document.documentElement;
    const still = () => {
      root.dataset.motion = "still";
    };

    const decide = () => {
      if (sceneStruggled() || nativeScrollChosen()) still();
    };
    decide();
    window.addEventListener(WEAK_MACHINE_EVENT, decide);

    const askGpu = () => {
      if (probeGpu()?.software) still();
    };
    let idle = 0;
    let timer = 0;
    if (typeof window.requestIdleCallback === "function") {
      idle = window.requestIdleCallback(askGpu, { timeout: 2000 });
    } else {
      timer = window.setTimeout(askGpu, 800);
    }

    return () => {
      window.removeEventListener(WEAK_MACHINE_EVENT, decide);
      if (idle) window.cancelIdleCallback(idle);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return null;
}
