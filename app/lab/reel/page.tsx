import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { certifications, coreStack, education, links, ongoing, person, projects, skills, training } from "@/lib/content/portfolio";
import { OPENING } from "../wanted/art";
import portrait from "@/public/portrait/basant.jpg";
import { NUMERALS, SHOTS, plain, reelCase } from "./paths";
import { Press } from "./Press";
import { Stamped } from "./Type";
import styles from "./reel.module.css";

const order = (i: number) => ({ "--i": i }) as CSSProperties;
const titles = Object.fromEntries(projects.map((p) => [p.id, p.title]));

/* Before first paint: a return within the visit skips the projector. */
const SEEN = `try{var k="frontier:reel-seen";if(sessionStorage.getItem(k))document.documentElement.dataset.reelSeen="1";else sessionStorage.setItem(k,"1")}catch(e){}`;

/**
 * WANTED REEL - the front page.
 *
 * A frontier newspaper with film stills set into it: newsprint, wood type
 * and a typewriter for the record, and the cinema (letterbox, grain, gate
 * weave, the projector's countdown) for the moments that move. Everything
 * said is the content file's.
 *
 * Every effect is a transform or an opacity, timed or read off the scroll,
 * so the compositor runs it at the screen's own rate; loops stop off screen;
 * reduced motion gets the finished page.
 */
