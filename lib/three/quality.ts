/**
 * How much scene this machine should be asked to draw.
 *
 * Deliberately beside capability.ts and not inside components/three: this
 * answers "how much" without importing a renderer, the same way capability
 * answers "whether". Both have to be cheap, because their answers decide
 * whether the expensive side loads at all.
 *
 * §32 is explicit that this must not be a user-agent sniff. Every signal here
 * is a measured capability or a property of the display — what the context
 * reports, how many pixels it would have to fill, how much memory and how many
 * cores the browser admits to. A string claiming to be an iPhone is not
 * evidence about a GPU.
 *
 * The heuristics are conservative in one direction on purpose. Guessing too
 * low costs some visual quality on a machine that could have taken more;
 * guessing too high costs a visitor a scene that stutters, on the one page
 * that is supposed to look effortless. When the evidence is thin, come down.
 */

export type QualityTier = "high" | "medium" | "low" | "fallback";

export interface QualityProbe {
  webgl2: boolean;
  /** The largest texture the context will accept. A real capability number. */
  maxTextureSize: number;
  /** Device pixel ratio, uncapped — how many real pixels a CSS pixel costs. */
  dpr: number;
  /** The short side of the screen in CSS pixels. */
  shortSide: number;
  /** No fine pointer usually means a touch device, which usually means a
   *  power budget. A signal, not a verdict. */
  coarsePointer: boolean;
  /** navigator.deviceMemory, in GB. Chromium only, coarse, often absent. */
  memoryGb: number | null;
  cores: number | null;
  /** Set when the context admits to being a software rasteriser. */
  software: boolean;
}

const SOFTWARE = /swiftshader|llvmpipe|software|basic render|microsoft basic/i;

export function probeQuality(): QualityProbe | null {
  if (typeof window === "undefined") return null;

  let webgl2 = false;
  let maxTextureSize = 0;
  let software = false;

  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ??
      (canvas.getContext("webgl") as WebGLRenderingContext | null);

    if (gl) {
      webgl2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;

      /* Only as a check for "this is not a GPU at all". The extension is
         absent or masked in most browsers now, which is fine — absence
         means no evidence, not bad evidence. */
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      if (info) {
        const name = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? "");
        software = SOFTWARE.test(name);
      }

      // Hand the context back; browsers cap how many stay alive.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    return null;
  }

  const mq = (q: string) => {
    try {
      return window.matchMedia(q).matches;
    } catch {
      return false;
    }
  };

  const nav = navigator as Navigator & { deviceMemory?: number };

  return {
    webgl2,
    maxTextureSize,
    dpr: window.devicePixelRatio || 1,
    shortSide: Math.min(window.screen?.width ?? 0, window.screen?.height ?? 0),
    coarsePointer: mq("(pointer: coarse)"),
    memoryGb: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    cores: typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : null,
    software,
  };
}

/** The tier a probe earns. Pure, so it can be reasoned about and tested. */
export function tierFor(probe: QualityProbe | null): QualityTier {
  if (!probe || probe.maxTextureSize === 0) return "fallback";
  if (probe.software) return "low";

  /* A context that cannot hold a 4096 texture is either very old or very
     constrained; either way it is not going to enjoy this scene. */
  if (probe.maxTextureSize < 4096) return "low";

  const small = probe.shortSide > 0 && probe.shortSide <= 480;
  const thinMemory = probe.memoryGb !== null && probe.memoryGb <= 4;
  const fewCores = probe.cores !== null && probe.cores <= 4;
  const heavyPixels = probe.dpr >= 3;

  if (small || (probe.coarsePointer && (thinMemory || fewCores))) return "low";

  /* WebGL1, or a machine filling three times the pixels with modest memory,
     gets the middle setting rather than the top one. */
  if (!probe.webgl2 || heavyPixels || thinMemory || fewCores) return "medium";

  return "high";
}

/**
 * What each tier actually changes.
 *
 * §31 is specific that composition must stay the same across tiers: the same
 * camp, framed the same way, with the same things on the table. What moves is
 * density and cost. A visitor on a weaker machine should not be able to tell
 * they are looking at a cheaper scene — only that it runs.
 */
export interface QualitySettings {
  /** Passed to the renderer as its device-pixel-ratio clamp. */
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  /** Multiplier on the canvas textures the props draw for themselves. */
  textureScale: number;
  embers: number;
  smokePlumes: number;
  grass: number;
  stones: number;
  trees: number;
  /** Bloom, grain, vignette — §29 wants these restrained and they are the
   *  first thing to go. */
  postProcessing: boolean;
}

export const QUALITY: Record<Exclude<QualityTier, "fallback">, QualitySettings> = {
  high: {
    dpr: [1, 2],
    shadows: true,
    shadowMapSize: 1024,
    textureScale: 2,
    embers: 14,
    smokePlumes: 3,
    grass: 260,
    stones: 40,
    trees: 96,
    postProcessing: true,
  },
  medium: {
    dpr: [1, 1.5],
    shadows: true,
    shadowMapSize: 512,
    textureScale: 1.5,
    embers: 9,
    smokePlumes: 3,
    grass: 150,
    stones: 26,
    trees: 64,
    postProcessing: true,
  },
  low: {
    dpr: [1, 1],
    shadows: false,
    shadowMapSize: 0,
    textureScale: 1,
    embers: 6,
    smokePlumes: 2,
    grass: 70,
    stones: 14,
    trees: 40,
    postProcessing: false,
  },
};

const OVERRIDE_KEY = "frontier:quality";

/**
 * A visitor's own choice, if they have made one. §32 asks for the door to
 * exist; the control that opens it is a later step's business.
 */
export function qualityOverride(): QualityTier | null {
  if (typeof window === "undefined") return null;
  try {
    const fromQuery = new URLSearchParams(window.location.search).get("quality");
    const stored = window.localStorage.getItem(OVERRIDE_KEY);
    const value = fromQuery ?? stored;
    return value === "high" || value === "medium" || value === "low" || value === "fallback"
      ? value
      : null;
  } catch {
    return null;
  }
}

/** The single decision every caller needs. */
export function detectQualityTier(): QualityTier {
  return qualityOverride() ?? tierFor(probeQuality());
}

export function settingsFor(tier: QualityTier): QualitySettings {
  return tier === "fallback" ? QUALITY.low : QUALITY[tier];
}
