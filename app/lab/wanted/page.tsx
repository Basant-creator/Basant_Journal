import { statSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { routes } from "@/lib/routes";
import { coreStack, links, metrics, ongoing, person, projects, skills } from "@/lib/content/portfolio";
import { OPENING } from "./art";
import bobai from "@/public/work/bobai.jpg";
import onsight from "@/public/work/onsight.jpg";
import tuneit from "@/public/work/tuneit.jpg";
import portrait from "@/public/portrait/basant.jpg";
import { Chapter } from "./Chapter";
import { Address } from "./Address";
import { CardTable } from "./cards/CardTable";
import { ChalkTally } from "./cards/ChalkTally";
import { journeyTrail } from "./cards/journey";
import { wound } from "./ink";
import { Journey } from "./Journey";
import { Masthead } from "./Masthead";
import { Opening } from "./Opening";
import { Lantern } from "./Lantern";
import { Rule, Split } from "./Partition";
import { Ride } from "./Ride";
import { Stage } from "./Stage";
import { Ticker } from "./Ticker";
import { Tilt } from "./Tilt";
import { Wall } from "./Wall";
import { WorkIndex } from "./WorkIndex";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Wanted - Lab",
  robots: { index: false, follow: false },
};

/*
  Type is the site's own three voices, nothing loaded for this route alone:
    Fell (--font-display)       names: the wordmark, chapters, headings.
    Source Serif (--font-editorial)  everything read at length.
    Archivo (--font-ui)         the margin: labels, dates, controls, in
                                spaced capitals.
*/

const TRAIL = journeyTrail();
const POSTER_HOLE = wound("wanted-poster-hole", 200, 11, 58);
const shipped = metrics.find((metric) => metric.id === "systems");
/* Imported, not named by path: each brings its own size and a few bytes of
   blurred placeholder, so its box is reserved and it sharpens into place. */
const WORK_IMAGES: Record<string, StaticImageData> = { tuneit, onsight, bobai };

/* What the résumé link opens, said before it is opened: its format and
   size, read off the file itself when the page is built. */
function fileNote(href: string): string | null {
  if (!href.startsWith("/")) return null;
  try {
    const kb = Math.max(1, Math.round(statSync(join(process.cwd(), "public", href)).size / 1024));
    const kind = href.split(".").pop()?.toUpperCase();
    return kind ? `${kind}, ${kb} kB` : `${kb} kB`;
  } catch {
    return null;
  }
}

/* The content file sets ranges and asides with long dashes; this page sets
   them with a plain hyphen. Punctuation only: the words are the file's. */
const plain = (s: string) => s.replace(/\s*[—–]\s*/g, " - ");

/* The summary's second sentence leads the about section; its first, and
   the rest of the second, follow it. Split on the file's own dash. */
function aboutCopy() {
  const [first, ...rest] = person.summary.split(/(?<=\.)\s+/);
  const second = rest.join(" ");
  const [lead, tail] = second.split(/\s*[—–]\s*/);
  if (!lead || !tail) return { headline: null, body: plain(person.summary) };
  /* Hyphens in the headline do not break: "backend-heavy" is one word. */
  return {
    headline: `${lead.replace(/\.$/, "").replace(/-/g, "‑")}.`,
    body: `${tail.charAt(0).toUpperCase()}${tail.slice(1)} ${first}`,
  };
}
const ABOUT = aboutCopy();

/* The name a word to a line, as the opening sets it. */
const NAME_WORDS = person.name.split(/\s+/);

const order = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * WANTED - a trial of a different direction, not part of the site.
 *
 * Opens on a photograph: a rider crossing a dust field into the sun, in
 * letterbox, the camera's motion and the air laid over it. Then four
 * chapters, each headed by a painting of the period, the same four places
 * the map walks: Camp (who), Journey (how he got here), Work (what he has
 * built), Contact.
 *
 * Everything said is the content model's own. It covers the lab's bar on
 * purpose, so it can be judged as the site would be.
 */
