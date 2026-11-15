/**
 * Whether this browser is compositing in software, with no GPU at all.
 *
 * The one machine the cards hold still for (Deck.tsx sets
 * html[data-titles-still]): every effect on them is a transform or an
 * opacity the compositor carries, which any GPU handles and a software
 * rasteriser does not. Read once and cached; a WebGL context is created
 * only to read the renderer's name, then handed back.
 */
const SOFTWARE = /swiftshader|llvmpipe|software|basic render|microsoft basic/i;
let cached: boolean | undefined;

export function compositesInSoftware(): boolean {
  if (cached !== undefined) return cached;
  if (typeof window === "undefined") return false;
  cached = false;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ?? (canvas.getContext("webgl") as WebGLRenderingContext | null);
    if (!gl) return cached;
    /* The extension is absent or masked in most browsers: absence is no
       evidence of software, not evidence of it. */
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? "") : "";
    cached = SOFTWARE.test(name);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}
