import type { Metadata } from "next";
import { BookSpread } from "@/components/book/BookSpread";
import { FrontierMap } from "@/components/map/FrontierMap";
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
            the sheet, and not on the way to anywhere.
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
        §16: the survey sheet is printed on a leaf of the book.

        `held` rather than printed onto a JOURNAL_PAGE, because the map is
        already a sheet — a parchment field with ink cartography on it — and
        putting a sheet on a page would be two papers where the eye expects
        one. The book carries it; the map keeps its own stock.

        The engine is untouched. Same SVG, same camera, same markers, same
        keys, same legend column beside it — which is the "survey notes and
        legend" §16 asks for on the facing page, and it was already there.
      */}
      <BookSpread held right={<FrontierMap />} />
    </div>
  );
}
