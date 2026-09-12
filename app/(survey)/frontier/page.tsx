import type { Metadata } from "next";
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
