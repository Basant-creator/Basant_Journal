/**
 * Bake the supplied horse down to the clips the landing actually plays.
 *
 * The asset arrives with 26 animations. Thirteen of them are duplicates — the
 * FBX2glTF converter emits every clip twice, once bare and once prefixed
 * `AnimalArmature|` — and of the thirteen real ones the landing plays two. The
 * other twenty-four are a headbutt, a kick, a death, two hit reactions and
 * several idles, all of them animation data sitting in the binary chunk of a
 * file that loads before the visitor has reached anything.
 *
 * That matters because of one rule: **the landing must be lighter than the
 * Camp.** It loads first, and the Camp's whole prop set is 665 kB. A 1.08 MB
 * horse on the landing page inverts the budget the rest of the site was built
 * to respect.
 *
 * So this keeps the mesh, the skin and the skeleton exactly as supplied —
 * nothing is re-rigged, nothing is re-weighted — and drops every animation the
 * scene does not play, then rebuilds the buffer with only the accessors that
 * survive. Geometry is untouched; what goes is keyframes nobody will see.
 *
 *   node scripts/bake-horse.mjs
 */

import fs from "node:fs";

const SOURCE = "assets/horse-source/horse.glb";
const OUT = "public/frontier/landing/horse.glb";

/**
 * What the landing plays.
 *
 * `Gallop` is the herd crossing. `Idle` is what a stopped horse does, and it
 * is what reduced motion parks on — a frozen gallop is a horse suspended
 * mid-air, which is a stranger thing to show someone who asked for less
 * movement than a horse simply standing there.
 *
 * The bare names are taken and the `AnimalArmature|` twins dropped: they are
 * the same curves under a different label.
 */
const KEEP = ["Gallop", "Idle"];

