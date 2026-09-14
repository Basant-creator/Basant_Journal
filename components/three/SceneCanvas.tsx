"use client";

import { Canvas } from "@react-three/fiber";
import dynamic from "next/dynamic";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PCFSoftShadowMap } from "three";
import type { BufferGeometry, LightShadow, Material, Object3D, Scene, Texture, WebGLRenderer } from "three";
import { markScene } from "@/lib/three/profile";

/**
 * §38's overlay, and the reason it cannot simply be hidden in production.
 *
 * `process.env.NODE_ENV` is replaced by a literal at build time, so in a
 * production build this is `true ? () => null : dynamic(...)` — the branch
 * holding the `import()` is unreachable, webpack drops it, and no chunk for
 * the profiler is emitted at all. Rendering it behind a runtime flag instead
 * would ship every byte of it to every visitor to keep a panel nobody can
 * open.
 *
 * The empty component rather than `null` is so the call sites stay ordinary
 * JSX and do not each grow their own conditional.
 */
const StatsProbe =
  process.env.NODE_ENV === "production"
    ? () => null
    : dynamic(() => import("./SceneStats").then((m) => m.SceneStatsProbe), { ssr: false });

const StatsPanel =
  process.env.NODE_ENV === "production"
    ? () => null
    : dynamic(() => import("./SceneStats").then((m) => m.SceneStatsPanel), { ssr: false });

/**
 * Everything the scene is holding, handed back in an order that works.
 *
 * The per-object cleanups were all in place — every generated texture and
 * every hand-built geometry has a `dispose()` hanging off its own effect —
 * and measuring found that not one of them reached the GPU. Leaving /about
 * deleted 466 of 466 vertex buffers and 157 of 157 vertex arrays, and 0 of
 * 25 textures, 0 of 16 programs, 0 of 9 framebuffers.
 *
 * The cause is an ordering nobody chose. React tears the page down, the
 * cleanup below schedules the context release a task later, and R3F unmounts
 * its own reconciler root asynchronously — so the renderer was disposed at
 * +11ms and the tree that owns the textures unmounted at +15ms.
 * `renderer.dispose()` clears the properties map on its way out, so by the
 * time the twenty-two `texture.dispose()` calls arrived, three no longer had
 * a record of any of them and `deallocateTexture` returned without doing
 * anything. The disposal code ran. It had nothing left to talk to.
 *
 * Nothing leaked, because `forceContextLoss()` follows immediately and the
 * driver reclaims the lot — which is luck rather than design. The same
 * inversion leaks for real wherever a texture is released while the scene is
 * still alive: a tier change regenerating every canvas, a prop remounting, a
 * photograph arriving late and replacing the one already uploaded.
 *
 * So take the order rather than race it. At this point the scene is still
 * intact, because R3F has not reached it yet: walk it, hand back the
 * geometries, the materials, every texture a material is holding and every
 * shadow map, and *then* dispose the renderer. R3F's own pass follows and
 * finds the work already done, which costs nothing — dispose() is idempotent,
 * and a second call on a released object finds no properties to free.
 *
 * After: 19 of 25 textures, 15 of 16 programs, 6 of 9 framebuffers, and the
 * 466 buffers and 157 vertex arrays that were already coming back. On the LOW
 * tier, where there is no shadow pass, it is 18 of 23 textures and every one
 * of the five left is three's own — its 1x1 placeholder, its placeholder
 * cube, its 2D-array, its 3D, and a 16-wide RG16F lookup, all five created
 * before the first shader is compiled and all five the renderer's to keep.
 * The sixth on HIGH is the fire's shadow cube. Nothing the scene owns is left
 * on either tier.
 */
