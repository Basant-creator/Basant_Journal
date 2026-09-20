import type { Metadata } from "next";
import { LeafOnward } from "@/components/book/LeafOnward";
import { PageHeader } from "@/components/shared/PageHeader";
import { ContentsPage } from "@/components/journal/ContentsPage";
import { BookSpread } from "@/components/book/BookSpread";
import { RecordsIndexPage } from "@/components/journal/RecordsIndexPage";
import { getLocation } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import shared from "@/components/shared/Territory.module.css";

const location = getLocation("journal");

export const metadata: Metadata = {
  title: "Journal — Field records",
  description:
    "Basant Bhushan's field journal: three systems written up in full — TuneIt, a music sequencing engine; OnSight, an examination platform; BobAI, a full-stack application generator.",
  alternates: { canonical: routes.projects },
};

/**
 * The journal, open.
 *
 * This route is the notebook the visitor picks up at Camp. It is the same
 * three records it has always indexed, read off a bound leaf instead of a
 * stack of cards — §23 and §35 of the Phase 9 brief both insist the notebook
 * is a presentation layer, so nothing here is a second copy of anything.
 *
 * The bound cover that used to swing open over this page is gone, component
 * and stylesheet both. It announced the chapter over the page, and the
 * notebook now *is* the announcement: the reader arrives inside the object
 * rather than watching a lid come off it. Two openings for one act was the
 * thing Phase 5.1 spent a whole phase removing, and it would have come
 * straight back.
 *
 * The page header stays. A leaf is a reading surface, not a document outline,
 * and the route still needs an h1 that says where it is.
 */
export default function JournalPage() {
  return (
    <div className={shared.page}>
      <PageHeader
        eyebrow="Journal · Field records"
        title="Journal"
        lede="The notebook, open at the contents. The records themselves are kept in the back."
        symbol={location?.symbol}
      />

      <BookSpread left={<ContentsPage />} right={<RecordsIndexPage />} />

      <LeafOnward route={routes.projects} />
    </div>
  );
}