export default function ReelFront() {
  const [lead] = projects;
  const resume = links.resumeStatus === "resolved" ? links.resume : null;

  return (
    <div className={styles.reel} data-reel="">
      <Press />

      {/* The projector's leader: three, two, one, and the picture. */}
      <div className={styles.projector} data-projector="" aria-hidden="true">
        <div className={styles.leader}>
          <span className={styles.sweep} />
          <span className={styles.crossH} />
          <span className={styles.crossV} />
          <span className={styles.ring} />
          <span className={styles.count}>
            <span>3</span>
            <span>2</span>
            <span>1</span>
          </span>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: SEEN }} />

      <header className={styles.top}>
        <span>{person.location}</span>
        <nav className={styles.topNav} aria-label="Sections">
          <a href="#work">Work</a>
          <a href="#files">Case files</a>
          <a href="#toolbox">Toolbox</a>
          <a href="#record">Record</a>
          <a href="#contact">Contact</a>
          {resume ? (
            <a href={resume} target="_blank" rel="noreferrer noopener">
              Résumé
            </a>
          ) : null}
        </nav>
        <span>{person.availability}</span>
      </header>

      <div className={styles.mast}>
        <h1 className={styles.name}>
          <Stamped text={person.name} />
        </h1>
        <p className={styles.mastSide}>{person.role}</p>
      </div>
      <div className={styles.rule} />

      {/* The front page's picture: a still from the reel, letterboxed, with
          the poster nailed over its corner. */}
      <section className={styles.still} data-loops="" aria-label="Now showing">
        <div className={styles.film}>
          <Image src={OPENING.src} alt="A rider on horseback crossing a dust field at sunset" fill priority sizes="(max-width: 1439px) 100vw, 1312px" className={styles.filmImage} placeholder="blur" />
        </div>
        <span className={styles.shade} aria-hidden="true" />
        <span className={styles.scratch} aria-hidden="true" />
        <span className={`${styles.scratch} ${styles.scratchB}`} aria-hidden="true" />
        <span className={styles.flicker} aria-hidden="true" />
        <span className={`${styles.bar} ${styles.barTop}`} aria-hidden="true" />
        <span className={`${styles.bar} ${styles.barBottom}`} aria-hidden="true" />
        <div className={styles.caption}>
          <p className={styles.kicker}>Now showing</p>
          <p className={styles.tagline}>{person.tagline}</p>
          <p className={styles.actions}>
            <a href="#work" className={styles.button}>
              See the work
            </a>
            <a href="#files" className={styles.buttonGhost}>
              Read the case files
            </a>
          </p>
        </div>
        <figure className={styles.poster}>
          <span className={styles.nail} aria-hidden="true" />
          <div className={styles.posterBody}>
            <p className={styles.posterWanted} aria-hidden="true">
              Wanted
            </p>
            <div className={styles.posterPhoto}>
              <Image src={portrait} alt={`${person.name}, photographed`} fill sizes="300px" placeholder="blur" />
            </div>
            <figcaption>
              <span className={styles.posterName}>{person.name}</span>
              <span className={styles.posterFor}>{person.availability}</span>
            </figcaption>
          </div>
        </figure>
      </section>

      {/* Below the fold of the front page: who, in three columns. */}
      <section className={styles.front} aria-label="About">
        <div className={styles.col} data-enter="">
          <p className={styles.colKicker}>The builder</p>
          <p className={styles.dropCap}>{plain(person.summary)}</p>
        </div>
        <div className={styles.col} data-enter="" style={order(1)}>
          <p className={styles.colKicker}>On the desk</p>
          <ul className={styles.interests}>
            {person.interests.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className={styles.col} data-enter="" style={order(2)}>
          <p className={styles.colKicker}>The road so far</p>
          <ol className={styles.years}>
            {person.journey.map((step) => (
              <li key={step.year}>
                <span className={styles.year}>{step.year}</span>
                <span className={styles.yearTitle}>{step.title}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The wire: the core stack, running. */}
      <div className={styles.wire} data-loops="">
        <span className={styles.wireLabel}>On the wire</span>
        <div className={styles.wireRun}>
          {[0, 1].map((copy) => (
            <ul key={copy} className={styles.wireSet} aria-hidden={copy === 1 ? true : undefined} aria-label={copy === 0 ? "Core stack" : undefined}>
              {coreStack.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* The work, as a strip of film run sideways past the reader: the page
          holds while the strip goes by. */}
      <section id="work" className={styles.work} aria-labelledby="work-title">
        <div className={styles.workPin}>
          <div className={styles.band}>
            <h2 id="work-title" className={styles.bandTitle}>
              The Work
            </h2>
            <span className={styles.bandRule} />
            <span className={styles.bandNote}>{projects.length} reels</span>
          </div>
          <div className={styles.strip}>
            {projects.map((p, i) => (
              <article key={p.id} className={styles.reelCard} style={order(i)}>
                <span className={styles.sprockets} aria-hidden="true" />
                <Link href={reelCase(p.id)} className={styles.reelLink}>
                  <span className={styles.reelShot}>
                    <Image src={SHOTS[p.id]} alt={`${p.title}, its front page`} sizes="(max-width: 899px) 90vw, 560px" placeholder="blur" className={styles.reelSepia} />
                    <Image src={SHOTS[p.id]} alt="" aria-hidden="true" sizes="(max-width: 899px) 90vw, 560px" className={styles.reelColour} />
                  </span>
                  <span className={styles.reelNo}>Reel {String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.reelTitle}>{p.title}</span>
                  <span className={styles.reelSub}>{p.subtitle}</span>
                  <span className={styles.reelMeta}>
                    {plain(p.date)} · {p.technologies.slice(0, 3).join(", ")}
                  </span>
                  <span className={styles.reelCta}>Read the case file</span>
                </Link>
                <span className={styles.sprockets} aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* The case files: the lead story set as a front-page feature, the
          others filed under it. */}
      <section id="files" className={styles.files} aria-labelledby="files-title">
        <div className={styles.band} data-enter="">
          <h2 id="files-title" className={styles.bandTitle}>
            Case Files
          </h2>
          <span className={styles.bandRule} />
        </div>
        <div className={styles.feature}>
          <div className={styles.featureDark} data-enter="">
            <p className={styles.featureNo}>Case file {NUMERALS[0]}</p>
            <h3 className={styles.featureTitle}>{lead.title}</h3>
            <p className={styles.featureDate}>{plain(lead.date)}</p>
            {lead.metrics.map((m, i) => (
              <div key={m.label} className={styles.figure} style={order(i)}>
                <span className={styles.figureValue}>{m.value}</span>
                <span className={styles.figureLabel}>
                  {m.unit} - {m.label}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.featurePaper} data-enter="">
            <p className={styles.storyHead}>
              <span>The full story</span>
              <span>Page 2</span>
            </p>
            <div className={styles.storyCols}>
              <h4>The problem</h4>
              <p className={styles.dropCap}>{lead.problem}</p>
              <h4>The objective</h4>
              <p>{plain(lead.objective)}</p>
              <h4>The lesson</h4>
              <p>{plain(lead.lessons)}</p>
            </div>
            <Link href={reelCase(lead.id)} className={styles.readOn}>
              Read the full case file
            </Link>
          </div>
        </div>
        <ol className={styles.fileList}>
          {projects.map((p, i) => (
            <li key={p.id} data-enter="" style={order(i)}>
              <Link href={reelCase(p.id)} className={styles.fileRow}>
                <span className={styles.fileNo}>{NUMERALS[i]}</span>
                <span className={styles.fileTitle}>{p.title}</span>
                <span className={styles.fileSummary}>{p.summary}</span>
                <span className={styles.fileGo} aria-hidden="true">
                  Read
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* The toolbox: the type case, each sort and what it set. */}
      <section id="toolbox" className={styles.toolbox} aria-labelledby="toolbox-title">
        <div className={styles.band} data-enter="">
          <h2 id="toolbox-title" className={styles.bandTitle}>
            The Toolbox
          </h2>
          <span className={styles.bandRule} />
        </div>
        <div className={styles.cases}>
          {skills.map((group, g) => (
            <div key={group.group} className={styles.typeCase} data-enter="" style={order(g)}>
              <h3 className={styles.caseName}>{group.group}</h3>
              <ul>
                {group.items.map((item, i) => (
                  <li key={item.name} style={order(i)}>
                    <span className={styles.skill}>{item.name}</span>
                    <span className={styles.dots} aria-hidden="true" />
                    <span className={styles.used}>{item.projects.length ? item.projects.map((id) => titles[id]).join(", ") : "-"}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* The record: schooling, training and certificates, as telegrams. */}
      <section id="record" className={styles.record} aria-labelledby="record-title">
        <div className={styles.band} data-enter="">
          <h2 id="record-title" className={styles.bandTitle}>
            The Record
          </h2>
          <span className={styles.bandRule} />
        </div>
        <div className={styles.telegrams}>
          {education.map((e, i) => (
            <article key={e.qualification} className={styles.telegram} data-enter="" style={order(i)}>
              <p className={styles.telegramHead}>Schooling</p>
              <h3>{e.qualification}</h3>
              <p>
                {e.institution}, {e.place}
              </p>
              <p className={styles.telegramDate}>{plain(e.period)}</p>
              <span className={styles.received} aria-hidden="true">
                {e.current ? "In progress" : "Received"}
              </span>
            </article>
          ))}
          {training.map((t, i) => (
            <article key={t.title} className={styles.telegram} data-enter="" style={order(i + 2)}>
              <p className={styles.telegramHead}>Training</p>
              <h3>{t.title}</h3>
              <p>{t.issuer}</p>
              <p className={styles.telegramDate}>{plain(t.period)}</p>
              {t.certificate ? (
                <a href={t.certificate} target="_blank" rel="noreferrer noopener" className={styles.proof}>
                  See the certificate
                </a>
              ) : null}
              <span className={styles.received} aria-hidden="true">
                Received
              </span>
            </article>
          ))}
          {certifications.map((c, i) => (
            <article key={c.title} className={styles.telegram} data-enter="" style={order(i + 3)}>
              <p className={styles.telegramHead}>Certificate</p>
              <h3>{c.title}</h3>
              <p className={styles.telegramDate}>{plain(c.period)}</p>
              {c.certificate ? (
                <a href={c.certificate} target="_blank" rel="noreferrer noopener" className={styles.proof}>
                  See the certificate
                </a>
              ) : null}
              <span className={styles.received} aria-hidden="true">
                Received
              </span>
            </article>
          ))}
        </div>
        {ongoing.map((o) => (
          <aside key={o.id} className={styles.coming} data-enter="">
            <p className={styles.comingLabel}>{o.label}</p>
            <h3 className={styles.comingTitle}>{o.title}</h3>
            <p>{o.idea}</p>
          </aside>
        ))}
      </section>

      <section id="contact" className={styles.contact} aria-labelledby="contact-title">
        <div className={styles.rule} />
        <div className={styles.contactGrid} data-enter="">
          <h2 id="contact-title" className={styles.sendWord}>
            Send Word
          </h2>
          <div className={styles.contactSide}>
            <p className={styles.kicker}>{person.availability}</p>
            <a href={`mailto:${links.email}`} className={styles.email}>
              {links.email}
            </a>
            <p className={styles.contactLinks}>
              <a href={links.github} target="_blank" rel="noreferrer noopener">
                GitHub
              </a>
              <a href={links.linkedin} target="_blank" rel="noreferrer noopener">
                LinkedIn
              </a>
              {resume ? (
                <a href={resume} target="_blank" rel="noreferrer noopener">
                  Résumé
                </a>
              ) : null}
            </p>
          </div>
          <span className={styles.postmark} aria-hidden="true">
            {person.location}
          </span>
        </div>
        <p className={styles.colophon}>
          Opening photograph:{" "}
          <a href={OPENING.source} target="_blank" rel="noreferrer noopener">
            {OPENING.artist}, Unsplash
          </a>
          . Prototype, not on the live site.
        </p>
      </section>
    </div>
  );
}