const json0 = (() => {
  const buf = fs.readFileSync(SOURCE);
  const total = buf.readUInt32LE(8);
  let off = 12;
  let json = null;
  let bin = null;
  while (off < total) {
    const len = buf.readUInt32LE(off);
    const type = buf.readUInt32LE(off + 4);
    const body = buf.subarray(off + 8, off + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(body.toString("utf8"));
    if (type === 0x004e4942) bin = Buffer.from(body);
    off += 8 + len;
  }
  return { json, bin };
})();

const { json, bin } = json0;
if (!json || !bin) throw new Error("source is not a two-chunk GLB");

const before = {
  bytes: fs.statSync(SOURCE).size,
  animations: json.animations.length,
  accessors: json.accessors.length,
};

/* --- keep only the named clips ------------------------------------------- */

const kept = json.animations.filter((a) => KEEP.includes(a.name));
const missing = KEEP.filter((n) => !kept.some((a) => a.name === n));
if (missing.length) throw new Error(`clip not in source: ${missing.join(", ")}`);
json.animations = kept;

/* --- find every accessor still referenced --------------------------------- */

/*
  Anything not reached from here is keyframe data for a clip that is gone.
  Meshes, the skin's inverse bind matrices and the surviving samplers are the
  only roots — miss one and the file loads with a hole in it, so they are
  gathered explicitly rather than by walking the whole document.
*/
const live = new Set();

for (const mesh of json.meshes ?? []) {
  for (const prim of mesh.primitives ?? []) {
    for (const accessor of Object.values(prim.attributes ?? {})) live.add(accessor);
    if (prim.indices !== undefined) live.add(prim.indices);
    for (const target of prim.targets ?? []) {
      for (const accessor of Object.values(target)) live.add(accessor);
    }
  }
}

for (const skin of json.skins ?? []) {
  if (skin.inverseBindMatrices !== undefined) live.add(skin.inverseBindMatrices);
}

for (const anim of json.animations) {
  for (const sampler of anim.samplers) {
    live.add(sampler.input);
    live.add(sampler.output);
  }
}

/* --- rebuild the buffer with only what survived --------------------------- */

const order = [...live].sort((a, b) => a - b);
const remap = new Map();
const chunks = [];
let cursor = 0;

const COMPONENT_BYTES = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

const accessors = [];
const bufferViews = [];

for (const index of order) {
  const accessor = json.accessors[index];
  const view = json.bufferViews[accessor.bufferView];

  const stride =
    COMPONENT_BYTES[accessor.componentType] * COMPONENTS[accessor.type];
  /* An interleaved view is copied at its own stride so the data stays valid;
     a tightly packed one is copied at its natural size. */
  const byteStride = view.byteStride ?? stride;
  const length = byteStride * (accessor.count - 1) + stride;

  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const slice = bin.subarray(start, start + length);

  /* Four-byte alignment, which the spec requires of every bufferView. */
  const pad = (4 - (cursor % 4)) % 4;
  if (pad) {
    chunks.push(Buffer.alloc(pad));
    cursor += pad;
  }

  const viewIndex = bufferViews.length;
  bufferViews.push({
    buffer: 0,
    byteOffset: cursor,
    byteLength: slice.length,
    ...(view.byteStride ? { byteStride: view.byteStride } : {}),
    ...(view.target ? { target: view.target } : {}),
  });

  chunks.push(Buffer.from(slice));
  cursor += slice.length;

  remap.set(index, accessors.length);
  accessors.push({
    ...accessor,
    bufferView: viewIndex,
    byteOffset: 0,
  });
}

json.accessors = accessors;
json.bufferViews = bufferViews;

/* Point every reference at its new index. */
const point = (n) => {
  if (n === undefined) return undefined;
  const to = remap.get(n);
  if (to === undefined) throw new Error(`accessor ${n} was pruned but is still referenced`);
  return to;
};

for (const mesh of json.meshes ?? []) {
  for (const prim of mesh.primitives ?? []) {
    for (const [key, value] of Object.entries(prim.attributes ?? {})) {
      prim.attributes[key] = point(value);
    }
    if (prim.indices !== undefined) prim.indices = point(prim.indices);
    for (const target of prim.targets ?? []) {
      for (const [key, value] of Object.entries(target)) target[key] = point(value);
    }
  }
}

for (const skin of json.skins ?? []) {
  if (skin.inverseBindMatrices !== undefined) {
    skin.inverseBindMatrices = point(skin.inverseBindMatrices);
  }
}

for (const anim of json.animations) {
  for (const sampler of anim.samplers) {
    sampler.input = point(sampler.input);
    sampler.output = point(sampler.output);
  }
}

const binOut = Buffer.concat(chunks);
json.buffers = [{ byteLength: binOut.length }];
json.asset = {
  ...json.asset,
  generator: `${json.asset.generator} + scripts/bake-horse.mjs`,
};

/* --- write ---------------------------------------------------------------- */

function writeGlb(doc, binary, file) {
  let jsonText = Buffer.from(JSON.stringify(doc), "utf8");
  const jsonPad = (4 - (jsonText.length % 4)) % 4;
  if (jsonPad) jsonText = Buffer.concat([jsonText, Buffer.alloc(jsonPad, 0x20)]);

  const binPad = (4 - (binary.length % 4)) % 4;
  const binPadded = binPad
    ? Buffer.concat([binary, Buffer.alloc(binPad)])
    : binary;

  const total = 12 + 8 + jsonText.length + 8 + binPadded.length;
  const out = Buffer.alloc(total);
  let o = 0;
  out.writeUInt32LE(0x46546c67, o); o += 4;
  out.writeUInt32LE(2, o); o += 4;
  out.writeUInt32LE(total, o); o += 4;
  out.writeUInt32LE(jsonText.length, o); o += 4;
  out.writeUInt32LE(0x4e4f534a, o); o += 4;
  jsonText.copy(out, o); o += jsonText.length;
  out.writeUInt32LE(binPadded.length, o); o += 4;
  out.writeUInt32LE(0x004e4942, o); o += 4;
  binPadded.copy(out, o);

  fs.mkdirSync(file.replace(/\/[^/]+$/, ""), { recursive: true });
  fs.writeFileSync(file, out);
}

writeGlb(json, binOut, OUT);

const after = fs.statSync(OUT).size;
const pct = Math.round((1 - after / before.bytes) * 100);
console.log(
  [
    `horse baked -> ${OUT}`,
    `  clips      ${before.animations} -> ${json.animations.length}  (${KEEP.join(", ")})`,
    `  accessors  ${before.accessors} -> ${json.accessors.length}`,
    `  bytes      ${before.bytes.toLocaleString()} -> ${after.toLocaleString()}  (-${pct}%)`,
  ].join("\n"),
);
