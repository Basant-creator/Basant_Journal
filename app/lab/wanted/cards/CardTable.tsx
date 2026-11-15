"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { triggerCardDeal, triggerCardFlip, triggerCardRiffle } from "@/lib/audio/atmosphere";
import { createRng } from "@/lib/map/rng";
import styles from "./table.module.css";
import { useDepth } from "./useDepth";

type Suit = "♠" | "♥" | "♦" | "♣";
type Card = { rank: string; suit: Suit };
type Phase = "waiting" | "shuffling" | "dealing" | "dealt" | "gathering";
type Dealt = Card & { x: number; y: number; rot: number };
export type Writing = { head: string; text: string };

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const SUIT_NAMES: Record<Suit, string> = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" };
const RED = new Set<Suit>(["♥", "♦"]);

/* The deck sits on the far side, by the dealer (its place is in the CSS,
   --deck-x and --deck-y); the hand is dealt in a row across the middle of
   the cloth, the way the shared cards of a hand are, so every card can be
   seen whole and none lies on another. Percentages of the table. */
const ROW = [23, 41, 59, 77];
const ROW_Y = 58;

/* The skew each card lands at is the visit's: dealt once, it lands the same
   way when the visitor comes back to the table, until they ask for a new
   deal. Kept for the session, and read only when dealing, never in render. */
const DEAL_KEY = "frontier:wanted-deal";
function visitSeed(fresh: boolean): number {
  try {
    const kept = window.sessionStorage.getItem(DEAL_KEY);
    if (kept && !fresh) return Number(kept);
    const seed = Math.floor(Math.random() * 2 ** 31);
    window.sessionStorage.setItem(DEAL_KEY, String(seed));
    return seed;
  } catch {
    return Math.floor(Math.random() * 2 ** 31);
  }
}

/* Timings, which the CSS keyframes are written to. */
const RIFFLE_MS = 950;
const SHUFFLE_MS = RIFFLE_MS * 2;
const DEAL_BEAT_MS = 320;
const FLIGHT_MS = 820;
const GATHER_MS = 520;
const DECK_SHOWN = 14;

const r2 = (n: number) => Math.round(n * 100) / 100;

/** The hand: an ace for each thing written, one suit to each, dealt left to
    right in the record's own order, each landing a little askew. */
function dealHand(count: number, seed: number): Dealt[] {
  const rng = createRng(seed);
  return Array.from({ length: Math.min(count, ROW.length) }, (_, k) => ({
    rank: "A",
    suit: SUITS[k % SUITS.length],
    x: r2(ROW[k] + rng.jitter(1.2)),
    y: r2(ROW_Y + rng.jitter(1.6)),
    rot: r2(rng.jitter(5)),
  }));
}

/* An ace: its suit large in the middle, and which interest it carries
   lettered small under it, so the hand can be told apart before it is
   turned. */
function Face({ card, ordinal }: { card: Card; ordinal: string }) {
  return (
    <span className={styles.face} data-red={RED.has(card.suit) ? "" : undefined}>
      <span className={styles.index}>
        {card.rank}
        <span>{card.suit}</span>
      </span>
      <span className={styles.ace}>{card.suit}</span>
      <span className={styles.ordinal}>{ordinal}</span>
      <span className={`${styles.index} ${styles.indexFoot}`}>
        {card.rank}
        <span>{card.suit}</span>
      </span>
    </span>
  );
}

function Note({ writing, suit }: { writing: Writing; suit: Suit }) {
  return (
    <span className={styles.note}>
      <span className={styles.noteHead}>
        {writing.head} <span>{suit}</span>
      </span>
      <span className={styles.noteText}>{writing.text}</span>
    </span>
  );
}

/* The chips in front of each player: a few stacks, seeded so the server and
   the browser build the same table. */
