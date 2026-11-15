import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { person } from "@/lib/content/portfolio";

export const alt = `${person.name} — ${person.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* The cards' inks, written out (--titles-blood, --titles-cream): a share
   card is drawn outside the stylesheet. */
const BLOOD = "#b3261e";
const CREAM = "#f2e3c2";

/**
 * The share card is the opening card: the name in cream over the blood
 * field, the rider printed black beside it. The rider is the small bake
 * (components/cards/art/rider-og.png, scripts/titles-silhouette.py).
 */
export default async function OpengraphImage() {
  const rider = await readFile(join(process.cwd(), "components/cards/art/rider-og.png"));
  const src = `data:image/png;base64,${rider.toString("base64")}`;
  const [first, ...rest] = person.name.split(" ");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: BLOOD, color: CREAM }}>
        <img src={src} alt="" width={420} height={746} style={{ position: "absolute", right: 70, top: -60 }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 72px 72px", width: "100%" }}>
          <div style={{ fontSize: 22, letterSpacing: 6, textTransform: "uppercase", marginBottom: 18 }}>
            {`${person.location} · ${person.role}`}
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 150, fontWeight: 900, lineHeight: 0.9, textTransform: "uppercase" }}>
            <span>{first}</span>
            <span>{rest.join(" ")}</span>
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.35, marginTop: 24, maxWidth: 640, fontStyle: "italic" }}>{person.tagline}</div>
        </div>
      </div>
    ),
    size,
  );
}
