# The 3D boundary

Everything that imports `three` or `@react-three/fiber` lives in this
directory. Nothing outside it may import either package, directly or
transitively.

## Why the rule is absolute

`three` and its fiber renderer come to about **880 kB across three chunks**,
minified, measured from a production build. The shared bundle for this site is
**104 kB**. A single stray import from a shared component — a type import that
is not `import type`, a barrel file that re-exports a scene, a helper that
happens to live next to one — puts all of it in front of every visitor,
including the recruiter who came for the résumé and will never open Camp.

Next.js will not warn about this. The only thing that catches it is the bundle
report, so it is checked on every build (see below).

## The contract

```
app/, components/ (everywhere else), lib/
    |
    |  may import:  ThreeScene, and SceneProps for the payload
    |  may NOT import: three, @react-three/fiber, or anything else here
    v
components/three/ThreeScene.tsx     <- the only door
    |
    |  next/dynamic, ssr: false, mounted on idle
    v
components/three/**                 <- three lives only past here
```

`ThreeScene` is a plain React component with no 3D types in its signature. A
page asks for a scene by name, supplies what to show instead, and never touches
a renderer.

Data crosses in both directions and neither direction carries a 3D type:

- **In**, as `SceneProps` — a selection, a hover, a target to write positions
  onto. R3F renders into its own reconciler root, so React context does not
  reach inside the Canvas; passing the few values a scene needs as props is
  cheaper than bridging the context and easier to follow.
- **Out**, as CSS custom properties. `ObjectAnchors` projects each object to
  screen space and writes `--anchor-<id>-x/y` onto the Scene's stage. The DOM
  controls read those with the illustrated box as the `var()` fallback, so one
  expression positions them under either renderer.

## Checking it

```
npm run check:3d     # greps for the imports; must pass before commit
npm run build        # the shared figure confirms the result
```

```
+ First Load JS shared by all             104 kB
```

If that number jumps by hundreds of kilobytes, something outside this folder
has reached across the boundary.

## What belongs here

Renderers, cameras, lights, materials, geometry, and the scene graphs built
from them. Nothing else — no portfolio content, no routing, no copy. A 3D
object emits an interaction; the DOM decides what it means. That separation is
what keeps the world removable: delete this folder and the site loses its
atmosphere, not its navigation or its content.

## The rules inside

Learned by breaking them. Each of these cost a debugging session.

**The camera is not OrbitControls, deliberately.** Orbit makes a scene an
object the visitor spins; these are places they look into. `CameraRig` rests,
leans with the pointer, and biases its aim toward a focused object rather than
centring on it — centring throws the neighbours off screen.

**Damping must be frame-rate independent.** `1 - exp(-lambda * dt)`, never a
fixed per-frame fraction. Measured over one second of travel, the exponential
form lands identically from 30Hz to 144Hz — sixteen decimal places — while a
fixed fraction covers 0.71 of the distance at 30Hz and 1.00 at 144Hz. That
difference is invisible on the machine it was written on. Cap `dt` too: the
frameloop stops off screen and the frame after it resumes can carry any delta
— uncapped, a three-second absence moves the camera 0.999 of the way in one
frame.

**Nothing is allocated per frame.** Vectors are made once and mutated; buffers
are seeded once and the group is moved instead. Sixty allocations a second,
discarded, is a stutter every few seconds when the collector runs.

**Release the context, not just the objects.** `dispose()` frees three's own
memory; only `forceContextLoss()` returns the context. Browsers cap how many
they keep alive and force-lose the oldest: without release, six entries into
Camp were enough to start seeing `THREE.WebGLRenderer: Context Lost.` With it,
twenty-two entries and exits requested eighty-eight contexts and the last
scene still rendered. Defer the teardown one task: StrictMode replays effects
on a still-mounted tree, and an immediate cleanup can destroy the live
renderer.

**A lost context must fall back.** That decision belongs to `ThreeScene`, not
to the scene that just lost its GPU.

**Two signals decide whether to draw**: intersection *and* document
visibility. A hidden document reports nothing as intersecting, and the observer
does not reliably fire again when it returns.

**Clear what you wrote onto the page.** The anchor properties live on the
Scene's stage, which outlives the canvas. Left behind, they strand the
controls where the camera last put them, over a drawing that never moved.

**The fallback is a picture and nothing else.** Both branches wrap it in
`role="img"` with the same label, which makes it a leaf in the accessibility
tree. Controls go in `children`, which render in both branches.

**Read the world's data; do not restate it.** The ridges come from
`ridgeProfiles()` — the same seeded stream the survey map draws — and the smoke
uses the 2D camp's own cycle. `palette.ts` is the one deliberate duplication,
because a material cannot read a CSS custom property, and it names its source.
