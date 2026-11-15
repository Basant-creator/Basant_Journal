"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PLATES } from "./art";
import styles from "./page.module.css";

/* Where each chapter starts along the ride, as a share of the whole, until
   the page has been measured. */
const SPACED = [0.12, 0.37, 0.62, 0.9];

/**
 * The bar across the top, and the trail at the foot.
 *
 * The bar is clear over the opening; once the opening has gone by it takes
 * a ground, names the chapter being read and the part of it (the way a
 * book's running head does), and draws a hairline for how far down the
 * page you are. It carries the résumé and nothing else: the way through
 * the page is the trail.
 *
 * The trail is the chapters as waypoints along a line at the foot of the
 * screen, each where its chapter starts, a rider on it for how far you have
 * come (moved by the scroll itself, a CSS scroll timeline), and the one
 * being read lit. It is the nav: the waypoints are its links.
 *
 * Beside them, the sheet's margin (fixed, outside the bar: the bar's
 * backdrop blur would otherwise become its containing block), and, once the
 * opening is behind you, a way back to the top.
 *
 * The chapter is whichever one crosses the upper third of the screen; the
 * part is the last of that chapter's rules to have gone above that line.
 * Both come from observers, nothing is measured on scroll. The page scrolls
 * inside its own container, so that is the observers' root.
 */
