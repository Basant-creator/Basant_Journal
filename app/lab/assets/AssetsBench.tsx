"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

const ContactSheet = dynamic(
  () => import("@/components/three/AssetContactSheet").then((m) => m.AssetContactSheet),
  { ssr: false },
);

interface Entry {
  index: number;
  name: string;
  w: number;
  h: number;
  d: number;
  tris: number;
}

/*
  What shipped, not what arrived.

  The supplied packs live in `assets/camp-source/`, which is outside `public/`
  and therefore outside the deployment — §31 asks that source packs not be
  dumped into the served directory, and 5.1MB of western town that nobody
  renders is exactly what that rule is for. To inspect a raw pack again, copy
  it into `public/frontier/camp/` and add a line here.

  What this points at instead is the baked file: the eleven props that were
  actually chosen, at the scale and orientation the scene uses them.
*/
const PACKS = [
  { id: "baked", label: "camp props (baked)", src: "/frontier/camp/models/camp-props.glb" },
];



/**
 * Look at every piece before deciding anything.
 *
 * A lab bench, not a route: it exists so an asset pack can be identified
 * object by object rather than guessed at from a table of triangle counts.
 * `Object_29` is 17,248 triangles and 5.3m wide and that tells you nothing
 * about whether it belongs in a surveyor's camp.
 */
export function AssetsBench() {
  const [pack, setPack] = useState(0);
  const [close, setClose] = useState(false);
  const COLUMNS = close ? 3 : 6;
  const PAGE = close ? 6 : 24;
  const [page, setPage] = useState(0);
  const [entries, setEntries] = useState<Entry[]>([]);

  const onEntries = useCallback((next: Entry[]) => setEntries(next), []);

  const shown = entries.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(entries.length / PAGE));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {PACKS.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setPack(i);
              setPage(0);
              setEntries([]);
            }}
            data-on={i === pack || undefined}
          >
            {p.label}
          </button>
        ))}
        <span>
          {entries.length} objects · page {page + 1} / {pages}
        </span>
        <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))}>
          prev
        </button>
        <button type="button" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>
          next
        </button>
        <button type="button" onClick={() => { setClose((c) => !c); setPage(0); }}>
          {close ? "overview" : "close up"}
        </button>
      </div>

      <div style={{ height: 620, border: "1px solid var(--color-border-subtle)" }}>
        <ContactSheet
          src={PACKS[pack].src}
          columns={COLUMNS}
          page={page}
          pageSize={PAGE}
          onEntries={onEntries}
        />
      </div>

      {/* The grid reads left to right, top to bottom; this is the key to it. */}
      <ol
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))`,
          gap: 6,
          listStyle: "none",
          margin: 0,
          padding: 0,
          fontFamily: "var(--font-ui)",
          fontSize: 10,
          lineHeight: 1.35,
        }}
      >
        {shown.map((e, i) => (
          <li key={e.index} style={{ opacity: 0.85 }}>
            <strong>{page * PAGE + i + 1}.</strong> {e.name}
            <br />
            {e.w}×{e.h}×{e.d}m · {e.tris.toLocaleString("en-GB")}t
          </li>
        ))}
      </ol>
    </div>
  );
}
