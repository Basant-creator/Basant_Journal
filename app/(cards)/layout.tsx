import type { Metadata } from "next";
import { Anton, Libre_Caslon_Text, Oswald } from "next/font/google";
import type { ReactNode } from "react";

/* Indexable: this is the site. The root layout holds the name, the
   description and the share card; the cards add only what is theirs. */
export const metadata: Metadata = {};

/*
  The title cards' three voices, loaded for the cards' pages:
    Anton          the title: names, project titles, figures, in capitals.
    Oswald         the credit line: dates, labels, the small spaced capitals.
    Libre Caslon   the line read at length, and the italic under a title.
*/
const display = Anton({ subsets: ["latin"], weight: "400", variable: "--font-titles-display", display: "swap" });
const credit = Oswald({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-titles-credit", display: "swap" });
const text = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-titles-text",
  display: "swap",
});

export default function CardsLayout({ children }: { children: ReactNode }) {
  return <div className={[display.variable, credit.variable, text.variable].join(" ")}>{children}</div>;
}
