import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { certifications, education, links, ongoing, person, training } from "@/lib/content/portfolio";
import { GATE, RIDER } from "@/components/cards/art/credits";
import gate from "@/components/cards/art/gate.png";
import rider from "@/components/cards/art/rider.png";
import { Deck, type DeckCard } from "@/components/cards/Deck";
import { Gunfire } from "@/components/cards/Gunfire";
import { SHOTS } from "@/components/cards/shots";
import { Slam } from "@/components/cards/Slam";
import { Tumbleweed } from "@/components/cards/Tumbleweed";
import styles from "@/components/cards/titles.module.css";
import { CAST, CASES, NUMERALS, PROJECT_FIELD, plain, when, type Field } from "@/lib/cards/catalog";
import { CARD } from "@/lib/cards/keys";
import { routes, workRoute } from "@/lib/routes";

export const metadata: Metadata = {
  /* The root layout's default title and description are this page's. */
  alternates: { canonical: routes.home },
};

const d = (n: number) => ({ "--d": n }) as CSSProperties;

type Card = DeckCard & { field: Field };
const CARDS: Card[] = [
  { id: CARD.opening, label: person.name, field: "blood" },
  { id: CARD.about, label: "About", field: "black" },
  ...CASES.map((p) => ({ id: p.id, label: p.title, field: PROJECT_FIELD[p.id] ?? "mustard" })),
  { id: CARD.toolbox, label: "Featuring", field: "cream" },
  { id: CARD.record, label: "The record", field: "night" },
  { id: CARD.contact, label: "Send word", field: "blood" },
];
const IDS = CARDS.map((c) => c.id);
const card = (id: string) => {
  const c = CARDS.find((x) => x.id === id)!;
  return { "data-card": c.id, "aria-label": c.label, tabIndex: -1, className: `${styles.card} ${styles[c.field]}` };
};

/* Before first paint: show the card the address names (a case file's way
   back), so the page never shows the first card and then jumps. The deck
   takes over from this once it is running. */
const AT = `try{var h=location.hash.slice(1),ids=${JSON.stringify(IDS)};document.documentElement.dataset.titlesAt=ids.indexOf(h)>-1?h:ids[0]}catch(e){}`;
const AT_CSS = `${IDS.map((id) => `html[data-titles-at="${id}"] [data-card="${id}"]`).join(",")}{visibility:visible}`;
/* Without script there is no deck: the cards are a page, read top to bottom. */
const NO_SCRIPT = `<style>.${styles.deck}{position:static;overflow:visible}.${styles.card}{position:relative;min-height:100svh;visibility:visible}.${styles.intro},.${styles.dots}{display:none}</style>`;

/**
 * THE TITLE CARDS: the site.
 *
 * The portfolio as the opening titles of a sixties western: the name over a
 * rider, an about, a card for each project, the toolbox set as the cast,
 * the record as the credits, and a way to send word. One card at a time,
 * a different wipe at every cut (Deck.tsx owns all of that). Each project
 * card opens onto its case file at /work/[project].
 *
 * Every word is the content file's except the cards' own names.
 */
