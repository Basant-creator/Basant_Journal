import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { certifications, education, person, projects, skills, training } from "@/lib/content/portfolio";
import base from "../page.module.css";
import { CardTable } from "./CardTable";
import { ChalkTally } from "./ChalkTally";
import { Deeds, type Deed } from "./Deeds";
import { Envelopes } from "./Envelopes";
import { Journal } from "./Journal";
import { NoticeBoard } from "./NoticeBoard";
import { TicketCounter } from "./TicketCounter";
import { Typewriter } from "./Typewriter";
import styles from "./cards.module.css";
import { journeyTrail, when } from "./journey";
import { TrailScene } from "./TrailScene";

export const metadata: Metadata = {
  title: "Wanted, the cards - Lab",
  robots: { index: false, follow: false },
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const plain = (s: string) => s.replace(/\s*[—–]\s*/g, " - ");
const LEGS = ["Leg I", "Leg II", "Leg III", "Leg IV"];

const TRAIL = journeyTrail();

/* Telegrams end their sentences in STOP. Punctuation only: the words are
   the content file's. */
const wire = (s: string) => plain(s).replace(/\.(\s|$)/g, " STOP$1").trim();

function Option({ code, title, note, children }: { code: string; title: string; note: string; children: React.ReactNode }) {
  return (
    <section className={styles.option} aria-labelledby={`opt-${code}`}>
      <header className={styles.optionHead}>
        <p className={styles.optionCode}>{code}</p>
        <div>
          <h3 id={`opt-${code}`} className={styles.optionTitle}>
            {title}
          </h3>
          <p className={styles.optionNote}>{note}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

/**
 * WANTED, the cards: the same record (journey, skills, papers, interests)
 * set nine ways, each a thing the frontier actually used to carry words,
 * for choosing one of each. Every word on them is the content file's.
 */
export default function CardsPage() {
  const projectTitles = Object.fromEntries(projects.map((p) => [p.id, p.title]));
  const deeds: Deed[] = [
    ...certifications.map((c) => ({ title: c.title, by: c.issuer, period: plain(c.period), kind: "Certificate", proof: c.certificateStatus === "resolved" ? c.certificate : null, detail: null })),
    ...training.map((t) => ({ title: t.title, by: t.issuer, period: plain(t.period), kind: "Training", proof: t.certificateStatus === "resolved" ? t.certificate : null, detail: t.detail ?? null })),
    ...education.map((e) => ({ title: e.qualification, by: `${e.institution}, ${e.place}`, period: plain(e.period), kind: "Schooling", proof: null, detail: e.showDetailInCreativeView ? e.detail : null })),
  ];

  return (
    <div className={base.world} data-world="">
      <header className={styles.intro}>
        <p className={styles.kicker}>Lab · Wanted, the cards</p>
        <h1 className={styles.introTitle}>Nine ways to carry the record</h1>
        <p className={styles.introBody}>
          The journey, the tools, the papers and the interests, each set as something the frontier actually carried words
          on. Everything here is live and uses your real content. Pick one of each (or mix), and it replaces the plain lists
          on the page.
        </p>
      </header>

      {/* ------------------------------------------------------------ JOURNEY */}
      <h2 className={styles.group}>The journey</h2>

      <Option code="J1" title="The trail" note="The journey walked across open country at dusk: the trail drawn on the ground as you scroll, camps and waypoints standing up off it as the line reaches them, hills paling into the haze behind. Once it is drawn, someone walks it. Move the pointer and the country moves at its own depths. On a phone the trail runs away from you, a road into the distance.">
        <TrailScene trail={TRAIL} />
        <ol className={styles.trailNotes}>
          {person.journey.map((leg) => (
            <li key={leg.year}>
              <span className={styles.trailYear}>{leg.year}</span>
              <span className={styles.trailName}>{leg.title}</span>
              <p>{plain(leg.body)}</p>
            </li>
          ))}
        </ol>
      </Option>

      <Option code="J2" title="The ticket window" note="A station booth in a plank wall, its window barred and lit from inside. When it comes into view the clerk issues a ticket for each leg, slid out one at a time through the slot under the glass onto the counter. Tap a ticket to pick it up and turn it over.">
        <TicketCounter tickets={person.journey.map((leg, i) => ({ year: leg.year, title: leg.title, body: plain(leg.body), leg: LEGS[i] ?? `Leg ${i + 1}` }))} />
      </Option>

      <Option code="J3" title="Telegrams" note="Each year wired home and delivered in its envelope, laid on a desk under the lamp. They are opened in turn as you arrive: the flap lifts and the form is drawn up out of it. Tap an envelope to slide its telegram back in, or out again.">
        <Envelopes
          wires={person.journey.map((leg, i) => ({ no: String(i + 1).padStart(3, "0"), year: leg.year, re: leg.title, body: wire(leg.body), sign: person.shortName }))}
        />
      </Option>

      {/* ------------------------------------------------------------- SKILLS */}
      <h2 className={styles.group}>The tools</h2>

      <Option code="S1" title="The notice board" note="Bills on a frontier store's board: planks gone grey and rotten at the foot, rust run down from every nail, and each kind of tool on its own torn, foxed and stained bill, nailed over the scraps of older ones. Dots count the projects that used a tool; one no project has used yet is printed faint.">
        <NoticeBoard groups={skills} />
      </Option>

      <Option code="S2" title="The typewriter" note="A fresh sheet in the machine. Choose a project (or everything) and its tools are typed out a key at a time: the carriage steps with every letter, the bell rings at the end of a line and the paper feeds up. Choosing again pulls the sheet and types a new one; click the sheet to have it typed at once. With sound on, you hear it.">
        <Typewriter groups={skills} projects={projects.map((p) => ({ id: p.id, title: p.title }))} />
      </Option>

      <Option code="S3" title="The tab" note="The slate behind the bar, where the tab was kept: each kind of tool chalked up under its own heading, every tool against the projects that ran it up, with a tally. It is chalked up line by line as you come to it.">
        <ChalkTally groups={skills} titles={projectTitles} />
      </Option>

      {/* ------------------------------------------------------------- PAPERS */}
      <h2 className={styles.group}>The papers</h2>

      <Option code="P1" title="The papers" note="Each certificate and qualification on its own aged, deckle-edged sheet, kept in a stack on the desk under the lamp and tied with a ribbon. Bring one to the top with its tab; anything with proof carries a seal that opens it.">
        <Deeds deeds={deeds} />
      </Option>

      <Option code="P2" title="The journal" note="A leather-bound journal on the desk, stitched, brass on the corners, its gilt worn thin and a strap buckled across it. When you reach it the strap is let go, the cover swings open, and the entries are written onto the ruled pages in ink: schooling on the left, certificates and training on the right.">
        <Journal
          owner={person.name}
          left={education.map((e) => ({ date: plain(e.period), title: e.qualification, by: `${e.institution}, ${e.place}`, proof: null, detail: e.showDetailInCreativeView ? e.detail : null }))}
          right={[...training, ...certifications]
            .map((t) => ({
              date: plain(t.period),
              title: t.title,
              by: t.issuer,
              proof: t.certificateStatus === "resolved" ? t.certificate : null,
              detail: "detail" in t && typeof t.detail === "string" ? t.detail : null,
            }))
            .sort((x, y) => when(x.date) - when(y.date))}
        />
      </Option>

      {/* ---------------------------------------------------------- INTERESTS */}
      <h2 className={styles.group}>The interests</h2>

      <Option code="I1" title="The card table" note="A back room under one lamp. The deck is riffled in the middle of the table and dealt round to three players, a fresh hand every deal. Pick a card up to turn it over: on its back is one of the interests, or where to find you. With sound on, you hear the cards.">
        <CardTable
          writings={[
            ...person.interests.map((text, i) => ({ head: `Interest ${["I", "II", "III", "IV", "V", "VI"][i]}`, text })),
            { head: "Availability", text: person.availability },
            { head: "Based in", text: person.location },
          ]}
        />
      </Option>

      <footer className={styles.outro}>
        <Link href="/lab/wanted">Back to the page</Link>
      </footer>
    </div>
  );
}
