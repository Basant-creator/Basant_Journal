/**
 * Bake selected props out of the supplied packs into one small GLB.
 *
 * The packs are source material, not a deliverable. Between them they hold 80
 * objects, most of which build a western town or a military fort and belong
 * nowhere near a surveyor's camp; what is worth having is a dozen shapes the
 * Camp never had — supplies, storage, tools, a fire ring.
 *
 * What comes out of here is **geometry only**. The Camp already owns a
 * material system built over twenty steps — procedural timber, leather,
 * canvas, paper, all drawn to one blue-hour palette — and the packs arrive
 * flat-shaded in colours from two unrelated artists. Shipping their materials
 * would be shipping the §13 problem: one object reading as a mobile asset pack
 * beside eight that read as the same world. So the surfaces stay behind and
 * only the forms come through.
 *
 * Each prop is baked with its world transform applied, recentred on its own
 * footprint and dropped so its lowest point sits at y=0. That makes placement
 * in the scene a position and a turn, and it is what §22 and §23 ask for:
 * nothing floats, nothing sinks, and grounding is not a per-object fudge.
 *
 *   node scripts/bake-camp-props.mjs
 */

import fs from "node:fs";
import path from "node:path";

const SOURCE = "assets/camp-source";
const OUT = "public/frontier/camp/models/camp-props.glb";

/**
 * What is taken, and from where.
 *
 * `as` is the id the scene knows it by. Everything not listed is rejected —
 * the decisions and the reasons are in docs/camp-assets.md.
 */
const TAKE = [
  // --- the fort pack: the shapes a working camp has ---
  { pack: "fort", node: "campfire_3", as: "fireRing" },
  { pack: "fort", node: "barrel_1", as: "barrel" },
  { pack: "fort", node: "bucket_2", as: "bucket" },
  { pack: "fort", node: "crate_5", as: "crate" },
  { pack: "fort", node: "axe_0", as: "axe" },
  { pack: "fort", node: "tent_14", as: "leanTent" },

  // --- the town kit: cheaper, quantised, and better for repeats ---
  { pack: "town", node: "050-supply-crate", as: "supplyCrate" },
  { pack: "town", node: "048-whiskey-barrel", as: "caskSmall" },
  { pack: "town", node: "051-grain-sack-stack", as: "sacks" },
  { pack: "town", node: "053-wagon-wheel", as: "wagonWheel" },
  { pack: "town", node: "054-hay-bale", as: "bale" },
];

/* ---------------------------------------------------------------- reading */

function load(file) {
  const buf = fs.readFileSync(file);
  if (buf.slice(0, 4).toString("ascii") === "glTF") {
    const total = buf.readUInt32LE(8);
    let off = 12;
    let json = null;
    let bin = null;
    while (off < total) {
      const len = buf.readUInt32LE(off);
      const type = buf.slice(off + 4, off + 8).toString("ascii");
      if (type.startsWith("JSON")) json = JSON.parse(buf.slice(off + 8, off + 8 + len).toString("utf8"));
      if (type.startsWith("BIN")) bin = buf.slice(off + 8, off + 8 + len);
      off += 8 + len + ((4 - (len % 4)) % 4);
    }
    return { json, bin };
  }
  const json = JSON.parse(buf.toString("utf8"));
  const bin = fs.readFileSync(path.join(path.dirname(file), json.buffers[0].uri));
  return { json, bin };
}

const COMPONENT = {
  5120: { array: Int8Array, size: 1, norm: 127 },
  5121: { array: Uint8Array, size: 1, norm: 255 },
  5122: { array: Int16Array, size: 2, norm: 32767 },
  5123: { array: Uint16Array, size: 2, norm: 65535 },
  5125: { array: Uint32Array, size: 4, norm: 4294967295 },
  5126: { array: Float32Array, size: 4, norm: 1 },
};
const COUNT = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

/**
 * One accessor, as plain floats.
 *
 * The town kit uses KHR_mesh_quantization, so positions arrive as normalised
 * shorts with the node scale making up the difference. Reading them as raw
 * integers is how you get a prop thirty thousand metres wide.
 */
