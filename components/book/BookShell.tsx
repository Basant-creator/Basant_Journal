"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { useTransition } from "@/components/transition/TransitionContext";
import {
  BOOKMARKS,
  CAMP_ROUTE,
  FIRST_REAR_LEAF,
  isRearLeaf,
  leafFor,
  neighbours,
} from "@/lib/book/registry";
import { routes } from "@/lib/routes";
import { BookKeys } from "./BookKeys";
import styles from "./BookShell.module.css";

/**
 * The field book.
 *
 * Mounted by the book route group's layout, which is the whole architecture in
 * one sentence: **the shell is a layout, so it is never unmounted.** Next
 * preserves a layout across navigations between the routes that share it, so
 * turning from Gear to the Archive swaps the leaf's contents and leaves the
 * boards, the binding, the bookmarks and the ribbon exactly where they were.
 * That is what makes the book continuous rather than a container that is torn
 * down and rebuilt on every click, and it is why §1's "the book never
 * disappears" is a property of the file layout rather than of an animation.
 *
 * Three layers, kept apart, as §57 asks:
 *
 *   WORLD    the 3D Camp, which this never touches and never imports
 *   BOOK     these boards, and the turn between leaves
 *   CONTENT  whatever the route renders onto the open leaf
 *
 * The turn is drawn here rather than by the global RouteCurtain, because a
 * sheet sweeping the whole viewport would read as a page from some other
 * object passing in front of the book. The controller still owns *when* — it
 * publishes phase, direction and weight — and the book owns what that looks
 * like between its own covers.
 */
export function BookShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const transition = useTransition();
  const leaf = leafFor(pathname);
  const { previous, next } = neighbours(pathname);
  const atRear = isRearLeaf(pathname);

  /*
    The leaf currently shown, held one beat behind the route.

    Without this the content swaps the instant the router resolves and the
    turn plays over a leaf that has already changed — the reader sees the
    destination, then a page crossing it. Holding the previous children until
    the sweep has covered the page is what makes the turn *reveal* something.
  */
  const [shown, setShown] = useState<ReactNode>(children);
  const turning =
    transition?.type === "BOOK_TURN" && transition.phase !== "IDLE";

  useEffect(() => {
    if (!turning) setShown(children);
  }, [children, turning]);

  /* Swap under the cover of the sweep: at EXIT the leaf is across the page. */
  useEffect(() => {
    if (transition?.phase === "ENTER") setShown(children);
  }, [transition?.phase, children]);

  /*
    A jump from the Archive to a record crosses most of the book, and §30 is
    explicit that the reader should not watch fifteen pages at full speed.
    The weight comes from the registry — one leaf, a few, or the far side —
    and the sweep reads it as an attribute rather than as three animations.
  */
  const weight = transition?.weight ?? "single";
  const direction = transition?.direction ?? "forward";

  return (
    <div
      className={styles.book}
      data-turning={turning || undefined}
      data-weight={turning ? weight : undefined}
      data-direction={turning ? direction : undefined}
      data-rear={atRear || undefined}
    >
      <BookKeys pathname={pathname} />

      <div className={styles.board}>
        {/*
          §43: no navbar inside the book. The bookmarks *are* the navigation,
          and they are real links to real routes — a bookmark that holds
          private state looks physical and breaks Back.
        */}
        <nav className={styles.marks} aria-label="Field book sections">
          <ul className={styles.markList}>
            {BOOKMARKS.map((mark) => {
              const open = mark.route === pathname;
              return (
                <li key={mark.id}>
                  <Link
                    href={mark.route}
                    className={open ? `${styles.mark} ${styles.markOpen}` : styles.mark}
                    aria-current={open ? "page" : undefined}
                  >
                    {mark.tab}
                  </Link>
                </li>
              );
            })}
            {FIRST_REAR_LEAF ? (
              <li className={styles.markRear}>
                <Link
                  href={FIRST_REAR_LEAF.route}
                  className={atRear ? `${styles.mark} ${styles.markOpen}` : styles.mark}
                  aria-current={atRear ? "page" : undefined}
                >
                  Records
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>

        <div className={styles.spreadHolder}>
          <div className={styles.spread}>
            <span className={styles.binding} aria-hidden="true" />
            <div className={styles.leaf}>{shown}</div>
          </div>

          {/*
            The turning leaf. One element; the weight and direction attributes
            decide how it moves. It is aria-hidden and takes no pointer events
            — the page underneath stays live and readable the whole time.
          */}
          <span className={styles.turnLeaf} aria-hidden="true" />
          <span className={styles.turnLeafTwo} aria-hidden="true" />
        </div>

        {/* §44: semantic controls for the page turn, not only a gesture. */}
        <div className={styles.folio}>
          {previous ? (
            <Link href={previous.route} className={styles.arrow} rel="prev">
              <span aria-hidden="true">←</span>
              <span className={styles.arrowLabel}>{previous.tab}</span>
            </Link>
          ) : (
            <span className={styles.arrowSpacer} />
          )}

          <p className={styles.folioMark}>
            {leaf ? leaf.title : "Field Book"}
          </p>

          {next ? (
            <Link
              href={next.route}
              className={`${styles.arrow} ${styles.arrowNext}`}
              rel="next"
            >
              <span className={styles.arrowLabel}>{next.tab}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span className={styles.arrowSpacer} />
          )}
        </div>
      </div>

      {/*
        §35: the way out is physical, and it is still a real link. The
        professional view sits beside it because a recruiter must never have
        to close a book to find the résumé — it is the one destination the
        book is not allowed to swallow.
      */}
      <div className={styles.exits}>
        <Link href={CAMP_ROUTE} className={styles.ribbon}>
          <span className={styles.ribbonTail} aria-hidden="true" />
          <span>Close the book · back to camp</span>
        </Link>
        <Link href={routes.professional} className={styles.slip}>
          Professional view
        </Link>
      </div>
    </div>
  );
}
