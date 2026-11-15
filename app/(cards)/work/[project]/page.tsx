import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { SHOTS } from "@/components/cards/shots";
import { Slam } from "@/components/cards/Slam";
import styles from "@/components/cards/case.module.css";
import base from "@/components/cards/titles.module.css";
import { CASES, NUMERALS, PROJECT_FIELD, getCase, plain, when } from "@/lib/cards/catalog";
import { cardRoute, workRoute } from "@/lib/routes";

const order = (i: number) => ({ "--i": i }) as CSSProperties;

export function generateStaticParams() {
  return CASES.map((p) => ({ project: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ project: string }> }): Promise<Metadata> {
  const { project } = await params;
  const p = getCase(project);
  if (!p) return {};
  /* The root layout's template adds the name: "Strata, case file — Basant Bhushan". */
  return {
    title: `${p.title}, case file`,
    description: plain(p.summary),
    alternates: { canonical: workRoute(p.id) },
    openGraph: { title: `${p.title}: ${p.subtitle}`, description: plain(p.summary) },
  };
}

/**
 * A CASE FILE.
 *
 * One project, opened from its card. It arrives under five bars in the
 * card's own colour (the deck laid them as it left) which sweep off a
 * title card for the project: its numeral, its front page, its name
 * slammed on. Below that the case is set on cream to be read at length, its
 * sections rising in as they are reached, and the next case file waits at
 * the foot. The page is there and live from the first instant; the bars
 * only play over it.
 *
 * Every word is the content file's except the section names.
 */
export default async function CaseFile({ params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  const p = getCase(project);
  if (!p) notFound();
  const index = CASES.findIndex((x) => x.id === p.id);
  const next = CASES[(index + 1) % CASES.length];
  const numeral = NUMERALS[index] ?? String(index + 1);
  const field = base[PROJECT_FIELD[p.id] ?? "mustard"];
  const nextField = base[PROJECT_FIELD[next.id] ?? "mustard"];

  return (
    <div id="main" tabIndex={-1} className={`${styles.page} ${field}`} data-titles="">
      <div className={styles.bars} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((k) => (
          <i key={k} style={{ "--k": k } as CSSProperties} />
        ))}
      </div>

      <header className={styles.top}>
        <Link href={cardRoute(p.id)} className={styles.back}>
          ← All cards
        </Link>
        <span>
          Case file {numeral} of {NUMERALS[CASES.length - 1] ?? CASES.length}
        </span>
        <span className={styles.topDate}>{when(p)}</span>
      </header>

      <section className={styles.hero} aria-labelledby="case-title">
        <p className={styles.numeral} aria-hidden="true">
          {numeral}
        </p>
        <div className={styles.shot}>
          <Image src={SHOTS[p.id]} alt={`${p.title}, its front page`} fill priority sizes="(max-width: 899px) 92vw, 50vw" placeholder="blur" />
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.credit}>
            <span>{when(p)}</span>
            <span>{p.technologies.slice(0, 3).join(" · ")}</span>
          </p>
          <h1 id="case-title" className={styles.title}>
            <Slam text={p.title} />
          </h1>
          <p className={styles.sub}>{p.subtitle}</p>
          <p className={styles.links}>
            {p.github ? (
              <a href={p.github} target="_blank" rel="noreferrer noopener">
                Source ↗
              </a>
            ) : null}
            {p.liveUrl ? (
              <a href={p.liveUrl} target="_blank" rel="noreferrer noopener">
                Live site ↗
              </a>
            ) : null}
          </p>
        </div>
      </section>

      <div className={styles.paper}>
        <p className={`${styles.lede} ${styles.reveal}`}>{plain(p.summary)}</p>

        <section className={styles.story} aria-label="The story">
          <div className={styles.reveal}>
            <h2 className={styles.label}>The problem</h2>
            <p>{plain(p.problem)}</p>
          </div>
          <div className={styles.reveal}>
            <h2 className={styles.label}>The objective</h2>
            <p>{plain(p.objective)}</p>
          </div>
          <div className={styles.reveal}>
            <h2 className={styles.label}>How it is built</h2>
            <p>{plain(p.architecture)}</p>
          </div>
        </section>

        <section className={`${styles.numbers} ${field}`} aria-labelledby="numbers-title">
          <h2 id="numbers-title" className={styles.sectionTitle}>
            By the numbers
          </h2>
          <div className={styles.figures}>
            {p.metrics.map((m, i) => (
              <div key={m.label} className={`${styles.figure} ${styles.reveal}`} style={order(i)}>
                <span className={styles.figureValue}>{m.value}</span>
                <span className={styles.figureUnit}>{m.unit}</span>
                <span className={styles.figureLabel}>{m.label}</span>
              </div>
            ))}
          </div>
          {p.metricsCaption ? <p className={styles.provenance}>{plain(p.metricsCaption)}</p> : null}
          {p.evidence ? (
            <figure className={styles.evidence}>
              <figcaption>{p.evidence.caption}</figcaption>
              <div className={styles.tableWrap}>
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
                    {p.evidence.rows.map((row) => (
                      <tr key={row[0]}>
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
              </div>
              {p.evidence.note ? <p className={styles.provenance}>{plain(p.evidence.note)}</p> : null}
            </figure>
          ) : null}
        </section>

        <section className={styles.block} aria-labelledby="workings-title">
          <h2 id="workings-title" className={styles.sectionTitle}>
            The workings
          </h2>
          <ol className={styles.steps}>
            {p.implementation.map((step, i) => (
              <li key={i} className={styles.reveal}>
                <span className={styles.stepNo}>{String(i + 1).padStart(2, "0")}</span>
                <p>{plain(step)}</p>
              </li>
            ))}
          </ol>
        </section>

        {p.challenges.length ? (
          <section className={styles.block} aria-labelledby="trouble-title">
            <h2 id="trouble-title" className={styles.sectionTitle}>
              Trouble on the trail
            </h2>
            <div className={styles.pairs}>
              {p.challenges.map((c, i) => (
                <article key={i} className={`${styles.pair} ${styles.reveal}`}>
                  <h3 className={styles.label}>The trouble</h3>
                  <p className={styles.trouble}>{plain(c.challenge)}</p>
                  <h3 className={styles.label}>The fix</h3>
                  <p>{plain(c.resolution)}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* The lesson is the author's to give; work in progress may not have one yet. */}
        {p.lessons ? (
          <blockquote className={`${styles.lesson} ${styles.reveal}`}>
            <p>{plain(p.lessons)}</p>
            <cite>The lesson</cite>
          </blockquote>
        ) : null}

        <section className={styles.block} aria-labelledby="featuring-title">
          <h2 id="featuring-title" className={styles.sectionTitle}>
            Featuring
          </h2>
          <ul className={styles.stack}>
            {p.technologies.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      </div>

      <Link href={workRoute(next.id)} className={`${styles.next} ${nextField}`}>
        <span className={styles.nextLabel}>Next case file</span>
        <span className={styles.nextTitle}>{next.title}</span>
        <span className={styles.nextSub}>{next.subtitle}</span>
      </Link>
    </div>
  );
}