function read(json, bin, index) {
  const acc = json.accessors[index];
  const view = json.bufferViews[acc.bufferView];
  const comp = COMPONENT[acc.componentType];
  const items = COUNT[acc.type];
  const base = (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const stride = view.byteStride ?? comp.size * items;

  const out = new Float32Array(acc.count * items);
  for (let i = 0; i < acc.count; i++) {
    const at = base + i * stride;
    for (let k = 0; k < items; k++) {
      const raw = new comp.array(bin.buffer, bin.byteOffset + at + k * comp.size, 1)[0];
      out[i * items + k] = acc.normalized ? Math.max(raw / comp.norm, -1) : raw;
    }
  }
  return out;
}

/* -------------------------------------------------------------- transform */

const ident = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
function mul(a, b) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
function local(n) {
  if (n.matrix) return n.matrix;
  const t = n.translation ?? [0, 0, 0];
  const [x, y, z, w] = n.rotation ?? [0, 0, 0, 1];
  const s = n.scale ?? [1, 1, 1];
  return [
    (1 - 2 * (y * y + z * z)) * s[0], 2 * (x * y + z * w) * s[0], 2 * (x * z - y * w) * s[0], 0,
    2 * (x * y - z * w) * s[1], (1 - 2 * (x * x + z * z)) * s[1], 2 * (y * z + x * w) * s[1], 0,
    2 * (x * z + y * w) * s[2], 2 * (y * z - x * w) * s[2], (1 - 2 * (x * x + y * y)) * s[2], 0,
    t[0], t[1], t[2], 1,
  ];
}
const point = (m, p) => [
  m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
  m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
  m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
];
/* Normals need the inverse transpose; every transform in these packs is a
   similarity (uniform scale and rotation), so the rotation part normalised is
   exact and a full inverse would be ceremony. */
const direction = (m, v) => {
  const sx = Math.hypot(m[0], m[1], m[2]) || 1;
  const sy = Math.hypot(m[4], m[5], m[6]) || 1;
  const sz = Math.hypot(m[8], m[9], m[10]) || 1;
  const o = [
    (m[0] / sx) * v[0] + (m[4] / sy) * v[1] + (m[8] / sz) * v[2],
    (m[1] / sx) * v[0] + (m[5] / sy) * v[1] + (m[9] / sz) * v[2],
    (m[2] / sx) * v[0] + (m[6] / sy) * v[1] + (m[10] / sz) * v[2],
  ];
  const l = Math.hypot(...o) || 1;
  return [o[0] / l, o[1] / l, o[2] / l];
};

/* ---------------------------------------------------------------- baking */

function gather(json, bin, match) {
  const positions = [];
  const normals = [];
  const indices = [];

  /*
    The name is on the group, not on the mesh.

    Both packs put the thing you can name one level above the geometry. The
    fort pack is a Sketchfab export — Sketchfab_model / root /
    GLTF_SceneRootNode / `campfire_3` / `Object_16` — so matching on the node
    that carries a mesh matches `Object_16` and finds nothing. Once an ancestor
    matches, everything below it belongs to that prop.
  */
  function walk(index, parent, inside) {
    const node = json.nodes[index];
    const world = mul(parent, local(node));
    const here = inside || match(node.name ?? "");

    if (node.mesh !== undefined && here) {
      for (const prim of json.meshes[node.mesh].primitives) {
        if ((prim.mode ?? 4) !== 4) continue;
        const pos = read(json, bin, prim.attributes.POSITION);
        const nor = prim.attributes.NORMAL !== undefined ? read(json, bin, prim.attributes.NORMAL) : null;
        const idx = prim.indices !== undefined ? read(json, bin, prim.indices) : null;
        const first = positions.length / 3;

        for (let i = 0; i < pos.length / 3; i++) {
          const p = point(world, [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]);
          positions.push(p[0], p[1], p[2]);
          if (nor) {
            const n = direction(world, [nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]]);
            normals.push(n[0], n[1], n[2]);
          } else {
            normals.push(0, 1, 0);
          }
        }

        if (idx) for (let i = 0; i < idx.length; i++) indices.push(first + idx[i]);
        else for (let i = 0; i < pos.length / 3; i++) indices.push(first + i);
      }
    }

    for (const child of node.children ?? []) walk(child, world, here);
  }

  for (const root of json.scenes[json.scene ?? 0].nodes) walk(root, ident(), false);
  return { positions, normals, indices };
}

/** Recentre on the footprint, drop to the floor, and report the size. */
function ground(positions) {
  let mn = [Infinity, Infinity, Infinity];
  let mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      mn[k] = Math.min(mn[k], positions[i + k]);
      mx[k] = Math.max(mx[k], positions[i + k]);
    }
  }
  const shift = [-(mn[0] + mx[0]) / 2, -mn[1], -(mn[2] + mx[2]) / 2];
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] += shift[0];
    positions[i + 1] += shift[1];
    positions[i + 2] += shift[2];
  }
  return { size: mx.map((v, i) => +(v - mn[i]).toFixed(3)) };
}

