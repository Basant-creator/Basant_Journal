"use client";

import { useEffect } from "react";
import styles from "./titles.module.css";

/* A card holds this many before the oldest is patched over. */
const MAGAZINE = 12;
/* What a click on is meant for, and never a shot. */
const MEANT = "a, button, input, select, textarea, label, summary, [role='button'], [data-no-shot]";

/**
 * Shots fired at the cards: a click on an empty part of the card on screen
 * punches a bullet hole where it lands, with a flash and a small recoil.
 * Never a click meant for something (a link, a button), never a click that
 * ends a text selection, never one made from the keyboard. When a card is cut
 * away its holes fade, so it comes back clean.
 *
 * The hole lives in the card's own scrolling content, so it stays where it
 * was shot as the card scrolls. Decoration only: hidden from assistive
 * technology, and on a still machine or with reduced motion the hole simply
 * appears, with no flash and no recoil.
 */
export function Gunfire() {
  useEffect(() => {
    const deck = document.querySelector<HTMLElement>("[data-titles]");
    if (!deck) return;
    const still = () =>
      matchMedia("(prefers-reduced-motion: reduce)").matches || Boolean(document.documentElement.dataset.titlesStill);

    const fire = (event: MouseEvent) => {
      if (event.button !== 0 || event.detail === 0 || event.defaultPrevented) return;
      const target = event.target as Element;
      if (target.closest(MEANT)) return;
      const card = target.closest<HTMLElement>("[data-card][data-current]");
      /* Not mid-cut: a wipe on screen, or a card still leaving (a push or a
         zoom), means the card is about to change or is moving already. */
      if (!card || document.querySelector(`.${styles.wipes} i`) || deck.querySelector("[data-leaving]")) return;
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.toString().trim()) return;

      const box = card.getBoundingClientRect();
      const hole = document.createElement("span");
      hole.className = styles.hole;
      hole.setAttribute("aria-hidden", "true");
      hole.style.left = `${Math.round(event.clientX - box.left + card.scrollLeft)}px`;
      hole.style.top = `${Math.round(event.clientY - box.top + card.scrollTop)}px`;
      hole.style.setProperty("--spin", `${Math.round(Math.random() * 360)}deg`);
      card.append(hole);
      const holes = card.querySelectorAll(`.${styles.hole}`);
      if (holes.length > MAGAZINE) holes[0].remove();

      if (!still()) {
        card.animate(
          [{ transform: "none" }, { transform: "translate(5px, -4px)" }, { transform: "translate(-3px, 2px)" }, { transform: "none" }],
          { duration: 150, easing: "ease-out" },
        );
      }
    };

    /* A card cut away: its holes fade, then go. */
    const watch = new MutationObserver((changes) => {
      for (const change of changes) {
        const card = change.target as HTMLElement;
        if (card.hasAttribute("data-current")) continue;
        card.querySelectorAll<HTMLElement>(`.${styles.hole}`).forEach((hole) => {
          if (still()) return void hole.remove();
          hole.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" }).finished.then(() => hole.remove(), () => hole.remove());
        });
      }
    });
    deck.querySelectorAll("[data-card]").forEach((card) => watch.observe(card, { attributes: true, attributeFilter: ["data-current"] }));

    deck.addEventListener("click", fire);
    return () => {
      deck.removeEventListener("click", fire);
      watch.disconnect();
    };
  }, []);

  return null;
}
