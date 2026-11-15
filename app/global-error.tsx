"use client";

import { useEffect } from "react";

/* The cards' inks, written out (--titles-blood, --titles-cream): the
   stylesheet that defines them is loaded by the layout that just failed. */
const BLOOD = "#b3261e";
const CREAM = "#f2e3c2";

/**
 * When the root layout itself fails.
 *
 * This replaces the entire document, which is why it renders its own <html>
 * and <body>, and why every style is inline: globals.css and the fonts come
 * from the root layout, so if it threw, none of them can be relied on. The
 * way out is a plain anchor rather than a router link, because client-side
 * navigation is the machinery that just failed; a real navigation reloads
 * the document and starts clean.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  const control = {
    padding: "0.8rem 1.3rem",
    font: "inherit",
    fontSize: "0.8rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    color: CREAM,
    background: "none",
    border: `2px solid ${CREAM}`,
    textDecoration: "none",
    cursor: "pointer",
  };

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: "1rem",
          padding: "clamp(24px, 6vw, 80px)",
          background: BLOOD,
          color: CREAM,
          fontFamily: "Impact, 'Arial Narrow', sans-serif",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.3em", textTransform: "uppercase" }}>Error</p>
        <h1 style={{ margin: 0, fontWeight: 400, fontSize: "clamp(3rem, 11vw, 9rem)", lineHeight: 0.9, textTransform: "uppercase" }}>
          The reel snapped
        </h1>
        <p style={{ margin: 0, maxWidth: "36rem", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "1.15rem", lineHeight: 1.5 }}>
          Something failed before the page could be drawn at all. Loading it again is usually enough.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
          <button type="button" onClick={reset} style={control}>
            Try again
          </button>
          <a href="/" style={control}>
            Start again
          </a>
        </div>
      </body>
    </html>
  );
}
