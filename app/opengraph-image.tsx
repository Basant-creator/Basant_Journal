import { ImageResponse } from "next/og";
import { person } from "@/lib/content/portfolio";

export const alt = `${person.name} — The Frontier`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Share card. Drawn with the same tokens as the site so a link preview reads
 * as the same publication — ink ground, warm type, one red rule.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 88px",
          background: "#1B1713",
          color: "#F2E9D7",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#A49476",
            marginBottom: 28,
          }}
        >
          Volume I · A survey
        </div>

        <div
          style={{
            fontSize: 116,
            letterSpacing: 6,
            textTransform: "uppercase",
            lineHeight: 1,
            color: "#F2E9D7",
          }}
        >
          The Frontier
        </div>

        <div
          style={{
            width: 168,
            height: 3,
            background: "#7A2E2E",
            margin: "40px 0 34px",
          }}
        />

        <div
          style={{
            fontSize: 38,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "#E7D9BC",
          }}
        >
          {person.name}
        </div>

        <div
          style={{
            fontSize: 28,
            lineHeight: 1.45,
            color: "#C6B99F",
            marginTop: 22,
            maxWidth: 840,
          }}
        >
          {person.role}
        </div>
      </div>
    ),
    size,
  );
}
