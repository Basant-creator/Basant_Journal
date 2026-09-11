import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/shared/Button";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Off the map",
};

export default function NotFound() {
  return (
    <main id="main" className={styles.page}>
      <p className={styles.eyebrow}>Unsurveyed</p>
      <h1 className={styles.title}>Off the map</h1>
      <p className={styles.body}>
        Nothing has been recorded at this position. The sheet covers seven
        locations; this is not one of them.
      </p>
      <div className={styles.actions}>
        <ButtonLink href="/frontier" variant="primary">
          Back to the sheet
        </ButtonLink>
        <ButtonLink href="/professional" variant="secondary">
          Professional view
        </ButtonLink>
      </div>
      <Link href="/" className={styles.home}>
        Return to the beginning
      </Link>
    </main>
  );
}
