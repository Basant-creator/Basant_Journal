import type { Metadata, Viewport } from "next";
import { Anton, Libre_Caslon_Text, Oswald } from "next/font/google";
import { SkipLink } from "@/components/cards/SkipLink";
import { person } from "@/lib/content/portfolio";
import { SITE_ORIGIN } from "@/lib/routes";
import "./globals.css";

/*
  The site's three voices, self-hosted through next/font (no render-blocking
  third-party request, no layout shift), each read through a variable:
    Anton          names, titles and figures, in condensed capitals.
    Oswald         the credit line: dates, labels, the small spaced capitals.
    Libre Caslon   everything read at length, and the italic under a title.
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

/* The name, the role and the tagline, all the content file's. */
const TITLE = `${person.name} — ${person.role}`;
const DESCRIPTION = person.tagline;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: TITLE,
    template: `%s — ${person.name}`,
  },
  description: DESCRIPTION,
  applicationName: person.name,
  authors: [{ name: person.name }],
  creator: person.name,
  keywords: ["Basant Bhushan", "software developer", "portfolio", "TypeScript", "Next.js", "Node.js", "algorithms"],
  openGraph: {
    type: "website",
    siteName: person.name,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  /* --titles-black: the ground every card is cut from. */
  themeColor: "#120d0a",
  colorScheme: "dark",
};

/**
 * The site: the title cards (app/(cards)). The root holds only what every
 * page shares — the three faces, the global stylesheet, and the way past
 * the navigation. Each page owns its own motion; nothing here plays.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={[display.variable, credit.variable, text.variable].join(" ")}>
      <body>
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
