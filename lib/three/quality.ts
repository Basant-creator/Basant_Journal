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
  /**
   * What the connection says about itself.
   *
   * §39 asks that the Camp not destroy initial page performance and that the
   * portfolio not be sacrificed for one scene. Neither is satisfied by
   * sending 880kB of renderer down a 2G connection to draw a campfire, and
   * neither is a GPU question — which is why this is here and not in the
   * WebGL probe.
   *
   * saveData is a direct instruction from the visitor and is treated as one.
   *
   * The other two are an estimate, and they are graded rather than pooled
   * because they are not the same claim — see tierFor.
   */
  saveData: boolean;
  /** slow-2g or 2g: a link the renderer should not be sent down at all. */
  slowLink: boolean;
  /** 3g: slow enough to spend less on, not slow enough to refuse. */
  modestLink: boolean;
}

const SOFTWARE = /swiftshader|llvmpipe|software|basic render|microsoft basic/i;

/** What the GPU itself said, which cannot change while the page is open. */
interface GpuFacts {
  webgl2: boolean;
  maxTextureSize: number;
  software: boolean;
}

/**
 * Asked once.
 *
 * Creating a context to throw it away costs 4.4ms median on a Radeon 780M
 * (nine runs, 3.5–6.7), and it was being paid three times on every mount of
 * a scene — `hasWebGL` asking, then `probeQuality` asking again, then
 * `detectQualityTier` asking a third time — and again on every media-query
 * recheck. 15.8ms of synchronous main thread to answer a question about a
 * graphics card that is not going to be swapped mid-visit.
 *
 * `undefined` means not yet asked; `null` means asked and the browser could
 * not give a context, which is an answer and is cached as one.
 */
let gpuFacts: GpuFacts | null | undefined;

export function probeGpu(): GpuFacts | null {
  if (gpuFacts !== undefined) return gpuFacts;
  if (typeof window === "undefined") return null;

  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ??
      (canvas.getContext("webgl") as WebGLRenderingContext | null);

    if (!gl) {
      gpuFacts = null;
      return null;
    }

    /* Only as a check for "this is not a GPU at all". The extension is
       absent or masked in most browsers now, which is fine — absence
       means no evidence, not bad evidence. */
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? "") : "";

    gpuFacts = {
      webgl2: typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) as number,
      software: SOFTWARE.test(name),
    };

    // Hand the context back; browsers cap how many stay alive.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    gpuFacts = null;
  }

  return gpuFacts;
}

/**
 * The whole probe: the cached GPU answer, plus the things that genuinely can
 * change while the page is open — a window dragged to a different display,
 * a phone rotated, a connection that improves. Those are read fresh every
 * time, which is the point of not caching the whole thing.
 */
export function probeQuality(): QualityProbe | null {
  if (typeof window === "undefined") return null;

  const gpu = probeGpu();
  const webgl2 = gpu?.webgl2 ?? false;
  const maxTextureSize = gpu?.maxTextureSize ?? 0;
  const software = gpu?.software ?? false;

  const mq = (q: string) => {
    try {
      return window.matchMedia(q).matches;
    } catch {
      return false;
    }
  };

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string; saveData?: boolean };
  };
  const link = nav.connection;
  const effective = link?.effectiveType ?? "";

  return {
    webgl2,
    maxTextureSize,
    dpr: window.devicePixelRatio || 1,
    shortSide: Math.min(window.screen?.width ?? 0, window.screen?.height ?? 0),
    coarsePointer: mq("(pointer: coarse)"),
    memoryGb: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    cores: typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : null,
    software,
    saveData: link?.saveData === true,
    /* Absent is not slow. Most browsers do not implement this at all, and
       guessing badly here costs a visitor the whole scene. */
    slowLink: effective === "slow-2g" || effective === "2g",
    modestLink: effective === "3g",
  };
}