const CHIPS = [
  { x: 13, y: 46, n: 7, tone: "red" },
  { x: 17, y: 35, n: 4, tone: "bone" },
  { x: 35, y: 25, n: 9, tone: "ink" },
  { x: 65, y: 25, n: 5, tone: "red" },
  { x: 87, y: 44, n: 6, tone: "bone" },
  { x: 83, y: 33, n: 8, tone: "ink" },
];

/**
 * A hand of cards in a back room, under one lamp.
 *
 * The table is seen from a chair: an oval of worn baize in a padded rail,
 * tilted away in perspective, the deck by the dealer on the far side. The
 * deck is riffled twice, then a hand is dealt across the middle of the
 * cloth, one card at a time, each thrown so it lands a little askew and
 * turns face up as it falls: an ace for each of his interests, one suit to
 * each, in the record's order. Pick a card up (click, tap, or Enter): it
 * rises toward you and turns over, and the interest is written on its back.
 * A card that has been read lies a little lifted off the cloth. Below the
 * table the same four are there as a plain list, for whoever would rather
 * just read them.
 *
 * Around it is everything a camera would see: the lamp's cone, smoke moving
 * through the light, motes, grain, and the dark the room falls away into.
 * With sound on, the cards are heard (riffle, deal, turn). With reduced
 * motion the hand is simply dealt, and a picked-up card is simply there.
 * Focus goes to the card picked up, and back to its place on the table when
 * it is put down.
 */
