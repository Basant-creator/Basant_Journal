import type { Metadata } from "next";
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
            {spelled.charAt(0).toUpperCase() + spelled.slice(1)} locations,
            walked in order. The red route is the one that
            matters — it runs from camp straight to the engineering work, and
            you are not expected to take the long way round.
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

      <FrontierMap />
    </div>
  );
}
