"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  Box3,
  Group,
  Mesh,
  type Object3D,
  Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * A contact sheet for an asset pack. Development tool, lab route only.
 *
 * Supplied packs arrive with names like `Object_29` or with no names at all,
 * and a table of triangle counts cannot tell you whether something is a barrel
 * or a bucket. The only way to decide what belongs in the Camp is to look at
 * every piece — so this lays them out in a grid, each normalised to its own
 * cell, with its index and name beside it.
 *
 * It is deliberately plain: white light, no fog, no atmosphere. The question
 * here is "what is this object", not "how does it look at blue hour".
 */

interface Entry {
  index: number;
  name: string;
  node: Object3D;
  size: Vector3;
  tris: number;
}

/**
 * Every distinct object in the pack, however the exporter buried it.
 *
 * Two shapes have to be handled, and both were found in the supplied packs.
 *
 * The fort pack wraps its entire contents in a chain of single-child nodes —
 * scene, model, root, sceneRoot — so reading `scene.children` gives exactly
 * one object, which is the whole pack. Walk down while there is nothing to
 * choose between.
 *
 * The town kit does the opposite: it splits each prop into flat siblings named
 * `048-whiskey-barrel/0`, `048-whiskey-barrel/1`, so reading its children
 * gives 143 fragments rather than 64 props. Where most names carry that
 * suffix, group by the part before the slash.
 */
function collect(root: Object3D): Entry[] {
  let base = root;
  while (base.children.length === 1 && !(base as Mesh).isMesh) base = base.children[0];

  const children = base.children.filter((child) => {
    let hasMesh = false;
    child.traverse((node) => {
      if ((node as Mesh).isMesh) hasMesh = true;
    });
    return hasMesh;
  });

  const suffixed = children.filter((c) => /\/[^/]+$/.test(c.name)).length;
  let groups: { name: string; nodes: Object3D[] }[];

  if (suffixed > children.length * 0.5) {
    const byPrefix = new Map<string, Object3D[]>();
    for (const child of children) {
      const prefix = child.name.replace(/\/[^/]+$/, "");
      const list = byPrefix.get(prefix);
      if (list) list.push(child);
      else byPrefix.set(prefix, [child]);
    }
    groups = [...byPrefix.entries()].map(([name, nodes]) => ({ name, nodes }));
  } else {
    groups = children.map((child) => ({ name: child.name || "unnamed", nodes: [child] }));
  }

  return groups.map((group, index) => {
    /* A synthetic parent, so a prop split into seven siblings measures and
       frames as the one thing it actually is. */
    const holder = new Group();
    for (const node of group.nodes) holder.add(node.clone(true));

    const box = new Box3().setFromObject(holder);
    const size = new Vector3();
    box.getSize(size);

    let tris = 0;
    holder.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh) return;
      const g = mesh.geometry;
      tris += g.index ? g.index.count / 3 : (g.attributes.position?.count ?? 0) / 3;
    });

    return { index, name: group.name, node: holder, size, tris: Math.round(tris) };
  });
}

function Sheet({
  src,
  columns,
  page,
  pageSize,
  onEntries,
}: {
  src: string;
  columns: number;
  page: number;
  pageSize: number;
  onEntries: (entries: { index: number; name: string; w: number; h: number; d: number; tris: number }[]) => void;
}) {
  const { camera } = useThree();
  const [root, setRoot] = useState<Object3D | null>(null);

  useEffect(() => {
    let live = true;
    const loader = new GLTFLoader();
    loader.load(src, (gltf) => {
      if (live) setRoot(gltf.scene);
    });
    return () => {
      live = false;
    };
  }, [src]);

  const entries = useMemo(() => (root ? collect(root) : []), [root]);

  useEffect(() => {
    onEntries(
      entries.map((e) => ({
        index: e.index,
        name: e.name,
        w: +e.size.x.toFixed(2),
        h: +e.size.y.toFixed(2),
        d: +e.size.z.toFixed(2),
        tris: e.tris,
      })),
    );
  }, [entries, onEntries]);

  /* One cell per object: cloned, centred, and scaled so its longest side is 1.
     Cloning matters — the same node cannot sit in two places, and paging
     re-parents them. */
  const grid = useMemo(() => {
    const slice = entries.slice(page * pageSize, page * pageSize + pageSize);
    const holder = new Group();

    slice.forEach((entry, i) => {
      const cell = new Group();
      const clone = entry.node.clone(true);

      const box = new Box3().setFromObject(clone);
      const centre = new Vector3();
      const size = new Vector3();
      box.getCenter(centre);
      box.getSize(size);
      const longest = Math.max(size.x, size.y, size.z) || 1;
      const scale = 0.82 / longest;

      clone.position.sub(centre);
      const inner = new Group();
      inner.add(clone);
      inner.scale.setScalar(scale);
      cell.add(inner);

      const col = i % columns;
      const row = Math.floor(i / columns);
      cell.position.set(col - (columns - 1) / 2, -(row - 1.5), 0);
      /* A slight turn so a flat panel is not edge-on and invisible. */
      cell.rotation.y = 0.62;
      cell.rotation.x = 0.22;

      holder.add(cell);
    });

    return holder;
  }, [entries, page, pageSize, columns]);

  useEffect(() => {
    const rows = Math.ceil(Math.min(pageSize, Math.max(entries.length - page * pageSize, 0)) / columns);
    camera.position.set(0, -(rows - 1) / 2 + 1.5, Math.max(columns, rows) * 1.5 + 2);
    camera.lookAt(0, -(rows - 1) / 2 + 1.5, 0);
  }, [camera, columns, entries.length, page, pageSize]);

  return <primitive object={grid} />;
}

export function AssetContactSheet({
  src,
  columns = 6,
  page = 0,
  pageSize = 24,
  onEntries,
}: {
  src: string;
  columns?: number;
  page?: number;
  pageSize?: number;
  onEntries: (entries: { index: number; name: string; w: number; h: number; d: number; tris: number }[]) => void;
}) {
  return (
    <Canvas camera={{ position: [0, 0, 12], fov: 40, near: 0.01, far: 200 }} gl={{ antialias: true }}>
      <color attach="background" args={["#191512"]} />
      <hemisphereLight args={["#ffffff", "#404040", 2.2]} />
      <directionalLight position={[4, 6, 8]} intensity={2.4} />
      <directionalLight position={[-6, 2, -4]} intensity={1.1} />
      <Suspense fallback={null}>
        <Sheet src={src} columns={columns} page={page} pageSize={pageSize} onEntries={onEntries} />
      </Suspense>
    </Canvas>
  );
}