/* ---------------------------------------------------------------- writing */

function align(n) {
  return n + ((4 - (n % 4)) % 4);
}

function writeGlb(props, file) {
  const json = {
    asset: {
      version: "2.0",
      generator: "the-frontier bake-camp-props",
      copyright: "geometry extracted from supplied packs; see docs/camp-assets.md",
    },
    scene: 0,
    scenes: [{ nodes: props.map((_, i) => i) }],
    nodes: props.map((p, i) => ({ name: p.id, mesh: i })),
    meshes: props.map((p, i) => ({
      name: p.id,
      primitives: [{ attributes: { POSITION: i * 3, NORMAL: i * 3 + 1 }, indices: i * 3 + 2 }],
    })),
    accessors: [],
    bufferViews: [],
    buffers: [],
  };

  const blobs = [];
  let offset = 0;

  const push = (typed, target) => {
    const bytes = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
    const padded = align(bytes.length);
    const out = Buffer.alloc(padded);
    bytes.copy(out);
    blobs.push(out);
    json.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, target });
    offset += padded;
    return json.bufferViews.length - 1;
  };

  for (const p of props) {
    const pos = new Float32Array(p.positions);
    const nor = new Float32Array(p.normals);
    const idx = pos.length / 3 > 65535 ? new Uint32Array(p.indices) : new Uint16Array(p.indices);

    let mn = [Infinity, Infinity, Infinity];
    let mx = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) {
      mn[k] = Math.min(mn[k], pos[i + k]);
      mx[k] = Math.max(mx[k], pos[i + k]);
    }

    json.accessors.push({ bufferView: push(pos, 34962), componentType: 5126, count: pos.length / 3, type: "VEC3", min: mn, max: mx });
    json.accessors.push({ bufferView: push(nor, 34962), componentType: 5126, count: nor.length / 3, type: "VEC3" });
    json.accessors.push({ bufferView: push(idx, 34963), componentType: idx instanceof Uint32Array ? 5125 : 5123, count: idx.length, type: "SCALAR" });
  }

  const bin = Buffer.concat(blobs);
  json.buffers.push({ byteLength: bin.length });

  const jsonBuf = Buffer.from(JSON.stringify(json), "utf8");
  const jsonPad = Buffer.alloc(align(jsonBuf.length) - jsonBuf.length, 0x20);
  const jsonChunk = Buffer.concat([jsonBuf, jsonPad]);

  const header = Buffer.alloc(12);
  header.write("glTF", 0, "ascii");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + bin.length, 8);

  const jsonHead = Buffer.alloc(8);
  jsonHead.writeUInt32LE(jsonChunk.length, 0);
  jsonHead.write("JSON", 4, "ascii");

  const binHead = Buffer.alloc(8);
  binHead.writeUInt32LE(bin.length, 0);
  binHead.write("BIN\0", 4, "ascii");

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([header, jsonHead, jsonChunk, binHead, bin]));
}

/* ------------------------------------------------------------------- run */

const packs = {
  fort: load(path.join(SOURCE, "fort.gltf")),
  town: load(path.join(SOURCE, "town-kit.glb")),
};

const props = [];
for (const want of TAKE) {
  const { json, bin } = packs[want.pack];
  /* The town kit splits a prop across siblings named `name/0`, `name/1`. */
  const match = (name) => name === want.node || name.startsWith(want.node + "/");
  const { positions, normals, indices } = gather(json, bin, match);
  if (!positions.length) throw new Error(`nothing matched ${want.node} in ${want.pack}`);
  const { size } = ground(positions);
  props.push({ id: want.as, positions, normals, indices, size, tris: indices.length / 3, from: `${want.pack}:${want.node}` });
}

writeGlb(props, OUT);

const bytes = fs.statSync(OUT).size;
console.log("baked", props.length, "props ->", OUT, `(${(bytes / 1024).toFixed(0)} kB)`);
console.log();
console.log("id".padEnd(14) + "tris".padStart(7) + "   size (m)".padEnd(26) + "from");
for (const p of props) {
  console.log(
    p.id.padEnd(14) +
      String(p.tris).padStart(7) +
      "   " + p.size.join(" x ").padEnd(23) +
      p.from,
  );
}
console.log("\ntotal triangles:", props.reduce((s, p) => s + p.tris, 0).toLocaleString("en-GB"));
