import type { Metadata } from "next";
import Link from "next/link";
import { OnwardNav } from "@/components/shared/OnwardNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { SceneTitle } from "@/components/world/SceneTitle";
import { SurveyAnnotation } from "@/components/annotations/SurveyAnnotation";
import { getLocation, getProject, metrics } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import shared from "@/components/shared/Territory.module.css";
import styles from "./page.module.css";

const location = getLocation("bounties");

export const metadata: Metadata = {
  title: "Bounties — Results",
  description:
    "Measured engineering outcomes: 157K+ tracks per second, 99.7% smoothness on a 500-track benchmark, four sequencing engines, three systems shipped.",
  alternates: { canonical: routes.bounties },
};

export default function BountiesPage() {
  return (
    <div className={shared.page}>
      <SceneTitle chapter="IV" title="The Board" subtitle="Notable findings" sceneId="board" />

      <PageHeader
        eyebrow="Bounties · Results"
        title="Bounties"
        lede="Measured outcomes, not adjectives. Every number links to the record that substantiates it — an unlinked metric reads as marketing."
        symbol={location?.symbol}
      />

      <ul className={styles.wall}>
        {metrics.map((metric) => {
          const project = metric.project ? getProject(metric.project) : undefined;
          return (
            <li key={metric.id} className={styles.bounty}>
              <span className={styles.value}>{metric.value}</span>
              <span className={styles.unit}>{metric.unit}</span>
              <p className={styles.context}>{metric.context}</p>
              {project ? (
                <Link href={project.route} className={styles.source}>
                  Record: {project.title}
                </Link>
              ) : (
                <Link href={routes.projects} className={styles.source}>
                  Record: the Journal
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <SurveyAnnotation tag="How these were taken" className={styles.note}>
        Throughput and smoothness were measured on a 500-track benchmark during
        TuneIt&rsquo;s development, not estimated after the fact.
      </SurveyAnnotation>

      <OnwardNav
        previous={{ href: routes.projects, caption: "Back along the trail", label: "Journal" }}
        next={{ href: routes.archive, caption: "Next on the trail", label: "Archive" }}
      />
    </div>
  );
}