function releaseScene(scene: Scene | null): number {
  if (!scene) return 0;

  const done = new Set<object>();
  let released = 0;

  const release = (value: unknown) => {
    if (typeof value !== "object" || value === null) return;
    if (done.has(value)) return;
    const target = value as { dispose?: () => void };
    if (typeof target.dispose !== "function") return;
    done.add(value);
    target.dispose();
    released += 1;
  };

  const releaseMaterial = (material: Material) => {
    /*
      Every texture the material is holding, whatever the slot happens to be
      called. Naming them one by one — map, alphaMap, emissiveMap — means the
      next map somebody adds is a texture nobody releases, and the omission is
      invisible until something measures it.
    */
    for (const value of Object.values(material as unknown as Record<string, unknown>)) {
      if ((value as Texture | null)?.isTexture) release(value);
    }
    release(material);
  };

  scene.traverse((object: Object3D) => {
    const node = object as Object3D & {
      geometry?: BufferGeometry;
      material?: Material | Material[];
      shadow?: LightShadow;
    };

    if (node.geometry) release(node.geometry);

    if (Array.isArray(node.material)) node.material.forEach(releaseMaterial);
    else if (node.material) releaseMaterial(node.material);

    /*
      A point light's shadow is six faces of render target and belongs to no
      material, so nothing above would ever reach it. This releases the six
      framebuffers; the cube texture behind them survives, because three
      deletes a render target's framebuffers and leaves its texture handle to
      the context. Naming `shadow.map.texture` as well does not help —
      `deallocateTexture` wants a `__webglInit` that only ordinary uploads
      set — so it is not named, and the 4MB map goes with forceContextLoss a
      line later.
    */
    if (node.shadow) {
      release(node.shadow.map);
      release(node.shadow);
    }
  });

  return released;
}

interface SceneCanvasProps {
  children: ReactNode;
  /** Scene-space colour the renderer clears to, behind everything. */
  background?: string;
  /** Linear fog keeps distant geometry from reading as cut-out silhouettes. */
  fog?: { color: string; near: number; far: number };
  camera?: { position: [number, number, number]; fov?: number };
  /**
   * The renderer's pixel budget, from the quality tier.
   *
   * Uncapped, a 3x phone or a 4K display renders four to nine times the
   * pixels for a scene that is deliberately soft — all cost, no visible
   * gain. The cap used to be a flat [1, 2] for every machine; it is now the
   * one number that most reliably buys back a frame rate.
   */
  dpr?: [number, number];
  /**
   * Whether this machine draws shadows at all, and how finely.
   *
   * Off is a real answer, not a degraded one: at blue hour with the sun gone
   * there is very little to cast, and the scene was built to read without
   * them. Where they earn their cost is the camp itself — §28 wants them
   * spent on the fire, the table, the tent and the props, and nowhere else.
   */
  shadows?: { enabled: boolean; mapSize: number };
  onContextLost?: () => void;
}

/**
 * The renderer.
 *
 * Four decisions here exist to keep a portfolio from behaving like a demo:
 *
 *   1. `dpr` is capped at 2. Uncapped, a 3x phone or a 4K display renders
 *      four to nine times the pixels for a scene that is deliberately soft —
 *      all cost, no visible gain.
 *   2. `frameloop="demand"` by default is *not* used, because this scene has
 *      a fire in it; but the loop is stopped the moment the canvas leaves the
 *      viewport, so a scene behind a scrolled page draws nothing.
 *   3. Everything is disposed on unmount. R3F unmounts its own tree, but the
 *      renderer holds GPU memory until told otherwise, and a portfolio that
 *      leaks a context per visit will eventually fail to create one.
 *   4. Context loss is caught and reported upward rather than left as a black
 *      rectangle — the caller falls back to the illustrated scene.
 */
