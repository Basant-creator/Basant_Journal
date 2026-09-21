import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookSpread } from "@/components/book/BookSpread";
import { RecordPacket } from "@/components/book/RecordPacket";
import { DocumentMeta } from "@/components/record/DocumentMeta";
import { DocumentStamp } from "@/components/record/DocumentStamp";
import { FieldNote } from "@/components/record/FieldNote";
import { FieldRecordHeader } from "@/components/record/FieldRecordHeader";
import { MetricPanel } from "@/components/record/MetricPanel";
import { ProjectNavigation } from "@/components/record/ProjectNavigation";
import { ProjectSheet } from "@/components/record/ProjectSheet";
import { TechnicalDiagram } from "@/components/record/TechnicalDiagram";
import {
  DIAGRAM_HEIGHT,
  DIAGRAM_WIDTH,
  RecordDiagram,
} from "@/components/record/diagrams/RecordDiagram";
import {
  getProject,
  projects,
  recordNeighbours,
} from "@/lib/content/portfolio";
import { hasFigure, identityFor } from "@/lib/record/identity";
import { professionalAnchor, routes } from "@/lib/routes";
import styles from "./page.module.css";

interface PageProps {
  params: Promise<{ project: string }>;
}

export function generateStaticParams() {
  return projects.map((project) => ({ project: project.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
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
 * Nothing here draws a document — every part of it comes from
 * components/record, which is why all three records are the same document
 * with different words in it. What makes them three different documents is
 * the identity: the stock they are filed on, the mark struck on them, and the
 * figure drawn on their architecture sheet. That is data, in lib/record, so
 * a fourth project costs an entry rather than a branch.
 */
export default async function ProjectRecordPage({ params }: PageProps) {
  const { project: id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const identity = identityFor(project.id);
  const { previous, next } = recordNeighbours(project.id);
  const index = projects.findIndex((p) => p.id === project.id) + 1;
  const hasLinks =
    project.linksStatus === "resolved" && (project.github || project.liveUrl);

  return (
    /*
      The record, in the back of the notebook.

      §34: the notebook stays the visual container all the way down, so a
      reader who opened the book at the contents and turned to a record never
      lands on a differently-shaped website — the board, the fore-edge tabs
      and the ribbon back to Camp are the same object they were a page ago.

      What does not change is the document. It is the same field record it
      has always been, on its own stock, with its own mark and figure and the
      same six sheet anchors — because §23 says one canonical source and the
      record was already right. The book is the binding around it, not a
      rewrite of it.
    */
    <BookSpread
      held
      right={
        <article className={styles.record} data-project={project.id}>
          {/*
            The opening, as one block.

            The filing line, the masthead and the note about links were three
            siblings of `.record`, which puts a 56px gap between each of them
            on top of their own margins. Photographed at 1440x900 that came to
            roughly 300px of empty board between "Field record 01" and the
            first sheet — the masthead floating with nothing under it, and the
            document starting below the fold.

            They are one thing: the head of a record. Grouped, they get one
            tight internal rhythm and the 56px gap now separates the head from
            the sheets, which is the only place it was ever meant to be.
          */}
          <header className={styles.opening}>
          <p className={styles.filing}>
            Field record {String(index).padStart(2, "0")} — the back of the
            journal
          </p>
          <FieldRecordHeader
        eyebrow={`Record ${project.chapter}`}
        title={project.title}
        subtitle={project.subtitle}
        back={{ href: routes.projects, label: "Journal" }}
        stamp={
          <DocumentStamp
            mark={identity.stamp.mark}
            note={identity.stamp.note}
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
      </header>

      {/*
        The record, as a packet of sheets.

        §13 and §17: a field record is a set of documents clipped together,
        and each sheet answers one question — what is this, what problem, how
        was it built, what did it measure, what with, what did it teach. Those
        six were already the document's own divisions; what changes is that
        the reader now turns through them instead of scrolling past them.

        §31: the URL does not move. Which record is open is a route; which
        sheet is open is where in a document someone has read to, which is
        state. That is what keeps Back walking records rather than paragraphs.
      */}
      <RecordPacket
        filing={`Field record ${String(index).padStart(2, "0")}`}
        previousRecord={
          previous.isIndex ? null : { href: previous.href, label: previous.label }
        }
        nextRecord={next.isIndex ? null : { href: next.href, label: next.label }}
        leaves={[
          { id: "overview", label: "Overview", node: (
          <ProjectSheet
            id="overview"
            heading="Overview"
            sheet="1 of 6"
            variant={identity.stock}
          >
            <p className={styles.docket}>{identity.docket}</p>
            <p className={styles.lede}>{project.summary}</p>
            <h3 className={styles.subhead}>The problem</h3>
            <p>{project.problem}</p>
            <h3 className={styles.subhead}>The objective</h3>
            <p>{project.objective}</p>
          </ProjectSheet>
          ) },

          { id: "architecture", label: "Architecture", node: (
          <ProjectSheet
            id="architecture"
            heading="Architecture"
            sheet="2 of 6"
            variant={identity.stock}
          >
            <p>{project.architecture}</p>

            {hasFigure(project.id) ? (
              <TechnicalDiagram
                figure={identity.figure.label}
                caption={identity.figure.caption}
                description={identity.figure.description}
                width={DIAGRAM_WIDTH}
                height={DIAGRAM_HEIGHT}
              >
                <RecordDiagram project={project.id} />
              </TechnicalDiagram>
            ) : null}
          </ProjectSheet>
          ) },

          { id: "implementation", label: "Implementation", node: (
          <ProjectSheet
            id="implementation"
            heading="Implementation"
            sheet="3 of 6"
            variant={identity.stock}
          >
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
          ) },

          { id: "metrics", label: "Metrics", node: (
          <ProjectSheet
            id="metrics"
            heading="Metrics"
            surface="plain"
            sheet="4 of 6"
          >
            <MetricPanel
              metrics={project.metrics}
              caption={`Measured on ${project.title} — ${project.date}`}
            />
          </ProjectSheet>
          ) },

          { id: "technology", label: "Technology", node: (
          <ProjectSheet
            id="technology"
            heading="Technology"
            sheet="5 of 6"
            variant={identity.stock}
          >
            <ul className={styles.stack}>
              {project.technologies.map((tech) => (
                <li key={tech} className={styles.stackItem}>
                  {tech}
                </li>
              ))}
            </ul>
          </ProjectSheet>
          ) },

          { id: "notes", label: "Field notes", node: (
          <ProjectSheet
            id="notes"
            heading="Field notes"
            sheet="6 of 6"
            variant={identity.stock}
          >
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
          ) },
        ]}
      />

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
      }
    />
  );
}
