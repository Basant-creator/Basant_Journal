"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { compositesInSoftware } from "@/lib/cards/gpu";
import { Cylinder } from "./Cylinder";
import styles from "./titles.module.css";

export type DeckCard = { id: string; label: string };

/* Each card arrives by its own cut, so every card has a signature and no two
   cuts in a row are alike. By the index of the card arriving. */
const KINDS = ["zoom", "letterbox", "iris", "bars", "split", "blinds", "push", "slash"] as const;
type Kind = (typeof KINDS)[number];
const EASE = "cubic-bezier(0.8, 0, 0.2, 1)";
/* The skip link's target (SkipLink.tsx). */
const MAIN = "main";
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The projectionist: owns which card is up, and every cut between cards.
 *
 * One card shows at a time, and each card arrives by a cut of its own.
 * Wipes are laid in the next card's colour over the screen, the card is
 * swapped underneath while the screen is one colour, and the wipe is taken
 * off again:
 *   letterbox  cinema bars close from top and bottom, and open
 *   iris       a circle opens from the side the deck is moving toward
 *   bars       five bars slam across and carry on out the far side
 *   split      two halves meet in the middle and part
 *   blinds     eight slats drop, one after another, and fall away
 *   slash      a diagonal band, an ink streak ahead of it, cuts across
 * Moves are where the cards themselves travel:
 *   push       the new card slides in over the old, which falls back
 *   zoom       the new card punches in from close up over the old
 * A card that arrives gets `data-in`, which plays its letters and lines in
 * again (titles.module.css).
 *
 * Moving: wheel or trackpad (one cut per gesture, and only once a card that
 * scrolls has been read to its end), swipe, the arrow and page keys, Home
 * and End, the dots, and any link to `#card`. The address carries the card,
 * so a case file's way back lands on the card it came from.
 *
 * The rest are left in the page but inert, so keyboard focus and assistive
 * technology meet only the card on screen; each cut is announced.
 *
 * Stillness: reduced motion, or a browser compositing without a GPU
 * (`html[data-titles-still]`), cuts straight from card to card.
 *
 * A link to a case file lays five bars in its colour across the screen as
 * the router goes; the case file arrives under the same five bars, which
 * carry on off the far side. Navigation is never held for it.
 */