export function CardTable({ writings }: { writings: Writing[] }) {
  const scene = useRef<HTMLDivElement>(null);
  const held = useRef<HTMLDivElement>(null);
  const seatRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [hand, setHand] = useState<Dealt[] | null>(null);
  const [holding, setHolding] = useState<number | null>(null);
  const [read, setRead] = useState<Set<number>>(() => new Set());
  const heldButton = useRef<HTMLButtonElement>(null);
  const putBack = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const started = useRef(false);
  const still = useRef(false);
  useDepth(scene);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const deal = useCallback(
    (fresh = false) => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      setHolding(null);
      const seed = visitSeed(fresh);
      if (still.current) {
        setHand(dealHand(writings.length, seed));
        setPhase("dealt");
        return;
      }
      setPhase("shuffling");
      triggerCardRiffle();
      later(RIFFLE_MS, () => triggerCardRiffle());
      later(SHUFFLE_MS, () => {
        const next = dealHand(writings.length, seed);
        setHand(next);
        setPhase("dealing");
        next.forEach((_, i) => triggerCardDeal((i * DEAL_BEAT_MS) / 1000));
        later(DEAL_BEAT_MS * (next.length - 1) + FLIGHT_MS + 60, () => setPhase("dealt"));
      });
    },
    [writings.length],
  );

  const again = () => {
    if (phase !== "dealt") return;
    setRead(new Set());
    if (!hand || still.current) {
      deal(true);
      return;
    }
    setHolding(null);
    setPhase("gathering");
    later(GATHER_MS + 200, () => {
      setHand(null);
      deal(true);
    });
  };

  /* The first deal, when the table comes into view; loops rest off screen. */
  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    still.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "still";
    const io = new IntersectionObserver(
      ([entry]) => {
        el.toggleAttribute("data-paused", !entry.isIntersecting);
        if (entry.intersectionRatio >= 0.45 && !started.current) {
          started.current = true;
          deal();
        }
      },
      { root: el.closest("[data-world]"), threshold: [0, 0.45] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      started.current = false;
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [deal]);

  /* Picking a card up: the held card starts exactly where the table card is
     on screen, lying at the table's tilt, and rises to the middle of the
     frame, turning over on the way. Putting it down runs the same backwards. */
  const flight = useRef<Animation | null>(null);
  const liftFrom = (i: number) => {
    const from = seatRefs.current[i]?.getBoundingClientRect();
    const card = held.current?.getBoundingClientRect();
    if (!from || !card || !hand) return null;
    const dx = from.left + from.width / 2 - (card.left + card.width / 2);
    const dy = from.top + from.height / 2 - (card.top + card.height / 2);
    const s = Math.max(from.width, from.height) / Math.max(card.width, card.height);
    return `translate(${dx}px, ${dy}px) rotateX(52deg) rotateZ(${hand[i].rot}deg) scale(${s})`;
  };

  const pickUp = (i: number) => {
    if (phase !== "dealt" || holding !== null) return;
    setHolding(i);
    setRead((r) => new Set(r).add(i));
    triggerCardFlip();
  };

  /* Focus follows the card: to it when it is picked up, back to its place on
     the table when it is put down. */
  useEffect(() => {
    if (holding !== null) {
      heldButton.current?.focus({ preventScroll: true });
      return;
    }
    if (putBack.current !== null) {
      seatRefs.current[putBack.current]?.focus({ preventScroll: true });
      putBack.current = null;
    }
  }, [holding]);

  useEffect(() => {
    if (holding === null || still.current) return;
    const el = held.current;
    const from = liftFrom(holding);
    if (!el || !from) return;
    flight.current = el.animate(
      [
        { transform: `${from} rotateY(0deg)` },
        { transform: "translate(0, -14%) rotateX(0deg) rotateZ(0deg) scale(1.04) rotateY(100deg)", offset: 0.55 },
        { transform: "translate(0, 0) rotateX(0deg) rotateZ(0deg) scale(1) rotateY(180deg)" },
      ],
      { duration: 900, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" },
    );
  }, [holding]);

  const putDown = () => {
    if (holding === null) return;
    const done = () => {
      flight.current?.cancel();
      flight.current = null;
      putBack.current = holding;
      setHolding(null);
    };
    triggerCardFlip();
    if (still.current || !flight.current) {
      done();
      return;
    }
    flight.current.onfinish = done;
    flight.current.reverse();
  };

  useEffect(() => {
    if (holding === null) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && putDown();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const heldCard = holding !== null && hand ? hand[holding] : null;
  const hint =
    phase === "dealt"
      ? heldCard
        ? "Tap the card or the table, or press Escape, to put it back."
        : `Pick up a card to turn it over · ${read.size} of ${hand?.length ?? 0} read`
      : phase === "waiting"
        ? ""
        : "Dealing.";

  return (
    <div className={styles.wrap}>
      <div ref={scene} className={styles.scene} data-phase={phase} data-holding={heldCard ? "" : undefined}>
        <div className={styles.room} aria-hidden="true">
          <span className={styles.bokeh} style={{ left: "12%", top: "16%" } as CSSProperties} />
          <span className={styles.bokeh} style={{ left: "84%", top: "12%", scale: "0.7" } as CSSProperties} />
          <span className={styles.bokeh} style={{ left: "68%", top: "24%", scale: "0.45" } as CSSProperties} />
        </div>

        <div data-depth="" className={styles.stage}>
          <div data-depth="" className={styles.plane}>
            <span className={styles.underside} aria-hidden="true" />
            <span className={styles.edge} aria-hidden="true" />
            <span className={styles.rail} aria-hidden="true" />
            <span className={styles.leather} aria-hidden="true" />
            <span className={styles.felt} aria-hidden="true" />

            {CHIPS.map((c, i) => (
              <span
                key={i}
                className={styles.chips}
                data-tone={c.tone}
                style={{ left: `${c.x}%`, top: `${c.y}%` } as CSSProperties}
                aria-hidden="true"
              >
                {Array.from({ length: c.n }, (_, k) => (
                  <span key={k} className={styles.chip} style={{ "--z": k } as CSSProperties} />
                ))}
              </span>
            ))}

            <div className={styles.deck} aria-hidden="true">
              {Array.from({ length: DECK_SHOWN }, (_, i) => (
                <span key={i} className={styles.deckCard} data-half={i % 2 ? "right" : "left"} style={{ "--d": i } as CSSProperties}>
                  <span className={styles.back} />
                </span>
              ))}
            </div>

            {hand
              ? hand.map((card, i) => (
                  <button
                    key={`${card.rank}${card.suit}`}
                    ref={(el) => {
                      seatRefs.current[i] = el;
                    }}
                    type="button"
                    className={styles.card}
                    data-held={holding === i ? "" : undefined}
                    data-read={read.has(i) ? "" : undefined}
                    style={{ "--i": i, "--x": card.x, "--y": card.y, "--rot": `${card.rot}deg` } as CSSProperties}
                    aria-label={`Ace of ${SUIT_NAMES[card.suit]}, ${writings[i]?.head ?? ""}. Turn it over to read it.`}
                    onClick={() => pickUp(i)}
                  >
                    <span className={styles.toss}>
                      <span className={styles.sides}>
                        <span className={styles.front}>
                          <Face card={card} ordinal={writings[i]?.head ?? ""} />
                          <span className={styles.glint} />
                        </span>
                        <span className={styles.rear}>
                          <span className={styles.back} />
                        </span>
                      </span>
                    </span>
                  </button>
                ))
              : null}
          </div>
        </div>

        <span className={styles.lampCone} data-loop="" aria-hidden="true" />
        <span className={styles.lamp} aria-hidden="true" />
        <span className={`${styles.smoke} ${styles.smokeA}`} data-loop="" aria-hidden="true" />
        <span className={`${styles.smoke} ${styles.smokeB}`} data-loop="" aria-hidden="true" />
        <span className={`${styles.smoke} ${styles.smokeC}`} data-loop="" aria-hidden="true" />
        {/* At the lens: a glass and the bottle, too near to be sharp. */}
        <svg className={styles.nearGlass} viewBox="0 0 100 110" aria-hidden="true">
          <path className={styles.whiskey} d="M14,56 L86,56 L82,100 Q80,106 74,106 L26,106 Q20,106 18,100 Z" />
          <path className={styles.tumbler} d="M8,8 L92,8 L84,102 Q82,110 74,110 L26,110 Q18,110 16,102 Z" />
        </svg>
        <svg data-depth="" className={styles.nearBottle} viewBox="0 0 80 260" aria-hidden="true">
          <path d="M30,0 L50,0 L50,8 L48,10 L48,70 Q48,92 64,108 Q76,120 76,140 L76,252 Q76,260 68,260 L12,260 Q4,260 4,252 L4,140 Q4,120 16,108 Q32,92 32,70 L32,10 L30,8 Z" />
        </svg>
        <span className={styles.vignette} aria-hidden="true" />
        <span className={styles.grade} aria-hidden="true" />
        <span className={styles.grain} data-loop="" aria-hidden="true" />

        <div className={styles.dim} aria-hidden={!heldCard} onClick={putDown} />
        <div className={styles.hold} aria-hidden={!heldCard}>
          <div ref={held} className={styles.heldCard}>
            {heldCard ? (
              <button
                ref={heldButton}
                type="button"
                className={styles.heldButton}
                onClick={putDown}
                aria-label={`${writings[holding ?? 0]?.head}: ${writings[holding ?? 0]?.text}. Put the card back`}
              >
                <span className={styles.sides}>
                  <span className={styles.front}>
                    <Face card={heldCard} ordinal={writings[holding ?? 0]?.head ?? ""} />
                  </span>
                  <span className={styles.rear}>
                    <Note writing={writings[holding ?? 0] ?? { head: "", text: "" }} suit={heldCard.suit} />
                  </span>
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <p className={styles.hint} aria-live="polite">
          {/* Each new line set down over the last, so a change is seen. */}
          <span key={hint} className={styles.hintLine}>
            {hint}
          </span>
        </p>
        <button type="button" className={styles.again} onClick={again} disabled={phase !== "dealt"}>
          Shuffle and deal again
        </button>
      </div>

      <details className={styles.list}>
        <summary>All four as a list</summary>
        <ol>
          {writings.map((w, i) => (
            <li key={w.head}>
              <span className={styles.listSuit} data-red={RED.has(SUITS[i % SUITS.length]) ? "" : undefined} aria-hidden="true">
                {SUITS[i % SUITS.length]}
              </span>
              <span>{w.text}</span>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
