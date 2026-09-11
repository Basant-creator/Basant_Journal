import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecordNav } from "@/components/journal/RecordNav";
import { PaperSurface } from "@/components/paper/PaperSurface";
import { SurveyAnnotation } from "@/components/annotations/SurveyAnnotation";
import { getProject, projects, recordNeighbours } from "@/lib/content/portfolio";
import { professionalAnchor, routes } from "@/lib/routes";
import styles from "./page.module.css";

interface PageProps {
  params: Promise<{ project: string }>;
}

export function generateStaticParams() {
  return projects.map((project) => ({ project: project.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { project: id } = await params;
  const project = getProject(id);
  if (!project) return {};

  return {
    title: `${project.title} — ${project.subtitle}`,
    description: project.summary,
    alternates: { canonical: project.route },
    openGraph: {
      title: `${project.title} — ${project.subtitle}`,
      description: project.summary,
      type: "article",
    },
  };
}

/**
 * A field record.
 *
 * One long document with fragment anchors rather than a route per section: the
 * URL says which record you are reading, the fragment says where in it you
 * are. It renders entirely from the content model, so it works as a direct URL
 * with no prior navigation.
 */
export default async function ProjectRecordPage({ params }: PageProps) {
  const { project: id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const { previous, next } = recordNeighbours(project.id);
  const hasLinks =
    project.linksStatus === "resolved" && (project.github || project.liveUrl);

  return (
    <article className={styles.record}>
      <div className={styles.head}>
        <Link href={routes.projects} className={styles.back}>
          <span aria-hidden="true">←&nbsp;</span>Journal
        </Link>

        <p className={styles.chapter}>Chapter {project.chapter}</p>
        <h1 className={styles.title}>{project.title}</h1>
        <p className={styles.subtitle}>{project.subtitle}</p>

        <dl className={styles.masthead}>
          <div>
            <dt>Period</dt>
            <dd>{project.date}</dd>
          </div>
          <div>
            <dt>Record</dt>
            <dd>
              {projects.findIndex((p) => p.id === project.id) + 1} of {projects.length}
            </dd>
          </div>
          <div>
            <dt>Also in</dt>
            <dd>
              <Link href={professionalAnchor(project.id)} className={styles.mastheadLink}>
                Professional record
              </Link>
            </dd>
          </div>
        </dl>

        {/* Only rendered once the URLs are actually verified — a broken link
            on a portfolio is worse than no link. */}
        {hasLinks ? (
          <div className={styles.externalLinks}>
            {project.github ? (
              <a
                href={project.github}
                target="_blank"
                rel="noreferrer noopener"
                className={styles.externalLink}
              >
                View source
              </a>
            ) : null}
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer noopener"
                className={styles.externalLink}
              >
                Live system
              </a>
            ) : null}
          </div>
        ) : (
          <p className={styles.unresolved}>
            Repository and demo links are not yet recorded for this system.
          </p>
        )}
      </div>

      <div className={styles.body}>
        <aside className={styles.rail}>
          <RecordNav />
        </aside>

        <div className={styles.sections}>
          <section id="overview" className={styles.section} aria-labelledby="overview-h">
            <h2 id="overview-h" className={styles.sectionHeading}>
              Overview
            </h2>
            <PaperSurface edge="worn" className={styles.sheet}>
              <p className={styles.lede}>{project.summary}</p>
              <h3 className={styles.subhead}>The problem</h3>
              <p className={styles.prose}>{project.problem}</p>
              <h3 className={styles.subhead}>The objective</h3>
              <p className={styles.prose}>{project.objective}</p>
            </PaperSurface>
          </section>

          <section id="architecture" className={styles.section} aria-labelledby="architecture-h">
            <h2 id="architecture-h" className={styles.sectionHeading}>
              Architecture
            </h2>
            <PaperSurface edge="worn" className={styles.sheet}>
              <p className={styles.prose}>{project.architecture}</p>
            </PaperSurface>
          </section>

          <section id="implementation" className={styles.section} aria-labelledby="implementation-h">
            <h2 id="implementation-h" className={styles.sectionHeading}>
              Implementation
            </h2>
            <PaperSurface edge="worn" className={styles.sheet}>
              <ol className={styles.steps}>
                {project.implementation.map((line, i) => (
                  <li key={line}>
                    <span className={styles.stepIndex}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.prose}>{line}</span>
                  </li>
                ))}
              </ol>
            </PaperSurface>
          </section>

          <section id="metrics" className={styles.section} aria-labelledby="metrics-h">
            <h2 id="metrics-h" className={styles.sectionHeading}>
              Metrics
            </h2>
            <ul className={styles.metrics}>
              {project.metrics.map((metric) => (
                <li key={metric.label}>
                  <span className={styles.metricValue}>{metric.value}</span>
                  <span className={styles.metricUnit}>{metric.unit}</span>
                  <span className={styles.metricLabel}>{metric.label}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="technology" className={styles.section} aria-labelledby="technology-h">
            <h2 id="technology-h" className={styles.sectionHeading}>
              Technology
            </h2>
            <PaperSurface edge="worn" className={styles.sheet}>
              <ul className={styles.stack}>
                {project.technologies.map((tech) => (
                  <li key={tech} className={styles.stackItem}>
                    {tech}
                  </li>
                ))}
              </ul>
            </PaperSurface>
          </section>

          <section id="notes" className={styles.section} aria-labelledby="notes-h">
            <h2 id="notes-h" className={styles.sectionHeading}>
              Field notes
            </h2>
            <PaperSurface edge="worn" className={styles.sheet}>
              <h3 className={styles.subhead}>What fought back</h3>
              <dl className={styles.challenges}>
                {project.challenges.map((entry) => (
                  <div key={entry.challenge}>
                    <dt className={styles.challenge}>{entry.challenge}</dt>
                    <dd className={styles.resolution}>{entry.resolution}</dd>
                  </div>
                ))}
              </dl>

              <h3 className={styles.subhead}>What it taught</h3>
              <p className={styles.prose}>{project.lessons}</p>

              <SurveyAnnotation tag="Surveyor's note" className={styles.note}>
                {project.title} — recorded {project.date.split("—")[1]?.trim() ?? project.date}.
              </SurveyAnnotation>
            </PaperSurface>
          </section>
        </div>
      </div>

      <nav className={styles.onward} aria-label="Records">
        <div className={styles.steps2}>
          <Link href={previous.href} className={styles.step}>
            <span className={styles.stepCaption}>
              {previous.isIndex ? "Back to" : "Previous record"}
            </span>
            <span className={styles.stepLabel}>
              <span aria-hidden="true">←&nbsp;</span>
              {previous.label}
            </span>
          </Link>

          <Link href={next.href} className={`${styles.step} ${styles.stepForward}`}>
            <span className={styles.stepCaption}>
              {next.isIndex ? "End of the records" : "Next record"}
            </span>
            <span className={styles.stepLabel}>
              {next.label}
              <span aria-hidden="true">&nbsp;→</span>
            </span>
          </Link>
        </div>

        {/* The way out of a record is the map, not the index it was reached
            from: Map → Journal → Record → Map. */}
        <div className={styles.exits}>
          <Link href={routes.frontier} className={styles.exit}>
            Return to map
          </Link>
          <Link href={professionalAnchor(project.id)} className={styles.exitQuiet}>
            View professional record
          </Link>
        </div>
      </nav>
    </article>
  );
}
