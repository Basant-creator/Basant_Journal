# The 3D boundary

Everything that imports `three` or `@react-three/fiber` lives in this
directory. Nothing outside it may import either package, directly or
transitively.

## Why the rule is absolute

`three` is roughly 700 kB before compression. The shared bundle for this site
is 103 kB. A single stray import from a shared component — a type import that
is not `import type`, a barrel file that re-exports a scene, a helper that
happens to live next to one — puts all of it in front of every visitor,
including the recruiter who came for the résumé and will never open Camp.

Next.js will not warn about this. The only thing that catches it is the
bundle report, so it is checked on every build (see below).

## The contract

```
app/, components/ (everywhere else), lib/
    |
    |  may import:  ThreeScene  (the boundary component)
    |  may NOT import: three, @react-three/fiber, or anything in this folder
    |                  other than ThreeScene
    v
components/three/ThreeScene.tsx     <- the only door
    |
    |  next/dynamic, ssr: false
    v
components/three/**                 <- three lives only past here
```

`ThreeScene` is a plain React component with no 3D types in its signature. It
decides whether WebGL is available, loads the scene chunk only if it is, and
renders the caller's fallback otherwise. A page asks for a scene; it never
asks for a renderer.

## Checking it

The shared-bundle figure in `next build` output is the test:

```
+ First Load JS shared by all             103 kB
```

If that number jumps, something outside this folder has reached across the
boundary. `npm run check:3d` greps for the imports; the build number confirms
the result.

## What belongs here

Renderers, cameras, lights, materials, geometry, loaders, and the scene
graphs built from them. Nothing else — no portfolio content, no routing, no
copy. A 3D object emits an interaction; the DOM decides what that means and
displays it. That separation is what keeps the world removable: delete this
folder and the site loses its atmosphere, not its navigation or its content.
