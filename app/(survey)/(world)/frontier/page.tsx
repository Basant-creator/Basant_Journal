import type { Metadata } from "next";
import { FrontierMap } from "@/components/map/FrontierMap";
import { TrailOnward } from "@/components/navigation/TrailOnward";
import { locations, meta } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import styles from "./page.module.css";

/*
  Counted, never asserted.

  The description said seven locations, the lede said six, and the sheet data
  said 6 — three numbers for one fact, and the only one a search result would
  ever show was the wrong one. The content model is the only thing that knows,
  so it is the only thing that says.
*/
const COUNT = locations.length;
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"];
const spelled = WORDS[COUNT] ?? String(COUNT);

export const metadata: Metadata = {
  title: "The Survey",
  description: `An interactive survey map of Basant Bhushan's work: ${spelled} locations, one primary trail, and the engineering at the end of it.`,
  alternates: { canonical: routes.frontier },
};

export default function FrontierPage() {
  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.eyebrow}>{meta.volume} · The survey</p>
          <h1 className={styles.title}>The Frontier</h1>
          <p className={styles.lede}>
            {spelled.charAt(0).toUpperCase() + spelled.slice(1)} locations.
            The red route is the trail itself — camp, records, board, archive,
            trail end, in that order. Gear hangs off the records as a spur: on
            the sheet, and not on the way to anywhere. Follow it to the camp
            and the rest of the territory follows from there.
          </p>
        </div>
        <dl className={styles.sheetData}>
          <div>
            <dt>Sheet</dt>
            <dd>1 of 1</dd>
          </div>
          <div>
            <dt>Surveyed</dt>
            <dd>{meta.surveyed}</dd>
          </div>
          <div>
            <dt>Locations</dt>
            <dd>{COUNT}</dd>
          </div>
        </dl>
      </header>

      {/*
        The sheet, standing on its own ground again.

        It was printed on a leaf of the field book for two phases, and that
        was a defensible reading — a survey does open with its sheet. Phase 12
        §51.2 resolves it the other way and the reason is §4: the whole
        argument of the site is that the visitor moves from looking at a
        territory to examining the survey *of* that territory, and a survey
        that is a page inside a notebook lying on a table at the camp cannot
        be the thing the camp is drawn on. The map is the world's own scale;
        the book is the document's.

        The engine is untouched — same SVG, same camera, same markers, same
        keys, same legend column beside it. What changed is the frame around
        it, which is now the scene the map already carried rather than a pair
        of book boards. What remains of the sheet inside the book is
        SheetReference: the same trail geometry, drawn small, as a figure.
      */}
      <FrontierMap />

      <TrailOnward />
    </div>
  );
}
