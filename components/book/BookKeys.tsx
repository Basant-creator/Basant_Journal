"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BOOK_LEAVES,
  CAMP_ROUTE,
  FIRST_REAR_LEAF,
  leafIndex,
} from "@/lib/book/registry";

/**
 * Turning the page from the keyboard.
 *
 * §44 asks for ArrowRight, ArrowLeft, Home, End and Escape, and every one of
 * them is a route push — because the route is the page. They therefore make
 * real history entries, so a reader who turned four leaves with the keyboard
 * walks back through them with Back, which a private page index in state
 * would have quietly taken away.
 *
 * Two guards, both about not stealing keys meant for something else:
 *
 *   - **Not while a control has focus.** Arrow keys belong to whatever is
 *     focused — a bookmark, the map's markers, a select. Acting only when
 *     focus is on the body is the difference between a shortcut and a trap.
 *   - **Not with a modifier.** Alt+Left is Back on most platforms and
 *     Cmd+Left is the start of a line. Neither is ours.
 *
 * ArrowUp and ArrowDown are deliberately unbound, and so are PageUp, PageDown
 * and the space bar: §44 says do not hijack browser scrolling, and the
 * cheapest way to honour that is to bind only the keys that mean "sideways"
 * in a book.
 */
export function BookKeys({ pathname }: { pathname: string }) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        target !== document.body &&
        target.closest(
          'a[href], button, input, select, textarea, [contenteditable], [role="tab"], [tabindex]:not([tabindex="-1"])',
        )
      ) {
        return;
      }

      const here = leafIndex(pathname);

      switch (event.key) {
        case "Escape":
          event.preventDefault();
          router.push(CAMP_ROUTE);
          return;

        case "Home":
          event.preventDefault();
          router.push(BOOK_LEAVES[0].route);
          return;

        case "End":
          /* The back section, not the last leaf of it — "End" in a field book
             means the records, and dropping someone on the final project is a
             less useful answer than opening the section they were reaching
             for. */
          event.preventDefault();
          router.push(
            (FIRST_REAR_LEAF ?? BOOK_LEAVES[BOOK_LEAVES.length - 1]).route,
          );
          return;

        case "ArrowRight":
        case "ArrowLeft": {
          if (here < 0) return;
          const step = event.key === "ArrowRight" ? 1 : -1;
          const to = here + step;
          /* The book does not wrap. A reader at the last record pressing
             forward has reached the end of it, and a jump back to the front
             would be a worse answer than nothing happening. */
          if (to < 0 || to >= BOOK_LEAVES.length) return;
          event.preventDefault();
          router.push(BOOK_LEAVES[to].route);
          return;
        }

        default:
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pathname, router]);

  return null;
}
