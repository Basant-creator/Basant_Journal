import type { Metadata } from "next";
import { ChapterCard } from "@/components/scene/ChapterCard";
import { FrontierMap } from "@/components/map/FrontierMap";
import { meta } from "@/lib/content/portfolio";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "The Survey",
  description:
    "An interactive survey map of Basant Bhushan's work: seven locations, one primary trail, and the engineering at the end of it.",
  alternates: { canonical: "/frontier" },
};

export default function FrontierPage() {
  return (
    <div className={styles.page}>
      {/* The establishing beat. The territory is not a numbered chapter — it
          is the thing the chapters happen in — so it takes the card's named
          form rather than a numeral, and like every other card it plays once
          a session, over a page that is already complete beneath it. */}
      <ChapterCard label="Prologue" title="The Frontier" id="frontier" />

      <header className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.eyebrow}>{meta.volume} · The survey</p>
          <h1 className={styles.title}>The Frontier</h1>
          <p className={styles.lede}>
            Six locations, walked in order. The red route is the one that
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
            <dd>6</dd>
          </div>
        </dl>
      </header>

      <FrontierMap />
    </div>
  );
}
