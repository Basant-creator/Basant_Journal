import { qualityOverride } from "@/lib/three/quality";

/**
 * How much of the world this machine is asked to carry.
 *
 * The site already has two answers to "how much may move here", and this
 * page uses both rather than adding a third system: reduced motion (the
 * visitor) and `html[data-motion="still"]` (lib/motion/budget.ts: a
 * machine that has shown it is weak). Between full and still there was
 * nothing, and on this page the difference is large: dust in three banks,
 * twenty-six motes, a lamp's haze, a chalk board drawn grain by grain on a
 * canvas. So the world carries a grade, `data-quality` on [data-world]:
 *
 *   high    everything.
 *   medium  half the motes, two dust banks, one bank of haze; the bar
 *           solid rather than blurring what scrolls under it.
 *   low     no particles and no loops in the air; pictures arrive as
 *           pictures, without the chalk.
 *
 * Decided once, from what the browser admits about the device (the same
 * signals lib/three/quality.ts reads, at the thresholds Lenis already uses
 * for its own decision), then lowered at most once more, from evidence:
 * the chalk board drawing slowly (Reveal) — a measured struggle, kept for
 * the session. It never comes back up within a visit and never flickers
 * between grades; a machine that struggled a minute ago still would.
 *
 * Nothing here assumes a phone is weak or a desktop strong: a phone with
 * eight cores and 8 GB is high, a four-core laptop is medium.
 */
export type Quality = "high" | "medium" | "low";

const STRUGGLED_KEY = "frontier:wanted-struggled";

function deviceQuality(): Quality {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const memory = typeof nav.deviceMemory === "number" ? nav.deviceMemory : null;
  const cores = typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null;
  if (nav.connection?.saveData) return "low";
  if ((memory !== null && memory <= 2) || (cores !== null && cores <= 2)) return "low";
  if ((memory !== null && memory <= 4) || (cores !== null && cores <= 4)) return "medium";
  return "high";
}

export function decideQuality(): Quality {
  /* The site's own override (?quality= or localStorage), for measuring. */
  const chosen = qualityOverride();
  if (chosen) return chosen === "fallback" ? "low" : chosen;
  try {
    if (window.sessionStorage.getItem(STRUGGLED_KEY) === "1") return "low";
  } catch {
    /* Storage refused: decided from the device alone. */
  }
  return deviceQuality();
}

export function qualityOf(el: Element | null): Quality {
  const value = el?.closest<HTMLElement>("[data-world]")?.dataset.quality;
  return value === "medium" || value === "low" ? value : "high";
}

/** The machine was seen struggling: low for the rest of the visit. */
export function struggled(el: Element | null): void {
  try {
    window.sessionStorage.setItem(STRUGGLED_KEY, "1");
  } catch {
    /* This page still lowers; the next load decides again. */
  }
  const world = el?.closest<HTMLElement>("[data-world]");
  if (world && qualityOf(world) !== "low" && !qualityOverride()) world.dataset.quality = "low";
}