export function SceneCanvas({
  children,
  background = "#1a1410",
  fog,
  camera = { position: [0, 1.6, 6], fov: 42 },
  dpr = [1, 2],
  shadows = { enabled: false, mapSize: 512 },
  onContextLost,
}: SceneCanvasProps) {
  const holder = useRef<HTMLDivElement | null>(null);
  const renderer = useRef<WebGLRenderer | null>(null);
  /* Held for the teardown, which needs the scene while it is still populated. */
  const world = useRef<Scene | null>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [awake, setAwake] = useState(true);

  /*
    Stable, because it is added as a listener inside onCreated and has to be
    the same function when the teardown below removes it.
  */
  const lost = useCallback(
    (event: Event) => {
      event.preventDefault();
      onContextLost?.();
    },
    [onContextLost],
  );

  /*
    The context, released on unmount.

    This used to be a cleanup returned from onCreated, which reads perfectly
    and never ran: R3F calls onCreated for its side effects and ignores what it
    returns. The comment claimed the renderer's GPU memory was being handed
    back and nothing was handing it back.

    It showed up as eviction rather than as an error. Entering and leaving Camp
    six times requested twelve contexts and the browser began force-losing
    them — "THREE.WebGLRenderer: Context Lost." four times over — because a
    browser caps how many it will keep alive and starts dropping the oldest.
    The scene that gets dropped is somebody's, and they see a dead canvas.

    forceContextLoss is the part that matters. dispose() releases three's own
    objects; only forcing the loss gives the context itself back, and the cap
    is on contexts.

    It is deferred by a task because of StrictMode, which replays effects on
    a tree that is still mounted: run, tear down, run again. Whether that
    replay destroys the live context depends on whether onCreated has already
    assigned the renderer by then — it usually has not, which is why an
    immediate version appeared to work. That is a race, not a guarantee, and
    the losing side of it is a canvas that renders nothing for the whole
    visit.

    The replay re-runs this effect in the same task, which cancels the
    pending teardown. A real unmount has nothing to cancel it, so the context
    is released a task later. Same shape of fix as the journal cover in Phase
    4: decide on the second run, not the first.

    Verified by exceeding the cap rather than by reasoning: twenty-two
    entries and exits requested eighty-eight contexts and the last scene was
    still rendering, with its context alive and the bridge projecting. Held
    open, a browser refuses new ones somewhere around sixteen.

    The scene is released first — see releaseScene above for why the order is
    taken here rather than left to React and R3F to interleave.
  */
  const teardown = useRef<number | null>(null);
  useEffect(() => {
    /* Cancels a teardown that a StrictMode replay scheduled a moment ago. */
    if (teardown.current !== null) {
      window.clearTimeout(teardown.current);
      teardown.current = null;
    }

    return () => {
      teardown.current = window.setTimeout(() => {
        teardown.current = null;
        const gl = renderer.current;
        if (!gl) return;
        gl.domElement.removeEventListener("webglcontextlost", lost);
        releaseScene(world.current);
        world.current = null;
        gl.dispose();
        gl.forceContextLoss();
        renderer.current = null;
      }, 0);
    };
  }, [lost]);

  // Stop drawing when the scene is off screen. A fire nobody is looking at is
  // a fire nobody needs rendered.
  useEffect(() => {
    const node = holder.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /*
    And start again when the tab comes back.
    
    Intersection alone is not a sufficient signal for "should this be
    drawing". A hidden document reports nothing as intersecting, so the loop
    correctly stops — but the observer does not reliably fire again when the
    document returns, because from its point of view the element never moved.
    The loop then stays stopped on a scene the visitor is looking straight at.

    Measured: after ten navigations away and back with the tab hidden in
    between, the canvas was still at its default 300x150 with no frame ever
    drawn and the DOM bridge projecting nothing — scene mode "ready", context
    alive, simply never asked to render.

    Two signals, both required, each watched on its own.
  */
  useEffect(() => {
    const sync = () => setAwake(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    <div ref={holder} style={{ width: "100%", height: "100%" }}>
      <Canvas
        frameloop={onScreen && awake ? "always" : "never"}
        dpr={dpr}
        camera={{ position: camera.position, fov: camera.fov ?? 42, near: 0.1, far: 200 }}
        shadows={shadows.enabled ? { type: PCFSoftShadowMap } : false}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          // The scene is composited over the page's own dark ground, so the
          // canvas never needs to clear to transparent.
          alpha: false,
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(new THREE.Color(background), 1);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          // Dusk, not daylight — but ACES already rolls the highlights off, so
          // pulling exposure down as well crushed the scene into the clear colour.
          gl.toneMappingExposure = 1.05;
          scene.background = new THREE.Color(background);
          if (fog) {
            scene.fog = new THREE.Fog(new THREE.Color(fog.color), fog.near, fog.far);
          }

          renderer.current = gl;
          world.current = scene;
          /* The renderer exists: the chunk has arrived and evaluated. */
          markScene("created");

          const canvas = gl.domElement;
          canvas.addEventListener("webglcontextlost", lost);
        }}
      >
        {children}
        <StatsProbe />
      </Canvas>
      <StatsPanel />
    </div>
  );
}
