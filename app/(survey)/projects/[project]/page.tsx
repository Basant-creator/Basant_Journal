import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecordNav } from "@/components/journal/RecordNav";
import { DocumentMeta } from "@/components/record/DocumentMeta";
import { DocumentStamp } from "@/components/record/DocumentStamp";
import { FieldNote } from "@/components/record/FieldNote";
import { FieldRecordHeader } from "@/components/record/FieldRecordHeader";
import { MetricPanel } from "@/components/record/MetricPanel";
import { ProjectNavigation } from "@/components/record/ProjectNavigation";
import { ProjectSheet } from "@/components/record/ProjectSheet";
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
 *
 * Nothing here draws a document any more — every part of it comes from
 * components/record, which is why all three records are the same document with
 * different words in it. The one thing still to be decided per project is the
 * stock each is filed on; that is the next step's job, and until then they are
 * all on the same paper.
 */
export default async function ProjectRecordPage({ params }: PageProps) {
  const { project: id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const { previous, next } = recordNeighbours(project.id);
  const index = projects.findIndex((p) => p.id === project.id) + 1;
  const hasLinks =
    project.linksStatus === "resolved" && (project.github || project.liveUrl);

  return (
    <article className={styles.record}>
      <FieldRecordHeader
        eyebrow={`Record ${project.chapter}`}
        title={project.title}
        subtitle={project.subtitle}
        back={{ href: routes.projects, label: "Journal" }}
        stamp={
          <DocumentStamp
            mark="Filed"
            note={`Written up in full and filed as record ${index} of ${projects.length}.`}
            filing={`recorded ${project.date.split("—")[1]?.trim() ?? project.date}`}
          />
        }
        meta={
          <DocumentMeta
            entries={[
              { term: "Period", value: project.date },
              { term: "Record", value: `${index} of ${projects.length}` },
              {
                term: "Also in",
                value: "Professional record",
                href: professionalAnchor(project.id),
              },
            ]}
          />
        }
      />

      {/* Only rendered once the URLs are actually verified — a broken link on
          a portfolio is worse than no link. */}
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

      <div className={styles.body}>
        <aside className={styles.rail}>
          <RecordNav />
        </aside>

        <div className={styles.sections}>
          <ProjectSheet id="overview" heading="Overview" sheet="1 of 6">
            <p className={styles.lede}>{project.summary}</p>
            <h3 className={styles.subhead}>The problem</h3>
            <p>{project.problem}</p>
            <h3 className={styles.subhead}>The objective</h3>
            <p>{project.objective}</p>
          </ProjectSheet>

          <ProjectSheet id="architecture" heading="Architecture" sheet="2 of 6">
            <p>{project.architecture}</p>
          </ProjectSheet>

          <ProjectSheet id="implementation" heading="Implementation" sheet="3 of 6">
            <ol className={styles.steps}>
              {project.implementation.map((line, i) => (
                <li key={line}>
                  <span className={styles.stepIndex}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </ProjectSheet>

          <ProjectSheet id="metrics" heading="Metrics" surface="plain" sheet="4 of 6">
            <MetricPanel
              metrics={project.metrics}
              caption={`Measured on ${project.title} — ${project.date}`}
            />
          </ProjectSheet>

          <ProjectSheet id="technology" heading="Technology" sheet="5 of 6">
            <ul className={styles.stack}>
              {project.technologies.map((tech) => (
                <li key={tech} className={styles.stackItem}>
                  {tech}
                </li>
              ))}
            </ul>
          </ProjectSheet>

          <ProjectSheet id="notes" heading="Field notes" sheet="6 of 6">
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
            <p>{project.lessons}</p>

            <FieldNote tag="Written up" hand="ink">
              {project.title} — {project.subtitle.toLowerCase()}.
            </FieldNote>
          </ProjectSheet>
        </div>
      </div>

      {/* The sequence does not wrap, and the way out of a record is the map
          rather than the index it was reached from: Map → Journal → Record →
          Map. Both are the routing contract's, not this page's. */}
      <ProjectNavigation
        previous={{
          href: previous.href,
          label: previous.label,
          caption: previous.isIndex ? "Back to" : "Previous record",
        }}
        next={{
          href: next.href,
          label: next.label,
          caption: next.isIndex ? "End of the records" : "Next record",
        }}
        exits={[
          { href: routes.frontier, label: "Return to map" },
          {
            href: professionalAnchor(project.id),
            label: "View professional record",
            quiet: true,
          },
        ]}
      />
    </article>
  );
}
