"use client";

import { useEffect } from "react";

/**
 * When the root layout itself fails.
 *
 * This replaces the entire document, which is why it renders its own `<html>`
 * and `<body>` — and why every style here is inline.
 *
 * That is not laziness. `globals.css` and `design/tokens.css` are imported *by*
 * the root layout, so if the layout threw, there is no guarantee any of it
 * applied: no `--color-ink`, no `--font-display`, possibly no stylesheet at
 * all. A page that styles its own catastrophe with variables defined by the
 * thing that just broke is a page that renders as unstyled black-on-white
 * exactly when it most needs to look deliberate. The few colours below are the
 * token values written out, and that duplication is the point.
 *
 * The way out is a plain anchor rather than a router link, for the same
 * reason. Client-side navigation is the machinery that just failed; a real
 * navigation reloads the document and gives the application a clean start.
 *
 * Deliberately sparse. Everything this page does has to work with the rest of
 * the site assumed broken.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: "1rem",
          padding: "clamp(24px, 6vw, 72px)",
          background: "#1B1713",
          color: "#E7D9BC",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#A49476",
          }}
        >
          Survey suspended
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(1.9rem, 6vw, 3.4rem)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontWeight: 400,
          }}
        >
          The survey could not be opened
        </h1>

        <p
          style={{
            margin: 0,
            maxWidth: "34rem",
            fontSize: "1.05rem",
            lineHeight: 1.6,
            color: "#C6B99F",
          }}
        >
          Something failed before the site could be drawn at all. Nothing is
          lost — the record is still there, and loading the page again is
          usually enough to reach it.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.7rem 1.3rem",
              font: "inherit",
              fontSize: "0.8rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#1B1713",
              background: "#E7D9BC",
              border: "1px solid #E7D9BC",
              borderRadius: "2px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>

          <a
            href="/"
            style={{
              padding: "0.7rem 1.3rem",
              fontSize: "0.8rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#E7D9BC",
              border: "1px solid rgba(231, 217, 188, 0.4)",
              borderRadius: "2px",
              textDecoration: "none",
            }}
          >
            Reload the beginning
          </a>
        </div>
      </body>
    </html>
  );
}
