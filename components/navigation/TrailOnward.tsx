"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { OnwardNav } from "@/components/shared/OnwardNav";
import { routes } from "@/lib/routes";
import {
  indexOfRoute,
  nextCheckpoint,
  previousCheckpoint,
  serverSnapshot,
  subscribeTrail,
  visitedSnapshot,
} from "@/lib/world/trail";

/**
 * What to call the step forward.
 *
 * Derived from the destination rather than passed in, and that is not
 * tidiness — it is the same §33 problem one level down. Camp's next step is
 * Records *until the reader has opened the notebook*, and the Board after
 * that; a caption written at the call site is right for one of those two and
 * silently wrong for the other. "Next on the trail · Records" would also be a
 * true sentence about the route and a false one about the move, because the
 * Records are not somewhere you walk to. They are on the table in front of
 * you.
 */
function captionFor(id: string): string {
  return id === "records" ? "Open the field book at" : "Next on the trail";
}

/**
 * The foot of a world checkpoint.
 *
 * §33 in one component. The page does not decide where the trail goes next —
 * it asks the same model the trail indicator and the survey sheet ask, so the
 * three cannot disagree. Before this, every checkpoint carried a hand-written
 * pair of links, and the pairs had already drifted: Trail End's "next" pointed
 * back at the Journal, which is not on the route at all from there.
 *
 * The forward step is §19's, and it is the reason this is a client component
 * rather than three lines of server render. A visitor standing at Camp who
 * has not opened the notebook is pointed at the notebook; one who has just
 * closed it is pointed on down the trail to the Board. Same place, same
 * route, different next — because "next" is a fact about the walk, and the
 * walk only exists in the browser.
 *
 * The server renders the plain neighbour and the real answer arrives with
 * hydration, which is what the empty server snapshot is for. Nothing here is
 * ever the only way to reach anything: the trail indicator, the survey sheet
 * and the book's own bookmarks all reach the same routes.
 */
export function TrailOnward() {
  const pathname = usePathname();
  useSyncExternalStore(subscribeTrail, visitedSnapshot, serverSnapshot);

  const here = indexOfRoute(pathname);
  if (here === -1) return null;

  const back = previousCheckpoint(here);
  const forward = nextCheckpoint(here);

  return (
    <OnwardNav
      previous={
        back
          ? {
              href: back.route,
              caption: "Back along the trail",
              label: back.label === "Arrival" ? "The landing" : back.label,
            }
          : undefined
      }
      next={
        forward
          ? {
              href: forward.route,
              caption: captionFor(forward.id),
              label: forward.label,
            }
          : undefined
      }
      /*
        The way out is the sheet — including from the last checkpoint, where
        there is no forward step at all (§29: the trail terminates). That is
        §40's motif rather than a convenience: the sheet is where every one of
        these places is drawn, so it is the one destination that is true from
        all of them. Except on the sheet, where offering to return to it is an
        offer to go where the reader is standing.
      */
      returnTo={
        pathname === routes.frontier
          ? null
          : { href: routes.frontier, label: "Return to the survey" }
      }
    />
  );
}