export default function WantedPage() {
  const resume = links.resumeStatus === "resolved" ? links.resume : null;
  const resumeNote = resume ? fileNote(resume) : null;
  const work = projects.map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: p.subtitle,
    date: plain(p.date),
    route: p.route,
    liveUrl: p.liveUrl,
    stack: p.technologies.slice(0, 3).join(", "),
    image: WORK_IMAGES[p.id] ?? tuneit,
  }));
  return (
    <div className={styles.world} data-world="">
      <Stage />
      <Ride />
      <Lantern />
      {/* Named once, described by every link that opens a new tab. */}
      <span id="new-tab" hidden>
        Opens in a new tab
      </span>
      <Masthead resume={resume} name={person.name} place={person.location} />

      {/* The top is the opening, not the world: the world is what scrolls,
        and an anchor on a scroller is one nothing can scroll to. */}
      <div id="top" data-opening="">
        <Opening
          title={
            <h1 className={styles.name} data-arrive="" style={order(1)} tabIndex={-1}>
              {NAME_WORDS.map((word) => (
                <span key={word}>{word}</span>
              ))}
            </h1>
          }
        >
          <p className={styles.kicker} data-arrive="" style={order(0)}>
            {person.role}
          </p>
          <div className={styles.heroBelow} data-arrive="" style={order(2)}>
            <p className={styles.role}>{person.tagline}</p>
            <div className={styles.heroActions}>
              <a href="#camp" className={styles.primary}>
                Enter the portfolio
              </a>
              <a href="#work" className={styles.secondary}>
                See the work
              </a>
            </div>
          </div>
        </Opening>
      </div>

      <Chapter id="camp" wide>
        <Rule label="Who" index="I · 01" />
        <div className={styles.about}>
          <Tilt className={styles.posterWrap}>
            <article className={styles.poster} aria-label={`Wanted poster for ${person.name}`}>
              <span className={styles.nail} data-corner="tl" aria-hidden="true" />
              <span className={styles.nail} data-corner="tr" aria-hidden="true" />
              <p className={styles.wanted} aria-hidden="true">
                Wanted
              </p>
              <p className={styles.terms}>{person.availability}</p>
              <div className={styles.likeness}>
                <div className={styles.halftone}>
                  <Image
                    src={portrait}
                    alt={`${person.name}, photographed`}
                    fill
                    sizes="(max-width: 899px) 80vw, 360px"
                    placeholder="blur"
                    className={styles.photo}
                  />
                </div>
                <span className={styles.sepia} aria-hidden="true" />
                {shipped ? (
                  <p className={styles.stamp}>
                    {shipped.value} {shipped.unit}
                    <span>shipped</span>
                  </p>
                ) : null}
              </div>
              <p className={styles.posterName}>{person.name}</p>
              <dl className={styles.particulars}>
                <div>
                  <dt>Last seen</dt>
                  <dd>{person.location}</dd>
                </div>
                <div>
                  <dt>Armed with</dt>
                  <dd>{coreStack.slice(0, 5).join(", ")}</dd>
                </div>
              </dl>
              <svg className={styles.hole} viewBox="0 0 200 200" aria-hidden="true">
                <circle cx={100} cy={100} r={34} fill="var(--west-parchment-deep)" />
                {POSTER_HOLE.cracks.map((points) => (
                  <polyline
                    key={points}
                    points={points}
                    fill="none"
                    stroke="var(--west-ink)"
                    strokeWidth={1.6}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ))}
                <polygon points={POSTER_HOLE.flap} fill="var(--west-parchment)" stroke="var(--west-ink)" strokeWidth={1.5} />
                <polygon points={POSTER_HOLE.rim} fill="var(--west-ink)" />
              </svg>
            </article>
          </Tilt>

          <div className={styles.aboutText}>
            <Split as="h3" className={styles.headline} text={ABOUT.headline ?? person.tagline} />
            <p className={`${styles.body} ${styles.reveal}`} data-enter="">
              {ABOUT.body}
            </p>
          </div>
        </div>

        <Rule label="At the table" index="I · 02" />
        <Split as="h3" className={styles.subhead} text="Interests" />
        <CardTable
          writings={person.interests.map((text, i) => ({ head: `Interest ${["I", "II", "III", "IV"][i] ?? i + 1}`, text }))}
        />
        <Ticker items={coreStack} label="Core stack" />
      </Chapter>

      <Chapter id="journey" wide mark={`${person.journey[0].year} - ${person.journey[person.journey.length - 1].year}`}>
        <Rule label="On the trail" index="II · 01" />
        <Journey trail={TRAIL} />
      </Chapter>

      <Chapter id="work" wide>
        <Rule label="The index" index="III · 01" />
        <Wall items={work} />
        <WorkIndex items={work} />

        {ongoing.length ? (
          <div className={styles.ongoing}>
            {ongoing.map((o) => (
              <div key={o.id} className={styles.reveal} data-enter="">
                <p className={styles.ongoingLabel}>{o.label}</p>
                <h3 className={styles.ongoingTitle}>{o.title}</h3>
                <p className={styles.body}>{o.idea}</p>
              </div>
            ))}
          </div>
        ) : null}

        <Rule label="On the board" index="III · 02" />
        <Split as="h3" className={styles.subhead} text="Tools I reach for" />
        <ChalkTally groups={skills} titles={Object.fromEntries(projects.map((p) => [p.id, p.title]))} />
      </Chapter>

      <Chapter id="contact" paper>
        <Rule label="Send word" index="IV · 01" />
        <Split as="p" className={styles.contactLine} text={`${person.availability}.`} />
        <Address email={links.email} className={styles.reveal} />
        <p className={`${styles.contactLinks} ${styles.reveal}`} data-enter="">
          <a href={links.github} target="_blank" rel="noreferrer noopener" className={styles.inkLink} aria-describedby="new-tab">
            GitHub
          </a>
          <a href={links.linkedin} target="_blank" rel="noreferrer noopener" className={styles.inkLink} aria-describedby="new-tab">
            LinkedIn
          </a>
          {resume ? (
            <a href={resume} target="_blank" rel="noreferrer noopener" className={styles.inkLink} aria-describedby="new-tab">
              Résumé{resumeNote ? <span className={styles.fileNote}> ({resumeNote})</span> : null}
            </a>
          ) : null}
          <Link href={routes.professional} className={styles.inkLink}>
            Professional view
          </Link>
        </p>
        <footer className={styles.foot}>
          <p>
            Opening photograph:{" "}
            <a href={OPENING.source} target="_blank" rel="noreferrer noopener" className={styles.inkLink} aria-describedby="new-tab">
              {OPENING.artist}, Unsplash
            </a>
            . Chapter plates: public-domain paintings by Frederic Remington and Charles M. Russell.
          </p>
          <p>
            Prototype, not on the live site.{" "}
            <Link href="/lab/scene" className={styles.inkLink}>
              Back to the lab
            </Link>
          </p>
        </footer>
      </Chapter>
    </div>
  );
}
