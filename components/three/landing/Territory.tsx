"use client";

import { useMemo } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  MeshLambertMaterial,
  PlaneGeometry,
} from "three";
import { splitMaterial } from "@/lib/three/split";
import {
  FLOOR,
  floorHeight,
  groundLevel,
  mesas,
  ranges,
  rocks,
  scrub,
  trail,
  type Range,
} from "@/lib/world/territory";
import { hours } from "../hours";

/**
 * The country itself.
 *
 * Every material here is a `MeshLambertMaterial` wearing two colours. Lambert
 * rather than Standard because there is nothing shiny in a dry territory and
 * the specular half of a PBR shader is pure cost; `flatShading` because §5
 * asks for controlled faceting, and a facet you can see is the difference
 * between low-poly and merely low-detail.
 *
 * Nothing in this file knows which hour it is. Each material is handed its
 * dusk colour and its dawn colour once, and the boundary in `lib/three/split`
 * decides per fragment which one a pixel wears. That is §12 in practice: one
 * set of shapes, drawn once, in two lights.
 */

/* -------------------------------------------------------------------------
   RANGES

   §2's actual complaint was "flat layered silhouettes", so these are not
   billboards. Each range is a ribbon folded back and forth in z — peak
   forward, valley back — which gives every segment two faces at different
   angles to the sun. That fold is the entire reason a range reads as
   landscape rather than as a shape cut out of paper, and it costs two
   triangles per peak.
   ------------------------------------------------------------------------- */

/** How far a range folds toward and away from the camera, in world units. */
const FOLD = 5.5;

function rangeGeometry(range: Range): BufferGeometry {
  const { peaks, base } = range;
  const positions: number[] = [];

  const push = (x: number, y: number, z: number) => {
    positions.push(x, y, z);
  };

  for (let i = 0; i < peaks.length - 1; i += 1) {
    const a = peaks[i];
    const b = peaks[i + 1];

    /* Alternating fold. The sign flips per segment so consecutive faces turn
       away from each other and the sun separates them. */
    const za = (i % 2 === 0 ? 1 : -1) * FOLD;
    const zb = (i % 2 === 0 ? -1 : 1) * FOLD;

    const ax = a.x;
    const bx = b.x;
    const ay = base + a.height;
    const by = base + b.height;

    /* Skirt: base to crest, two triangles. The base is dropped well below
       the floor so no gap can open where a range meets uneven ground. */
    const floor = base - 14;

    push(ax, floor, za);
    push(bx, floor, zb);
    push(bx, by, zb);

    push(ax, floor, za);
    push(bx, by, zb);
    push(ax, ay, za);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(positions), 3),
  );
  geometry.computeVertexNormals();
  return geometry;
}

