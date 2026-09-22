"use client";

import dynamic from "next/dynamic";

/**
 * Where the bench switch is let into the page, and where it is kept out.
 *
 * The panel itself returning `null` in production is not enough, and the build
 * says so: a static `import` pulls the module into the graph whether or not it
 * ever renders, so its stylesheet was extracted and served on every route —
 * 0 uses, 100% of the bytes. A development control that ships its own CSS to
 * visitors is still shipping.
 *
 * `process.env.NODE_ENV` is replaced by a literal at build time, so in a
 * production build this is `true ? () => null : dynamic(...)`. The dynamic
 * branch is unreachable, the import inside it is never traced, and the panel
 * and its stylesheet leave the bundle entirely rather than riding along
 * disabled. Same mechanism as SceneCanvas uses for the render statistics, and
 * chosen for the same reason: a folded constant cannot be left switched on.
 */
const Panel =
  process.env.NODE_ENV === "production"
    ? () => null
    : dynamic(() => import("./AudioLab").then((m) => m.AudioLab), { ssr: false });

export function AudioLabMount() {
  return <Panel />;
}
