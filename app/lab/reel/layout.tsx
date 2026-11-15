import type { Metadata } from "next";
import { Anton, Old_Standard_TT, Special_Elite, Ultra } from "next/font/google";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Wanted Reel - Lab",
  robots: { index: false, follow: false },
};

/*
  The reel's own four voices, loaded for this route alone (it is a trial of
  a direction, not the site):
    Anton          the bill: names, headlines, numbers, in condensed capitals.
    Ultra          the wood type: WANTED, drop caps, the masthead's weight.
    Old Standard   the column: everything read at length.
    Special Elite  the typewriter: datelines, labels, telegrams.
*/
const bill = Anton({ subsets: ["latin"], weight: "400", variable: "--font-reel-bill", display: "swap" });
const wood = Ultra({ subsets: ["latin"], weight: "400", variable: "--font-reel-wood", display: "swap" });
const text = Old_Standard_TT({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-reel-text",
  display: "swap",
});
const type = Special_Elite({ subsets: ["latin"], weight: "400", variable: "--font-reel-type", display: "swap", preload: false });

export default function ReelLayout({ children }: { children: ReactNode }) {
  return <div className={[bill.variable, wood.variable, text.variable, type.variable].join(" ")}>{children}</div>;
}