export default function TitleCards() {
  const resume = links.resumeStatus === "resolved" ? links.resume : null;
  const first = CASES[0];
  /* Work in progress that already has a card of its own is not listed again. */
  const unbilled = ongoing.filter((o) => !CASES.some((c) => c.id === o.id));

  return (
    <div className={styles.deck} data-titles="">
      <script dangerouslySetInnerHTML={{ __html: AT }} />
      <style dangerouslySetInnerHTML={{ __html: AT_CSS }} />
      <noscript dangerouslySetInnerHTML={{ __html: NO_SCRIPT }} />

      <header className={styles.top} data-frame="">
        <a href={`#${CARD.opening}`} className={styles.mark}>
          {person.name}
        </a>
        <ul className={styles.sections} aria-label="Sections">
          <li>
            <a href={`#${CARD.about}`}>About</a>
          </li>
          {first ? (
            <li>
              <a href={`#${first.id}`}>Work</a>
            </li>
          ) : null}
          <li>
            <a href={`#${CARD.toolbox}`}>Toolbox</a>
          </li>
          <li>
            <a href={`#${CARD.record}`}>Record</a>
          </li>
          <li>
            <a href={`#${CARD.contact}`}>Contact</a>
          </li>
          {resume ? (
            <li>
              <a href={resume} target="_blank" rel="noreferrer noopener">
                Résumé ↗
              </a>
            </li>
          ) : null}
          <li>
            <Link href={routes.professional}>Professional</Link>
          </li>
        </ul>
      </header>

      <div>
        {/* I. The name, over a rider. */}
        <section {...card(CARD.opening)}>
          <div className={styles.sil}>
            <div className={styles.silMove}>
              {/* Cover-fitted, so on a screen narrower than the picture's own
                  shape it is drawn by the screen's height: ask for that width. */}
              <Image src={rider} alt="" fill priority sizes="(max-aspect-ratio: 9/16) 57vh, 100vw" />
            </div>
          </div>
          <Tumbleweed />
          <div className={styles.copy}>
            <p className={styles.credit}>
              <span>{person.location}</span>
              <span>{person.role}</span>
            </p>
            <h1 className={`${styles.big} ${styles.name}`}>
              <Slam text={person.name} />
            </h1>
            <p className={styles.line}>{person.tagline}</p>
            <p className={styles.cue}>
              Scroll, swipe or use the arrow keys{" "}
              <span aria-hidden="true">·</span>{" "}
              <Link href={routes.professional} className={styles.plainLink}>
                Or the professional view
              </Link>
            </p>
          </div>
        </section>

        {/* II. About. */}
        <section {...card(CARD.about)}>
          <div className={styles.aboutGrid}>
            <div>
              <h2 className={styles.heading}>
                <Slam text="About" />
              </h2>
              <p className={styles.lead}>{plain(person.summary)}</p>
              <ul className={styles.interests}>
                {person.interests.map((item, i) => (
                  <li key={item} className={styles.rise} style={d(i)}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <ol className={styles.journey}>
              {person.journey.map((step, i) => (
                <li key={step.year} className={styles.rise} style={d(i + 2)}>
                  <span className={styles.year}>{step.year}</span>
                  <span className={styles.stepTitle}>{step.title}</span>
                  <p>{plain(step.body)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* III. A card for each project. */}
        {CASES.map((p, i) => (
          <section key={p.id} {...card(p.id)}>
            <p className={styles.numeral} aria-hidden="true">
              {NUMERALS[i] ?? i + 1}
            </p>
            <div className={styles.shot}>
              <Image src={SHOTS[p.id]} alt={`${p.title}, its front page`} fill sizes="(max-width: 899px) 90vw, 46vw" placeholder="blur" />
            </div>
            <div className={`${styles.copy} ${styles.projectCopy}`}>
              <p className={styles.credit}>
                <span>{when(p)}</span>
                <span>{p.technologies.slice(0, 3).join(" · ")}</span>
              </p>
              <h2 className={styles.big}>
                <Slam text={p.title} />
              </h2>
              <p className={styles.line}>{p.subtitle}</p>
              <p className={styles.summary}>{plain(p.summary)}</p>
              <div className={styles.actions}>
                <Link href={workRoute(p.id)} className={styles.go} data-case="">
                  Read the case file
                </Link>
                {p.github ? (
                  <a href={p.github} className={styles.small} target="_blank" rel="noreferrer noopener">
                    Source ↗
                  </a>
                ) : null}
                {p.liveUrl ? (
                  <a href={p.liveUrl} className={styles.small} target="_blank" rel="noreferrer noopener">
                    Live ↗
                  </a>
                ) : null}
              </div>
            </div>
          </section>
        ))}

        {/* IV. The toolbox, billed like a cast: each name with the pictures it was in. */}
        <section {...card(CARD.toolbox)}>
          <div className={styles.creditsGrid}>
            <h2 className={`${styles.heading} ${styles.creditsHead}`}>
              <Slam text="Featuring" />
            </h2>
            {CAST.map((group, g) => (
              <div key={group.group} className={`${styles.group} ${styles.rise}`} style={d(g)}>
                <h3>{group.group}</h3>
                <ul className={styles.cast}>
                  {group.items.map((item) => (
                    <li key={item.name}>
                      <span className={styles.billed}>{item.name}</span>
                      {item.credits.length ? (
                        <span className={styles.billedIn}>in {item.credits.join(", ")}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* V. The record: schooling, training, certificates, and what is in hand. */}
        <section {...card(CARD.record)}>
          <div className={styles.creditsGrid}>
            <h2 className={`${styles.heading} ${styles.creditsHead}`}>
              <Slam text="The Record" />
            </h2>
            <div className={`${styles.group} ${styles.rise}`} style={d(0)}>
              <h3>Education</h3>
              <ul>
                {education.map((e) => (
                  <li key={e.institution} className={styles.entry}>
                    <span className={styles.billed}>{e.institution}</span>
                    <p>{e.qualification}</p>
                    <span className={styles.when}>
                      {e.place} · {plain(e.period)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${styles.group} ${styles.rise}`} style={d(1)}>
              <h3>Training</h3>
              <ul>
                {training.map((t) => (
                  <li key={t.title} className={styles.entry}>
                    <span className={styles.billed}>{t.title}</span>
                    <p>{t.issuer}</p>
                    <span className={styles.when}>
                      {plain(t.period)}
                      {t.detail ? ` · ${t.detail}` : ""}
                    </span>
                    {t.certificateStatus === "resolved" && t.certificate ? (
                      <a href={t.certificate} className={styles.proof} target="_blank" rel="noreferrer noopener">
                        Certificate ↗
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${styles.group} ${styles.rise}`} style={d(2)}>
              <h3>Certifications</h3>
              <ul>
                {certifications.map((c) => (
                  <li key={c.title} className={styles.entry}>
                    <span className={styles.billed}>{c.title}</span>
                    {c.issuer ? <p>{c.issuer}</p> : null}
                    <span className={styles.when}>{plain(c.period)}</span>
                    {c.certificateStatus === "resolved" && c.certificate ? (
                      <a href={c.certificate} className={styles.proof} target="_blank" rel="noreferrer noopener">
                        Certificate ↗
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
            {unbilled.map((o, i) => (
              <div key={o.id} className={`${styles.group} ${styles.rise}`} style={d(3 + i)}>
                <h3>{o.label}</h3>
                <div className={styles.entry}>
                  <span className={styles.billed}>{o.title}</span>
                  <p>{plain(o.idea)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* VI. Send word, as the gate is shut for the day. */}
        <section {...card(CARD.contact)}>
          <div className={`${styles.sil} ${styles.gate}`}>
            <div className={styles.silMove}>
              <Image src={gate} alt="" fill sizes="(max-aspect-ratio: 36/25) 145vh, 100vw" />
            </div>
          </div>
          <div className={styles.copy}>
            <p className={styles.credit}>
              <span>{person.availability}</span>
              <span>{person.location}</span>
            </p>
            <h2 className={styles.big}>
              <Slam text="Send Word" />
            </h2>
            <a href={`mailto:${links.email}`} className={styles.mail}>
              {links.email}
            </a>
            <div className={styles.actions}>
              <a href={links.github} className={styles.small} target="_blank" rel="noreferrer noopener">
                GitHub ↗
              </a>
              <a href={links.linkedin} className={styles.small} target="_blank" rel="noreferrer noopener">
                LinkedIn ↗
              </a>
              {resume ? (
                <a href={resume} className={styles.small} target="_blank" rel="noreferrer noopener">
                  Résumé ↗
                </a>
              ) : null}
              <Link href={routes.professional} className={styles.small}>
                Professional view
              </Link>
            </div>
            <p className={styles.colophon}>
              The rider: &ldquo;{RIDER.title}&rdquo;, {RIDER.kind} by{" "}
              <a href={RIDER.source} target="_blank" rel="noreferrer noopener">
                {RIDER.artist}
              </a>{" "}
              ({RIDER.licence}). The gate:{" "}
              <a href={GATE.source} target="_blank" rel="noreferrer noopener">
                &ldquo;{GATE.title}&rdquo;
              </a>
              , {GATE.artist}, {GATE.year} ({GATE.licence}).
            </p>
          </div>
        </section>
      </div>

      {/* After the cards, so Tab reaches the card on screen before the dots. */}
      <Deck cards={CARDS.map(({ id, label }) => ({ id, label }))} />
      {/* The fun: a click on an empty part of a card fires at it. */}
      <Gunfire />

      <div className={styles.intro} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((k) => (
          <i key={k} style={{ "--k": k } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}
