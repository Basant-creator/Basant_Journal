/**
 * The boot sequence.
 *
 * Two systems, and the brief is emphatic that they must not be conflated:
 * this is the one that happens *before the Home page exists visually*. The
 * route transition system — chapters, the curtain, the index plate — is a
 * different thing entirely and lives in lib/transition.
 *
 * The hard requirement is §1: no flash of Home before the boot layer. That is
 * not achievable from React, because React runs after the document has
 * already painted. It has to be decided before first paint, by a script in
 * the head, exactly as this codebase already does for the entry choreography.
 */

export const BOOT_KEY = "frontier.booted";

/** Never shorter than this, even if everything is already in hand. */
export const BOOT_MIN = 900;

/** A reload inside the same session gets the short version. */
export const BOOT_MIN_SHORT = 420;

/** Long enough for fonts on a slow connection; short enough to forgive. */
export const BOOT_MAX = 2200;

/** How long to wait on fonts before deciding to live without them. */
export const FONT_LIMIT = 1200;

/** The pause before it leaves — a mechanism coming to rest. */
export const BOOT_SETTLE = 200;

/** The dissolve. */
export const BOOT_EXIT = 520;

/**
 * The failsafe, and the reason it lives in the inline script rather than in
 * React: §12 asks that a failed initialisation must never leave a visitor
 * staring at a loading emblem. Every timer inside the application is useless
 * against the one failure that matters — the application not starting. This
 * one runs whether or not React ever hydrates.
 */
export const BOOT_FAILSAFE = 3600;

/**
 * Runs before first paint, inline in <head>.
 *
 * Stamps the document so CSS can hide the application and show the boot layer
 * in the very first frame. If it does not run at all — scripting off, a
 * parse error — no attribute is set, no rule matches, the boot layer stays
 * hidden and the site is simply the site. That is the right failure.
 *
 * Only on the landing route. Booting is what happens before the Home
 * experience, and a direct load of /skills is not that: it has its own short
 * chapter reveal, and a boot screen over the top would hide it. Every framing
 * in the brief pairs the boot with Home — §1, §10, and the stack in §32.
 */
export const BOOT_STAMP_SCRIPT = `(function(){var d=document.documentElement;try{if(location.pathname!=="/"){d.setAttribute("data-boot","done");return}var s=false;try{s=window.sessionStorage.getItem("${BOOT_KEY}")==="1"}catch(e){}d.setAttribute("data-boot",s?"short":"play");try{window.sessionStorage.setItem("${BOOT_KEY}","1")}catch(e){}setTimeout(function(){if(d.getAttribute("data-boot")!=="done"){d.setAttribute("data-boot","done")}},${BOOT_FAILSAFE})}catch(e){try{d.setAttribute("data-boot","done")}catch(x){}}})();`;

export type BootPhase =
  | "BOOT_INIT"
  | "BOOT_LOADING"
  | "BOOT_READY"
  | "BOOT_EXIT"
  | "HOME_VISIBLE";

/**
 * What the boot waits for.
 *
 * Deliberately short, per §7: the application shell, and fonts that have
 * either arrived or been given up on. Not images, not the Camp scene, not
 * anything 3D, not an external API. The boot screen is not a place to hide a
 * slow website — it is the first frame of one.
 */
export function whenReady(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();

  const fonts =
    "fonts" in document && document.fonts
      ? (document.fonts as FontFaceSet).ready.then(() => undefined)
      : Promise.resolve();

  // Fonts that never resolve must not hold the door. The faces are
  // self-hosted with real fallbacks, so substituting is a cost of one
  // reflow rather than a broken page.
  const patience = new Promise<void>((resolve) => {
    window.setTimeout(resolve, FONT_LIMIT);
  });

  return Promise.race([fonts, patience]);
}
