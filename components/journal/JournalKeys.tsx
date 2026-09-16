"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { JOURNAL_SECTIONS, RECORD_LEAVES } from "@/lib/journal/sections";
import { routes } from "@/lib/routes";

/** The whole book in reading order: six sections, then the rear records. */
const SPINE = [
  ...JOURNAL_SECTIONS.map((s) => s.href),
  ...RECORD_LEAVES.map((r) => r.href),
];

/**
 * Turning the page from the keyboard.
 *
 * §31 asks for ArrowRight / ArrowLeft / Escape, and the entire implementation
 * is "push a route" — because the route is the page. It therefore creates
 * real history entries, so a reader who turned four pages with the keyboard
 * can walk back through them with Back, which is what they will expect and
 * what a bespoke page-index in state would have quietly taken away.
 *
 * Two guards, and both are about not stealing keys that were not meant for
 * this:
 *
 *   - **Not while a control has focus.** Arrow keys belong to whatever is
 *     focused — a link list, a tab, the map's markers, a select. Acting only
 *     when focus is on the body or a plain element is the difference between
 *     a page-turn shortcut and a keyboard trap.
 *   - **Not with a modifier.** Alt+Left is the browser's Back on most
 *     platforms and Cmd+Left is the start of the line. Neither is ours.
 *
 * Scrolling is untouched: ArrowUp and ArrowDown are not bound at all, and
 * PageUp/PageDown/Home/End are left to the browser. §31 is explicit that the
 * notebook must not hijack normal scrolling, and the cheapest way to honour
 * that is to bind only the two keys that mean "sideways" in a book.
 */
export function JournalKeys({ current }: { current: string }) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

      const target = event.target as HTMLElement | null;
      if (target && target !== document.body) {
        /* Anything focusable owns its own arrow keys. `closest` rather than a
           tag check, so a link with a span inside it still counts. */
        if (
          target.closest(
            'a[href], button, input, select, textarea, [contenteditable], [role="tab"], [tabindex]:not([tabindex="-1"])',
          )
        ) {
          return;
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();
        router.push(routes.about);
        return;
      }

      const step =
        event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (step === 0) return;

      const here = SPINE.indexOf(current);
      if (here < 0) return;

      const next = here + step;
      /* The book does not wrap. A reader at the last record pressing forward
         has reached the end of the book, and inventing a jump back to the
         front would be a worse answer than nothing happening. */
      if (next < 0 || next >= SPINE.length) return;

      event.preventDefault();
      router.push(SPINE[next]);
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [current, router]);

  return null;
}
