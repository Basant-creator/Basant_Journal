import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/shared/Button";
import styles from "./not-found.module.css";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Survey record not found",
};

export default function NotFound() {
  return (
    <main id="main" className={styles.page}>
      <p className={styles.eyebrow}>Unsurveyed</p>
      <h1 className={styles.title}>Survey record not found</h1>
      <p className={styles.body}>
        This territory has not been mapped. Nothing has been recorded at this
        position — no harm done; the sheet is one click away.
      </p>
      <div className={styles.actions}>
        <ButtonLink href={routes.frontier} variant="primary">
          Return to frontier
        </ButtonLink>
        <ButtonLink href={routes.professional} variant="secondary">
          Professional view
        </ButtonLink>
      </div>
      <Link href={routes.home} className={styles.home}>
        Return to the beginning
      </Link>
    </main>
  );
}