export function Masthead({ resume, name, place }: { resume: string | null; name: string; place: string }) {
  const bar = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [section, setSection] = useState<{ chapter: string; label: string } | null>(null);
  const [solid, setSolid] = useState(false);
  const [at, setAt] = useState<Record<string, number>>({});

  useEffect(() => {
    const root = bar.current?.closest<HTMLElement>("[data-world]") ?? null;
    if (!root) return;

    const opening = root.querySelector("[data-opening]");
    const past = new IntersectionObserver(([entry]) => setSolid(!entry.isIntersecting), {
      root,
      rootMargin: "-80px 0px 0px 0px",
    });
    if (opening) past.observe(opening);

    const reading = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setChapter((entry.target as HTMLElement).dataset.chapter ?? null);
        }
      },
      { root, rootMargin: "-33% 0px -66% 0px" },
    );
    root.querySelectorAll("[data-chapter]").forEach((el) => reading.observe(el));

    /* The part: the last rule whose top is above the line. Worked out when
       a rule crosses into or out of the band above the line (the observer)
       and again when a scroll comes to rest, because a jump (an anchor, the
       End key, a fling) can carry a rule clean across the band between two
       frames without its ever being seen in it. A handful of rules, read
       once each time, never on every scrolled frame. */
    const rules = [...root.querySelectorAll<HTMLElement>("[data-section]")];
    const findPart = () => {
      const line = root.getBoundingClientRect().top + root.clientHeight * 0.34;
      const last = rules.filter((rule) => rule.getBoundingClientRect().top < line).at(-1);
      const of = last?.closest<HTMLElement>("[data-chapter]")?.dataset.chapter;
      setSection((prev) => {
        const next = last && of ? { chapter: of, label: last.dataset.section ?? "" } : null;
        return prev?.chapter === next?.chapter && prev?.label === next?.label ? prev : next;
      });
    };
    const parts = new IntersectionObserver(findPart, { root, rootMargin: "0px 0px -66% 0px" });
    rules.forEach((rule) => parts.observe(rule));
    root.addEventListener("scrollend", findPart);

    /* Back and Forward between chapters. The page scrolls inside its own
       world, which the browser does not restore, so it is put where the
       entry says: the chapter named in the address (below the bar, by the
       world's scroll padding), or the top. A click on a chapter link does
       its own scrolling (the glide's anchors); only a traversal comes
       through here. */
    let clicked = 0;
    const onClick = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest?.('a[href^="#"]')) clicked = performance.now();
    };
    const onPop = () => {
      if (performance.now() - clicked < 400) return;
      window.setTimeout(() => {
        const id = decodeURIComponent(window.location.hash.slice(1));
        const target = id ? document.getElementById(id) : null;
        if (target && target !== root) target.scrollIntoView({ block: "start", behavior: "instant" });
        else root.scrollTo({ top: 0, behavior: "instant" });
      }, 0);
    };
    root.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);

    /* The trail's waypoints, set where each chapter really starts along the
       scroll, so the rider (a CSS scroll timeline) passes each one as its
       chapter comes to the top. Measured again whenever a chapter changes
       size (its pictures arriving, the type settling), never on scroll. */
    const chapters = [...root.querySelectorAll<HTMLElement>("[data-chapter]")];
    const measure = () => {
      const max = root.scrollHeight - root.clientHeight;
      if (max <= 0) return;
      setAt(Object.fromEntries(chapters.map((c) => [c.dataset.chapter ?? "", Math.round((c.offsetTop / max) * 1000) / 1000])));
    };
    const sized = new ResizeObserver(measure);
    chapters.forEach((c) => sized.observe(c));

    return () => {
      past.disconnect();
      reading.disconnect();
      parts.disconnect();
      sized.disconnect();
      root.removeEventListener("scrollend", findPart);
      root.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  const current = PLATES.find((p) => p.id === chapter);
  const part = section && section.chapter === chapter ? section.label : null;

  /* Back to the top: the glide (or the browser) takes the page there; the
     reader is put on the name, so focus is not left on a control that is
     about to go. */
  const toTop = () => {
    const root = bar.current?.closest<HTMLElement>("[data-world]");
    /* After the link has done its own navigating, which moves focus. */
    window.requestAnimationFrame(() => root?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true }));
  };

  return (
    <>
      <header ref={bar} className={styles.masthead} data-solid={solid ? "" : undefined}>
        <a href="#top" className={styles.brand}>
          The Frontier
        </a>
        {/* The chapter is announced as it changes; the part only shown, or
          every rule passed would be read out. */}
        <p className={styles.running}>
          <span aria-live="polite">
            {solid && current ? (
              <span key={current.id}>
                {current.numeral} · {current.chapter}
              </span>
            ) : null}
          </span>
          {solid && current && part ? (
            <span key={part} className={styles.runningPart}>
              {part}
            </span>
          ) : null}
        </p>
        <div className={styles.nav}>
          {resume ? (
            <a href={resume} target="_blank" rel="noreferrer noopener" className={styles.navResume} aria-describedby="new-tab">
              Résumé
            </a>
          ) : null}
        </div>
        <span className={styles.progress} aria-hidden="true" />
      </header>
      {/* The sheet's margin: who it is, read up the left edge. */}
      <div className={styles.rails} aria-hidden="true">
        <p className={styles.railLeft}>
          {name} · {place}
        </p>
      </div>
      {/* The way through it: the trail at the foot of the screen, the four
        chapters as waypoints along it where each one starts, the one being
        read lit, and a rider on it for how far you have come. */}
      <nav className={styles.trail} aria-label="Chapters" data-solid={solid ? "" : undefined}>
        <span className={styles.trailLine} aria-hidden="true" />
        <span className={styles.trailRider} aria-hidden="true">
          <span />
        </span>
        {PLATES.map((p, i) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            className={styles.waypoint}
            style={{ "--at": at[p.id] ?? SPACED[i] } as CSSProperties}
            aria-current={chapter === p.id && solid ? "true" : undefined}
          >
            <span className={styles.waypointMark} aria-hidden="true" />
            <span className={styles.waypointName}>
              <span className={styles.waypointNumeral} aria-hidden="true">
                {p.numeral}
              </span>
              {p.chapter}
            </span>
          </a>
        ))}
      </nav>
      {/* Hidden (not just transparent) until the opening is behind you, so
        it is never tabbed to while it cannot be seen. */}
      <a href="#top" className={styles.toTop} data-on={solid ? "" : undefined} onClick={toTop}>
        <span className={styles.toTopMark} aria-hidden="true" />
        <span className={styles.toTopLabel}>Back to top</span>
      </a>
    </>
  );
}
