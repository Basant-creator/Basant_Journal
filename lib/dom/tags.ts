/**
 * The element names a surface component may render as.
 *
 * Deliberately a short list rather than React's `ElementType`. Two reasons,
 * and the second is not optional:
 *
 *   1. A paper surface is a container. It has no business being an <input> or
 *      an <svg>, and saying so in the type is better than hoping.
 *   2. React Three Fiber augments the global JSX namespace with every three.js
 *      object. Under that augmentation `ElementType` becomes an enormous
 *      union, and TypeScript collapses the intersection of its props to
 *      `never` — so `<Tag className=...>` stops compiling everywhere, in files
 *      that have nothing to do with 3D. Naming the tags keeps the union small
 *      and the boundary's blast radius at zero.
 */
export type SurfaceTag =
  | "div"
  | "section"
  | "article"
  | "aside"
  | "li"
  | "figure"
  | "header"
  | "footer";