function Ranges() {
  const bands = useMemo(
    () =>
      ranges.map((range) => ({
        range,
        geometry: rangeGeometry(range),
        material: splitMaterial(
          new MeshLambertMaterial({ flatShading: true }),
          hours.dusk.ground[range.tone],
          hours.dawn.ground[range.tone],
        ),
      })),
    [],
  );

  return (
    <>
      {bands.map(({ range, geometry, material }) => (
        <mesh
          key={range.id}
          geometry={geometry}
          material={material}
          position={[0, 0, range.z]}
        />
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------
   MESAS

   Five and six sided, tapered, turned so no two show the same face. A butte
   is one of the few shapes that is *more* convincing with fewer sides.
   ------------------------------------------------------------------------- */

function Mesas() {
  const built = useMemo(() => {
    const material = splitMaterial(
      new MeshLambertMaterial({ flatShading: true }),
      hours.dusk.ground.rock,
      hours.dawn.ground.rock,
    );

    return {
      material,
      shapes: mesas.map((mesa) => ({
        mesa,
        geometry: new CylinderGeometry(
          mesa.radius * mesa.taper,
          mesa.radius,
          mesa.height,
          mesa.facets,
          1,
        ),
      })),
    };
  }, []);

  return (
    <>
      {built.shapes.map(({ mesa, geometry }) => (
        <mesh
          key={mesa.id}
          geometry={geometry}
          material={built.material}
          position={[
            mesa.position[0],
            mesa.position[1] + mesa.height / 2,
            mesa.position[2],
          ]}
          rotation={[0, mesa.spin, 0]}
        />
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------
   THE FLOOR AND THE TRAIL
   ------------------------------------------------------------------------- */

function Floor() {
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(
      FLOOR.width,
      FLOOR.depth,
      FLOOR.segments[0],
      FLOOR.segments[1],
    );
    plane.rotateX(-Math.PI / 2);

    /* Displaced from the same seeded function the config exposes, so the
       relief is reproducible and — critically — rounded. */
    const position = plane.attributes.position as BufferAttribute;
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      position.setY(i, floorHeight(x, z));
    }
    position.needsUpdate = true;
    plane.computeVertexNormals();
    return plane;
  }, []);

  const material = useMemo(
    () =>
      splitMaterial(
        new MeshLambertMaterial({ flatShading: true }),
        hours.dusk.ground.plain,
        hours.dawn.ground.plain,
      ),
    [],
  );

  return <mesh geometry={geometry} material={material} position={FLOOR.origin} />;
}

function Trail() {
  const geometry = useMemo(() => {
    const positions: number[] = [];

    for (let i = 0; i < trail.length - 1; i += 1) {
      const a = trail[i];
      const b = trail[i + 1];
      /* Follows the swell, lifted a hand above it: co-planar surfaces
         z-fight, and a flickering path is worse than no path. */
      const ya = groundLevel(a.x, a.z) + 0.06;
      const yb = groundLevel(b.x, b.z) + 0.06;

      positions.push(a.x - a.half, ya, a.z);
      positions.push(a.x + a.half, ya, a.z);
      positions.push(b.x + b.half, yb, b.z);

      positions.push(a.x - a.half, ya, a.z);
      positions.push(b.x + b.half, yb, b.z);
      positions.push(b.x - b.half, yb, b.z);
    }

    const geo = new BufferGeometry();
    geo.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(positions), 3),
    );
    geo.computeVertexNormals();
    return geo;
  }, []);

  const material = useMemo(
    () =>
      splitMaterial(
        new MeshLambertMaterial({ flatShading: true }),
        hours.dusk.ground.trail,
        hours.dawn.ground.trail,
      ),
    [],
  );

  return <mesh geometry={geometry} material={material} />;
}

/* -------------------------------------------------------------------------
   SCATTER

   One geometry and one material per family, instanced by hand. Fourteen rocks
   and thirty bushes is few enough that plain meshes are cheaper than the
   bookkeeping an InstancedMesh would need, and it keeps each one's own squash
   and spin.
   ------------------------------------------------------------------------- */

function Rocks() {
  const geometry = useMemo(() => new IcosahedronGeometry(1, 0), []);
  const material = useMemo(
    () =>
      splitMaterial(
        new MeshLambertMaterial({ flatShading: true }),
        hours.dusk.ground.rock,
        hours.dawn.ground.rock,
      ),
    [],
  );

  return (
    <>
      {rocks.map((rock) => (
        <mesh
          key={rock.id}
          geometry={geometry}
          material={material}
          /* On the ground, not at a nominal ground level. Everything that
             stands on the plain asks the same function, so nothing floats and
             nothing sinks into a swell. */
          position={[
            rock.position[0],
            groundLevel(rock.position[0], rock.position[2]),
            rock.position[2],
          ]}
          rotation={[0, rock.spin, 0]}
          scale={[
            rock.scale * rock.squash[0],
            rock.scale * rock.squash[1],
            rock.scale * rock.squash[2],
          ]}
        />
      ))}
    </>
  );
}

function Scrub() {
  /* Four sides: a bush at this distance is a silhouette with a top on it. */
  const geometry = useMemo(() => new ConeGeometry(0.7, 1.4, 4, 1), []);
  const material = useMemo(
    () =>
      splitMaterial(
        new MeshLambertMaterial({ flatShading: true }),
        hours.dusk.ground.scrub,
        hours.dawn.ground.scrub,
      ),
    [],
  );

  return (
    <>
      {scrub.map((bush) => (
        <mesh
          key={bush.id}
          geometry={geometry}
          material={material}
          position={[
            bush.position[0],
            groundLevel(bush.position[0], bush.position[2]) + bush.scale * 0.6,
            bush.position[2],
          ]}
          rotation={[0, bush.spin, 0]}
          scale={[
            bush.scale * bush.squash[0],
            bush.scale * bush.squash[1],
            bush.scale * bush.squash[2],
          ]}
        />
      ))}
    </>
  );
}

export function Territory() {
  return (
    <>
      <Floor />
      <Trail />
      <Ranges />
      <Mesas />
      <Rocks />
      <Scrub />
    </>
  );
}
