import type { Metadata } from "next";
import Link from "next/link";
import { person } from "@/lib/content/portfolio";
import base from "../page.module.css";
import cards from "../cards/cards.module.css";
import { BoilFilters } from "../Tally";
import { Loader } from "./Loaders";

export const metadata: Metadata = {
  title: "Wanted, the loader - Lab",
  robots: { index: false, follow: false },
};

const OPTIONS = [
  {
    code: "L1",
    variant: "pullback" as const,
    title: "Chalk pull-back",
    note: "Black, then chalk: the camera starts tight on the horse and pulls back to the whole frame as the drawing spreads across the board, then the colour is rubbed in under it and the name arrives. The plainest of the three, and the closest to the chapters' own reveal.",
  },
  {
    code: "L2",
    variant: "iris" as const,
    title: "Iris out",
    note: "The silent western's opening: the picture starts as a small circle round the horse in the dark and the iris opens out across the frame, the image flickering and not quite steady in the gate, while the chalk turns to colour. The most period of the three.",
  },
  {
    code: "L3",
    variant: "tally" as const,
    title: "The tally",
    note: "Held close on the horse in chalk, the lines alive the way a hand-drawn film's are, while a tally is chalked in the corner: one mark for each thing that has really arrived (the type, the opening's drawing and photograph, each chapter's drawing). When the last is in, the camera pulls back and the colour comes. The only one that waits for real loading.",
  },
];

/**
 * WANTED, the loader: three ways for the page to arrive, each starting
 * close on the running horse in chalk and ending on the opening as it
 * stands. For choosing; the one chosen moves into the page itself.
 */
export default function LoadingPage() {
  return (
    <div className={base.world} data-world="">
      <BoilFilters />
      <header className={cards.intro}>
        <p className={cards.kicker}>Lab · Wanted, the loader</p>
        <h1 className={cards.introTitle}>Three ways in</h1>
        <p className={cards.introBody}>
          Each starts close on the horse, drawn in chalk on black, and ends on the opening as the page shows it, in colour
          with the name on it. Play any of them again to watch it from the start.
        </p>
      </header>

      {OPTIONS.map((o) => (
        <section key={o.code} className={cards.option} aria-labelledby={`opt-${o.code}`}>
          <header className={cards.optionHead}>
            <p className={cards.optionCode}>{o.code}</p>
            <div>
              <h3 id={`opt-${o.code}`} className={cards.optionTitle}>
                {o.title}
              </h3>
              <p className={cards.optionNote}>{o.note}</p>
            </div>
          </header>
          <Loader variant={o.variant} name={person.name} role={person.role} />
        </section>
      ))}

      <footer className={cards.outro}>
        <Link href="/lab/wanted">Back to the page</Link>
      </footer>
    </div>
  );
}