export function Deck({ cards }: { cards: DeckCard[] }) {
  const [current, setCurrent] = useState(-1);
  /* The cards seen this visit: a round in each of their chambers. */
  const [seen, setSeen] = useState<boolean[]>(() => cards.map(() => false));
  const cutRef = useRef<(i: number) => void>(() => {});

  /* Before paint, so the card the address names is the first one seen. */
  useLayoutEffect(() => {
    const deck = document.querySelector<HTMLElement>("[data-titles]");
    if (!deck) return;
    const html = document.documentElement;
    if (compositesInSoftware()) html.dataset.titlesStill = "1";
    const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches || Boolean(html.dataset.titlesStill);
    const els = [...deck.querySelectorAll<HTMLElement>("[data-card]")];
    /* Each card's field and ink, read once here. Read at the moment of a cut
       instead, getComputedStyle forces the whole page's style to be worked
       out inside the key press: 10-15ms on a slow phone, every cut. */
    const field = els.map((el) => getComputedStyle(el).getPropertyValue("--field"));
    const ink = els.map((el) => getComputedStyle(el).getPropertyValue("--ink"));
    const indexOf = (id: string) => els.findIndex((el) => el.dataset.card === id);

    /* Over everything, outside the deck's own stacking. */
    const layer = document.createElement("div");
    layer.className = styles.wipes;
    layer.setAttribute("aria-hidden", "true");
    document.body.append(layer);

    let at = Math.max(0, indexOf(location.hash.slice(1)));
    let busy = false;

    const show = (i: number, arriving: boolean) => {
      const hadFocus = els[at]?.contains(document.activeElement) ?? false;
      els.forEach((el, k) => {
        const on = k === i;
        el.toggleAttribute("data-current", on);
        el.inert = !on;
        if (!on) el.removeAttribute("data-in");
      });
      if (arriving) els[i].setAttribute("data-in", "");
      els[i].scrollTop = 0;
      /* The frame (name, sections, count, dots) is printed in the card's ink:
         set on those few elements, not on the deck, whose every card would
         restyle for it. */
      deck.querySelectorAll<HTMLElement>("[data-frame]").forEach((el) => el.style.setProperty("--frame-ink", ink[i]));
      at = i;
      setCurrent(i);
      setSeen((was) => (was[i] ? was : was.map((v, k) => v || k === i)));
      const hash = i === 0 ? "" : `#${els[i].dataset.card}`;
      if (location.hash !== hash) history.replaceState(history.state, "", `${location.pathname}${location.search}${hash}`);
      if (hadFocus) els[i].focus({ preventScroll: true });
    };

    const wipe = (kind: Kind | "leave", field: string) => {
      const el = document.createElement("div");
      el.className = styles.wipe;
      el.dataset.kind = kind;
      el.style.setProperty("--field", field);
      layer.append(el);
      return el;
    };

    const cut = async (i: number) => {
      if (busy || i === at || i < 0 || i >= els.length) return;
      if (still()) {
        show(i, false);
        return;
      }
      busy = true;
      const dir = i > at ? 1 : -1;
      const kind = KINDS[i % KINDS.length];

      /* The moves: both cards on screen at once, the old one kept visible
         (data-leaving) under the new. */
      if (kind === "push" || kind === "zoom") {
        const old = els[at];
        const card = els[i];
        old.setAttribute("data-leaving", "");
        show(i, true);
        try {
          const push = kind === "push";
          const timing = { duration: push ? 760 : 620, easing: push ? "cubic-bezier(0.7, 0, 0.2, 1)" : "cubic-bezier(0.2, 0.8, 0.2, 1)" };
          const into = card.animate(
            push
              ? [{ transform: `translateX(${dir * 100}%)` }, { transform: "none" }]
              : [{ transform: "scale(1.3)", opacity: 0 }, { transform: "none", opacity: 1 }],
            timing,
          );
          const away = old.animate(
            push
              ? [{ transform: "none", opacity: 1 }, { transform: `translateX(${-dir * 28}%)`, opacity: 0.35 }]
              : [{ transform: "none", opacity: 1 }, { transform: "scale(0.9)", opacity: 0.2 }],
            timing,
          );
          await Promise.all([into.finished, away.finished]);
        } finally {
          old.removeAttribute("data-leaving");
          busy = false;
        }
        return;
      }

      const cover = wipe(kind, field[i]);
      try {
        /* Each piece of a wipe is ONE animation, on, hold and off, run by
           the compositor start to end, so nothing waits on the main thread
           between phases. The card is swapped by a timer in the hold, while
           the screen is one colour. */
        const IN = kind === "iris" ? 620 : kind === "blinds" ? 360 : 420;
        const HOLD = 120;
        const OUT = kind === "iris" ? 300 : kind === "blinds" ? 380 : 460;
        const STEP = kind === "bars" ? 55 : kind === "blinds" ? 38 : kind === "slash" ? 70 : 0;
        const held: Keyframe = { transform: "none", opacity: 1 };
        const piece = () => cover.appendChild(document.createElement("i"));
        const pieces: { el: HTMLElement; from: Keyframe; to: Keyframe }[] = [];
        if (kind === "iris") {
          const disc = piece();
          const x = innerWidth * (dir > 0 ? 0.78 : 0.22);
          const y = innerHeight * 0.6;
          const r = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)));
          Object.assign(disc.style, { left: `${Math.round(x - r)}px`, top: `${Math.round(y - r)}px`, width: `${2 * r}px`, height: `${2 * r}px` });
          pieces.push({ el: disc, from: { transform: "scale(0)", opacity: 1 }, to: { transform: "none", opacity: 0 } });
        } else if (kind === "bars") {
          const enter = { transform: `translateX(${dir > 0 ? -101 : 101}%)`, opacity: 1 };
          const leave = { transform: `translateX(${dir > 0 ? 101 : -101}%)`, opacity: 1 };
          for (let k = 0; k < 5; k++) pieces.push({ el: piece(), from: enter, to: leave });
        } else if (kind === "split") {
          const left = { transform: "translateX(-101%)", opacity: 1 };
          const right = { transform: "translateX(101%)", opacity: 1 };
          pieces.push({ el: piece(), from: left, to: left }, { el: piece(), from: right, to: right });
        } else if (kind === "letterbox") {
          const top = { transform: "translateY(-101%)", opacity: 1 };
          const bottom = { transform: "translateY(101%)", opacity: 1 };
          pieces.push({ el: piece(), from: top, to: top }, { el: piece(), from: bottom, to: bottom });
        } else if (kind === "blinds") {
          /* Slats in the order of travel: left to right going forward. */
          const slats = Array.from({ length: 8 }, piece);
          const order = dir > 0 ? slats : [...slats].reverse();
          for (const el of order) pieces.push({ el, from: { transform: "translateY(-101%)", opacity: 1 }, to: { transform: "translateY(101%)", opacity: 1 } });
        } else {
          /* The slash: a square band, the screen's diagonal on a side,
             tilted, crossing the screen; an ink streak runs ahead of it. */
          const d = Math.ceil(Math.hypot(innerWidth, innerHeight));
          const tilt = dir > 0 ? -14 : 14;
          const box = { left: `${Math.round(innerWidth / 2 - d)}px`, top: `${Math.round(innerHeight / 2 - d)}px`, width: `${2 * d}px`, height: `${2 * d}px` };
          const streak = piece();
          const band = piece();
          Object.assign(streak.style, box, { background: ink[i] });
          Object.assign(band.style, box);
          const from = { transform: `rotate(${tilt}deg) translateX(${-dir * 101}%)`, opacity: 1 };
          const to = { transform: `rotate(${tilt}deg) translateX(${dir * 101}%)`, opacity: 1 };
          held.transform = `rotate(${tilt}deg)`;
          pieces.push({ el: streak, from, to }, { el: band, from, to });
        }
        const last = (pieces.length - 1) * STEP;
        const covered = last + IN;
        const total = covered + HOLD + last + OUT;
        const at$ = (t: number) => Math.min(1, t / total);
        const runs = pieces.map(({ el, from, to }, k) => {
          const onAt = k * STEP;
          const offAt = covered + HOLD + k * STEP;
          return el.animate(
            [
              { ...from, offset: 0 },
              { ...from, offset: at$(onAt), easing: kind === "iris" ? "cubic-bezier(0.7, 0, 0.3, 1)" : EASE },
              { ...held, offset: at$(onAt + IN) },
              { ...held, offset: at$(offAt), easing: kind === "iris" ? "ease-out" : EASE },
              { ...to, offset: at$(offAt + OUT) },
              { ...to, offset: 1 },
            ],
            { duration: total, easing: "linear" },
          );
        });
        await new Promise((done) => window.setTimeout(done, covered + 30));
        show(i, true);
        await Promise.all(runs.map((run) => run.finished));
      } finally {
        cover.remove();
        busy = false;
      }
    };
    cutRef.current = (i) => void cut(i);

    show(at, false);
    delete html.dataset.titlesAt;
    /* Arriving by the router (a case file's way back), the address can be
       written a moment after this runs: look again once it has. */
    const settle = requestAnimationFrame(() => {
      const i = indexOf(location.hash.slice(1));
      if (i >= 0 && i !== at) show(i, false);
    });

    /* The cards waiting their turn are not painted, so a picture on one
       would first be decoded the instant its cut lands. Decode every picture
       while the page is idle, so no cut waits on one. */
    const warm = () =>
      deck.querySelectorAll("img").forEach((img) => {
        img.loading = "eager";
        img.decode().catch(() => {});
      });
    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle = hasIdle ? window.requestIdleCallback(warm, { timeout: 2500 }) : window.setTimeout(warm, 1200);

    /* Whether the card on screen still has reading left in a direction. */
    const canScroll = (el: HTMLElement, d: number) =>
      d > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 2 : el.scrollTop > 2;

    /* One cut per gesture: a trackpad's momentum keeps sending wheel events
       for a second after the fingers lift, so a cut re-arms only after a
       pause. A gesture that scrolled a card never cuts. */
    let last = 0;
    let armed = true;
    let sum = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      const now = performance.now();
      if (now - last > 220) {
        armed = true;
        sum = 0;
      }
      last = now;
      if (!armed || busy) return;
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (canScroll(els[at], d)) {
        armed = false;
        return;
      }
      sum += d;
      if (Math.abs(sum) > 40) {
        armed = false;
        void cut(at + Math.sign(sum));
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      const card = els[at];
      const onPage = target === document.body || target === card;
      const step = (dir: number, amount: number) => {
        e.preventDefault();
        if (canScroll(card, dir)) card.scrollBy({ top: dir * amount, behavior: still() ? "auto" : "smooth" });
        else void cut(at + dir);
      };
      switch (e.key) {
        case "ArrowDown":
          return step(1, 120);
        case "ArrowUp":
          return step(-1, 120);
        case "PageDown":
          return step(1, card.clientHeight * 0.85);
        case "PageUp":
          return step(-1, card.clientHeight * 0.85);
        case " ":
          if (onPage) step(e.shiftKey ? -1 : 1, card.clientHeight * 0.85);
          return;
        case "ArrowRight":
          e.preventDefault();
          return void cut(at + 1);
        case "ArrowLeft":
          e.preventDefault();
          return void cut(at - 1);
        case "Home":
          if (onPage) void cut(0);
          return;
        case "End":
          if (onPage) void cut(els.length - 1);
          return;
      }
    };

    let start: { x: number; y: number; down: boolean; up: boolean } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      start = { x: t.clientX, y: t.clientY, down: !canScroll(els[at], 1), up: !canScroll(els[at], -1) };
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = start.x - t.clientX;
      const dy = start.y - t.clientY;
      if (Math.abs(dx) > Math.abs(dy) * 1.4 && Math.abs(dx) > 50) void cut(at + Math.sign(dx));
      else if (dy > 60 && start.down) void cut(at + 1);
      else if (dy < -60 && start.up) void cut(at - 1);
      start = null;
    };

    const onHash = () => {
      const id = location.hash.slice(1);
      const i = indexOf(id);
      /* The skip link (#main) means "the content": the card on screen, not
         a cut. Put the address back to that card's. */
      if (id === MAIN) {
        els[at].focus({ preventScroll: true });
        const hash = at === 0 ? "" : `#${els[at].dataset.card}`;
        history.replaceState(history.state, "", `${location.pathname}${location.search}${hash}`);
        return;
      }
      void cut(i < 0 ? 0 : i);
    };

    /* Leaving for a case file: bars in its colour, while the router goes. */
    let coverTimer = 0;
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest<HTMLAnchorElement>("a[data-case]");
      if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || still()) return;
      const cover = wipe("leave", field[at]);
      [...Array(5)].forEach((_, k) => {
        const bar = cover.appendChild(document.createElement("i"));
        bar.style.transformOrigin = "left";
        bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 360, delay: k * 45, easing: EASE, fill: "forwards" });
      });
      window.clearTimeout(coverTimer);
      coverTimer = window.setTimeout(() => cover.remove(), 1600);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("hashchange", onHash);
    deck.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("hashchange", onHash);
      deck.removeEventListener("click", onClick);
      window.clearTimeout(coverTimer);
      cancelAnimationFrame(settle);
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      layer.remove();
      cutRef.current = () => {};
    };
  }, []);

  const shown = Math.max(current, 0);
  return (
    <>
      <p className={styles.count} aria-hidden="true" data-frame="">
        <Cylinder count={cards.length} at={shown} loaded={seen} />
        <span>
          {pad(shown + 1)} / {pad(cards.length)}
        </span>
      </p>
      <nav className={styles.dots} aria-label="Title cards" data-frame="">
        {cards.map((card, k) => (
          <button
            key={card.id}
            type="button"
            aria-label={card.label}
            aria-current={k === current ? "true" : undefined}
            onClick={() => cutRef.current(k)}
          >
            <span />
          </button>
        ))}
      </nav>
      <p className={styles.srOnly} aria-live="polite">
        {current >= 0 ? `${cards[current].label}, card ${current + 1} of ${cards.length}` : ""}
      </p>
    </>
  );
}
