import { OnwardNav } from "@/components/shared/OnwardNav";
import { CAMP_ROUTE, neighbours } from "@/lib/book/registry";
import { routes } from "@/lib/routes";

interface LeafOnwardProps {
  /** The leaf's own canonical route. The registry does the rest. */
  route: string;
}

/**
 * The foot of a leaf of the field book.
 *
 * Document scale, and the counterpart of TrailOnward — which is the point of
 * it existing at all. The world's checkpoints ask the world model where to go
 * next; a page of the notebook asks the book's registry, which is the one
 * place the order of the leaves is written (§33: all layers normalise to the
 * same semantic location).
 *
 * It replaced three hand-written pairs of links, and they had already drifted:
 * the Journal's "next on the trail" pointed at Bounties and Gear's at the
 * Journal, which described a book whose order had been changed underneath
 * them twice. The folio arrows in BookShell were right the whole time,
 * because they read the registry. So does this.
 *
 * The last leaf has no next inside the book, and what it offers instead is
 * the way out: closing the notebook and standing up at Camp. That is §18's
 * move and it is deliberately the *only* forward step from the back of the
 * book — where the trail goes after Records is the world's business, and the
 * trail indicator is already showing it.
 */
export function LeafOnward({ route }: LeafOnwardProps) {
  const { previous, next } = neighbours(route);

  return (
    <OnwardNav
      previous={
        previous
          ? { href: previous.route, caption: "Back a leaf to", label: previous.tab }
          : { href: CAMP_ROUTE, caption: "Close the book and return to", label: "Camp" }
      }
      next={
        next
          ? { href: next.route, caption: "Turn to", label: next.tab }
          : { href: CAMP_ROUTE, caption: "Close the book and return to", label: "Camp" }
      }
      returnTo={{ href: routes.frontier, label: "Return to the survey" }}
    />
  );
}