/** The tier a probe earns. Pure, so it can be reasoned about and tested. */
export function tierFor(probe: QualityProbe | null): QualityTier {
  if (!probe || probe.maxTextureSize === 0) return "fallback";

  /* Asked not to, or on a link where the renderer would arrive late enough to
     be an interruption rather than a scene. Either way the illustrated camp
     is already on screen and complete, so there is nothing to wait for.
     saveData is the visitor speaking; 2G is the network being unarguable. */
  if (probe.saveData) return "fallback";

  /*
    A 2G *estimate* is not allowed to veto the scene on its own.

    This is the same argument the 3g block below already makes, finished. The
    comment there says effectiveType is "fine as one input among several and
    wrong as a veto" — and then 2g was left as a veto anyway, which is the
    half of the reasoning that had not been spent yet.

    It matters because the estimate is measurably wrong on the machine this
    was built on. CLAUDE.md records it: on localhost it reports 3g one minute
    and 4g the next, with nothing changed. A rolling average of recent round
    trips, on a connection doing almost nothing, reports whatever it last
    believed — and if it lands on 2g, a sixteen-core desktop silently loses
    the scene with no way to tell why.

    So it needs corroboration from the *device* before it refuses. A phone
    with four cores that also says 2g is a machine to believe; a desktop with
    sixteen cores and 16GB that says 2g is an API being wrong. Where the
    estimate stands alone it still costs a tier — the line below — which is
    the recoverable version of the same caution.

    saveData above keeps its veto, because that is the visitor speaking
    rather than the browser guessing.
  */
  const constrainedDevice =
    (probe.memoryGb !== null && probe.memoryGb <= 4) ||
    (probe.cores !== null && probe.cores <= 4) ||
    probe.coarsePointer;
  if (probe.slowLink && constrainedDevice) return "fallback";

  /* A software rasteriser reports WebGL and is not a GPU. It can draw this
     scene and it would draw it at a handful of frames a second, which is
     worse than the illustrated camp in every way that matters. hasWebGL()
     cannot tell the difference; this can, when the browser admits it. */
  if (probe.software) return "fallback";

  /* A context that cannot hold a 4096 texture is either very old or very
     constrained; either way it is not going to enjoy this scene. */
  if (probe.maxTextureSize < 4096) return "low";

  const small = probe.shortSide > 0 && probe.shortSide <= 480;
  const thinMemory = probe.memoryGb !== null && probe.memoryGb <= 4;
  const fewCores = probe.cores !== null && probe.cores <= 4;
  const heavyPixels = probe.dpr >= 3;

  /*
    A modest link buys less scene, not no scene.

    "3g" used to sit with 2G in the refusal above, and it cost a machine that
    should never have been asked the question: a sixteen-core desktop with
    16GB and a Radeon 780M, on localhost, was handed the illustrated camp
    because navigator.connection said 3g. effectiveType is a rolling estimate
    of recent round trips, and with little traffic to go on it reports
    whatever it last believed — which on a fast machine doing nothing is
    frequently not 4g.

    That is the §32 mistake wearing different clothes. A user-agent string is
    a claim about the device; effectiveType is a guess about the network; and
    neither is evidence about whether this GPU can draw a campfire. Both are
    fine as one input among several and wrong as a veto.

    So the estimate now does what an estimate should: it moves the tier down
    a step. Grass, stones and embers thin out, shadows go, the renderer draws
    at one device pixel. If the link really is 3G the scene costs less to
    deliver and less to run; if the link was never 3G at all, the visitor
    loses some density on a page they can still see properly. Refusing
    outright is the only outcome that is unrecoverable, and saveData — the
    one signal a visitor actually sets on purpose — still does exactly that.
  */
  if (
    small ||
    probe.modestLink ||
    /* A 2G estimate that survived the block above — an unconstrained device —
       still buys the cheapest scene rather than none. */
    probe.slowLink ||
    (probe.coarsePointer && (thinMemory || fewCores))
  ) {
    return "low";
  }

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
