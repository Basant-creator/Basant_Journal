import type { Metadata } from "next";
import Link from "next/link";
import { OnwardNav } from "@/components/shared/OnwardNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { JournalOpening } from "@/components/world/JournalOpening";
import { PaperSurface } from "@/components/paper/PaperSurface";
import { Metric } from "@/components/metrics/Metric";
import { getLocation, projects } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import shared from "@/components/shared/Territory.module.css";
import styles from "./page.module.css";

const location = getLocation("journal");

export const metadata: Metadata = {
  title: "Journal — Projects",
  description:
    "Three systems written up in full: TuneIt, a music sequencing engine; OnSight, an examination platform; BobAI, a full-stack application generator.",
  alternates: { canonical: routes.projects },
};

/**
 * The Journal index — the canonical entry point for the projects.
 *
 * Each entry is a link to its own route, never a modal: a field record has to
 * be shareable, reloadable and reachable without visiting anything first.
 *
 * The chapter card this page used to open with is gone, and the cover carries
 * the beat instead. Two announcements of the same act is one too many, and an
 * object that opens says it better than a title over a veil.
 */
export default function JournalPage() {
  return (
    <JournalOpening
      className={shared.page}
      chapter="II"
      title="Field Records"
      id="journal"
      route={routes.projects}
    >
      <PageHeader
        eyebrow="Journal · Projects"
        title="Journal"
        lede="Three systems, built across 2026. Each record carries the problem it solved, how it was built, what it measured, and what it taught."
        symbol={location?.symbol}
      />

      <ol className={styles.entries}>
        {projects.map((project) => (
          <li key={project.id}>
            <PaperSurface as="article" edge="worn" className={styles.entry}>
              <p className={styles.chapter}>Chapter {project.chapter}</p>

              <Link href={project.route} className={styles.titleLink}>
                <h2 className={styles.title}>{project.title}</h2>
              </Link>
              <p className={styles.subtitle}>{project.subtitle}</p>
              <p className={shared.paperMeta}>{project.date}</p>

              <p className={styles.summary}>{project.summary}</p>

              <div className={styles.metrics}>
                {project.metrics.map((metric) => (
                  <Metric key={metric.label} value={metric.value} unit={metric.unit} />
                ))}
              </div>

              <ul className={shared.tags}>
                {project.technologies.slice(0, 6).map((tech) => (
                  <li key={tech} className={shared.tag}>
                    {tech}
                  </li>
                ))}
              </ul>

              <Link href={project.route} className={styles.open}>
                Open the record
                <span aria-hidden="true">&nbsp;→</span>
              </Link>
            </PaperSurface>
          </li>
        ))}
      </ol>

      <OnwardNav
        previous={{ href: routes.skills, caption: "Back along the trail", label: "Gear" }}
        next={{ href: routes.bounties, caption: "Next on the trail", label: "Bounties" }}
      />
    </JournalOpening>
  );
}
