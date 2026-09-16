import type { ReactNode } from "react";
import Link from "next/link";
import { Paper } from "@/components/paper/Paper";
import { JOURNAL_SECTIONS, RECORD_LEAVES } from "@/lib/journal/sections";
import { routes } from "@/lib/routes";
import { JournalKeys } from "./JournalKeys";
import styles from "./FieldJournal.module.css";

interface FieldJournalProps {
  /** Which spine position is open. Drives the tabs and the turn direction. */
  current: string;
  /** The left page. Omitted on a rear record, which runs across the spread. */
  left?: ReactNode;
  /** The right page, or the whole leaf when `left` is absent. */
  right: ReactNode;
  /** A rear record reads as one wide leaf rather than a two-page spread. */
  rear?: boolean;
  /** Written on the head of the open leaf, in the hand. */
  hand?: string;
}

/**
 * The field journal.
 *
 * The notebook the visitor picks up at Camp, and the surface every record is
 * read on. Three decisions shape the whole thing, and the first is the one
 * that makes the other two cheap:
 *
 *   1. **The route is the state.** A section is a route, a record is a route,
 *      and which page is open is read from the pathname — never from a
 *      `useState` the URL does not know about. So this component holds no
 *      state at all, renders on the server, and Back, Forward, refresh and a
 *      pasted deep link are correct for free rather than by being handled.
 *      §21 of the brief warns against building an alternative routing system
 *      inside the book; the cheapest way not to build one is to have nothing
 *      to build it out of.
 *   2. **Turning a page is a route transition.** The existing
 *      TransitionProvider already owns route-entry choreography and already
 *      knows how to sweep a page across — so the turn lives there, with
 *      direction taken from the book's own spine order. One owner, and the
 *      notebook does not grow a second animation system that can disagree
 *      with the first.
 *   3. **It is DOM, CSS and SVG.** §4 is explicit: the Camp owns the 3D, the
 *      notebook owns the content. Nothing here imports three, and the paper
 *      is the same Paper substrate the rest of the site is printed on rather
 *      than a competing texture.
 *
 * The spread is two leaves on desktop and one on a phone — not two shrunk to
 * fit, which is how a book becomes unreadable at 375px.
 */
export function FieldJournal({
  current,
  left,
  right,
  rear = false,
  hand,
}: FieldJournalProps) {
  return (
    <div className={styles.book} data-rear={rear || undefined}>
      {/* Arrow keys turn the page. The only client code in the book. */}
      <JournalKeys current={current} />

      <div className={styles.board}>
        {/*
          The tabs are the book's edge, and they are real links to real routes.
          A bookmark that is a button holding private state is the §21 failure
          in miniature: it looks physical and it breaks Back.
        */}
        <nav className={styles.tabs} aria-label="Journal sections">
          <ul className={styles.tabList}>
            {JOURNAL_SECTIONS.map((section) => {
              const open = section.href === current;
              return (
                <li key={section.id}>
                  <Link
                    href={section.href}
                    className={open ? `${styles.tab} ${styles.tabOpen}` : styles.tab}
                    aria-current={open ? "page" : undefined}
                  >
                    {section.tab}
                  </Link>
                </li>
              );
            })}
            {/* The rear marker sits apart, below the others, the way a
                section divider does — it is not the seventh section, it is
                the back of the book. */}
            <li className={styles.tabRear}>
              <Link
                href={RECORD_LEAVES[0]?.href ?? routes.projects}
                className={
                  rear ? `${styles.tab} ${styles.tabOpen}` : styles.tab
                }
                aria-current={rear ? "page" : undefined}
              >
                Records
              </Link>
            </li>
          </ul>
        </nav>

        <div className={styles.spread}>
          {/* The binding. Drawn, not an image, and deliberately faint: a
              centre seam that announces itself is a graphic of a book. */}
          <span className={styles.binding} aria-hidden="true" />

          {left ? (
            <Paper
              variant="JOURNAL_PAGE"
              as="section"
              className={`${styles.leaf} ${styles.leafLeft}`}
            >
              {left}
            </Paper>
          ) : null}

          {/*
            A rear record is not printed on a notebook leaf.

            It arrives on its own stock — the working notebook, the manila
            file, the cyanotype — and that stock is the record's identity.
            Printing it onto a JOURNAL_PAGE first would bury the one thing
            that distinguishes the three of them under a fourth paper, and
            stack three substrates where the eye expects one. So the back of
            the book holds the sheets rather than being printed with them:
            the board, the tabs and the ribbon stay, and the document sits
            straight onto them.
          */}
          {rear ? (
            <div className={styles.rearLeaf}>{right}</div>
          ) : (
            <Paper
              variant="JOURNAL_PAGE"
              as="section"
              className={`${styles.leaf} ${left ? styles.leafRight : styles.leafWide}`}
            >
              {hand ? <p className={styles.hand}>{hand}</p> : null}
              {right}
            </Paper>
          )}
        </div>
      </div>

      {/*
        §20: the way back to Camp is a physical mark rather than a browser
        chrome button — a ribbon tucked into the spine. It is still a real
        link with a real accessible name, because "physical" is a visual
        decision and not an excuse to make the exit unreachable.
      */}
      <Link href={routes.about} className={styles.ribbon}>
        <span className={styles.ribbonTail} aria-hidden="true" />
        <span className={styles.ribbonText}>Back to camp</span>
      </Link>
    </div>
  );
}
