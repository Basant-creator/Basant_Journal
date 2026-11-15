import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { getProject, projects } from "@/lib/content/portfolio";
import { NUMERALS, SHOTS, plain, reelCase, reelHome } from "../paths";
import { Press } from "../Press";
import { Stamped } from "../Type";
import base from "../reel.module.css";
import styles from "./case.module.css";

const order = (i: number) => ({ "--i": i }) as CSSProperties;

export function generateStaticParams() {
  return projects.map((p) => ({ project: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ project: string }> }): Promise<Metadata> {
  const { project } = await params;
  const p = getProject(project);
  return { title: p ? `${p.title} - Wanted Reel - Lab` : "Wanted Reel - Lab", robots: { index: false, follow: false } };
}

/**
 * WANTED REEL - a case file.
 *
 * One project, set as the paper's full story: the headline pressed on a
 * letter at a time, the project's own front page run as a film still that
 * develops into colour as it is scrolled past, the problem and the plan in
 * columns, the figures stamped on the dark, the trouble and the fix, the
 * lesson as the pull quote, and the next reel at the foot.
 *
 * It opens with a burn through the frame, the way a reel changes over; the
 * page under it is there and live from the first instant. Every word is
 * the content file's.
 */
export default async function CaseFile({ params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  const p = getProject(project);
  if (!p) notFound();
  const index = projects.findIndex((x) => x.id === p.id);
  const next = projects[(index + 1) % projects.length];
  const numeral = NUMERALS[index] ?? String(index + 1);

  return (
    <div className={`${base.reel} ${styles.caseReel}`} data-reel="">
      <Press />
      <div className={styles.burn} aria-hidden="true" />

      <header className={base.top}>
        <Link href={reelHome} className={styles.back}>
          The front page
        </Link>
        <span>Case file {numeral}</span>
        <span>{plain(p.date)}</span>
      </header>

      <div className={styles.head}>
        <p className={styles.kicker}>
          Case file {numeral} of {NUMERALS[projects.length - 1]}
        </p>
        <h1 className={styles.title}>
          <Stamped text={p.title} />
        </h1>
        <p className={styles.sub}>{p.subtitle}</p>
        <p className={styles.dateline}>
          <span>{plain(p.date)}</span>
          {p.github ? (
            <a href={p.github} target="_blank" rel="noreferrer noopener">
              Source
            </a>
          ) : null}
          {p.liveUrl ? (
            <a href={p.liveUrl} target="_blank" rel="noreferrer noopener">
              Live site
            </a>
          ) : null}
        </p>
      </div>
      <div className={base.rule} />

      {/* The project's own front page, as a still that develops as it is
          read past: sepia at the edges of the scroll, colour in the middle. */}
      <section className={styles.lead} data-loops="" aria-label={`${p.title}, its front page`}>
        <div className={styles.leadFilm}>
          <Image src={SHOTS[p.id]} alt={`${p.title}, its front page`} fill priority sizes="(max-width: 1439px) 100vw, 1312px" placeholder="blur" className={styles.leadSepia} />
          <Image src={SHOTS[p.id]} alt="" aria-hidden="true" fill sizes="(max-width: 1439px) 100vw, 1312px" className={styles.leadColour} />
        </div>
        <span className={base.scratch} aria-hidden="true" />
        <span className={`${base.scratch} ${base.scratchB}`} aria-hidden="true" />
        <span className={base.flicker} aria-hidden="true" />
        <span className={`${base.bar} ${base.barTop}`} aria-hidden="true" />
        <span className={`${base.bar} ${base.barBottom}`} aria-hidden="true" />
      </section>

      <p className={styles.lede} data-enter="">
        {plain(p.summary)}
      </p>

      <section className={styles.article} aria-label="The story">
        <div className={styles.story} data-enter="">
          <h2>The problem</h2>
          <p className={base.dropCap}>{plain(p.problem)}</p>
          <h2>The objective</h2>
          <p>{plain(p.objective)}</p>
          <h2>How it is built</h2>
          <p>{plain(p.architecture)}</p>
        </div>
      </section>

      <section className={styles.numbers} aria-labelledby="numbers-title">
        <div className={styles.numbersHead} data-enter="">
          <h2 id="numbers-title" className={styles.numbersTitle}>
            By the numbers
          </h2>
        </div>
        <div className={styles.figures} data-enter="">
          {p.metrics.map((m, i) => (
            <div key={m.label} className={styles.figure} style={order(i)}>
              <span className={styles.figureValue}>{m.value}</span>
              <span className={styles.figureUnit}>{m.unit}</span>
              <span className={styles.figureLabel}>{m.label}</span>
            </div>
          ))}
        </div>
        {p.metricsCaption ? <p className={styles.provenance}>{plain(p.metricsCaption)}</p> : null}
        {p.evidence ? (
          <figure className={styles.evidence} data-enter="">
            <figcaption>{p.evidence.caption}</figcaption>
            <table>
              <thead>
                <tr>
                  {p.evidence.columns.map((c) => (
                    <th key={c} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.evidence.rows.map((row, i) => (
                  <tr key={row[0]} style={order(i)}>
                    {row.map((cell, j) =>
                      j === 0 ? (
                        <th key={j} scope="row">
                          {cell}
                        </th>
                      ) : (
                        <td key={j}>{cell}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {p.evidence.note ? <p className={styles.note}>{plain(p.evidence.note)}</p> : null}
          </figure>
        ) : null}
      </section>

      <section className={styles.built} aria-labelledby="built-title">
        <div className={base.band} data-enter="">
          <h2 id="built-title" className={base.bandTitle}>
            The workings
          </h2>
          <span className={base.bandRule} />
        </div>
        <ol className={styles.steps}>
          {p.implementation.map((step, i) => (
            <li key={i} data-enter="" style={order(i)}>
              <span className={styles.stepNo}>{String(i + 1).padStart(2, "0")}</span>
              <p>{plain(step)}</p>
            </li>
          ))}
        </ol>
      </section>

      {p.challenges.length ? (
        <section className={styles.trouble} aria-labelledby="trouble-title">
          <div className={base.band} data-enter="">
            <h2 id="trouble-title" className={base.bandTitle}>
              Trouble on the trail
            </h2>
            <span className={base.bandRule} />
          </div>
          <div className={styles.pairs}>
            {p.challenges.map((c, i) => (
              <article key={i} className={styles.pair} data-enter="" style={order(i)}>
                <p className={styles.pairLabel}>The trouble</p>
                <p className={styles.pairTrouble}>{plain(c.challenge)}</p>
                <p className={styles.pairLabel}>The fix</p>
                <p>{plain(c.resolution)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <blockquote className={styles.lesson} data-enter="">
        <p>{plain(p.lessons)}</p>
        <cite>The lesson</cite>
      </blockquote>

      <section className={styles.stack} aria-labelledby="stack-title" data-enter="">
        <h2 id="stack-title" className={styles.stackTitle}>
          Armed with
        </h2>
        <ul>
          {p.technologies.map((t, i) => (
            <li key={t} style={order(i)}>
              {t}
            </li>
          ))}
        </ul>
      </section>

      <Link href={reelCase(next.id)} className={styles.next}>
        <span className={styles.nextShot} aria-hidden="true">
          <Image src={SHOTS[next.id]} alt="" sizes="(max-width: 899px) 100vw, 50vw" />
        </span>
        <span className={styles.nextLabel}>Next reel</span>
        <span className={styles.nextTitle}>{next.title}</span>
        <span className={styles.nextSub}>{next.subtitle}</span>
      </Link>
    </div>
  );
}
