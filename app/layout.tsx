import { SITE_ORIGIN } from "@/lib/routes";
import { TransitionProvider } from "@/components/transition/TransitionProvider";
import type { Metadata, Viewport } from "next";
import { Archivo, Caveat, IM_Fell_English_SC, Source_Serif_4 } from "next/font/google";
import { FrontierTrail } from "@/components/navigation/FrontierTrail";
import { Quiet } from "@/components/shell/Quiet";
import { MotionBudget } from "@/components/shell/MotionBudget";
import { SmoothScroll } from "@/components/shell/SmoothScroll";
import { TextureLayer } from "@/components/shell/TextureLayer";
import { SkipLink } from "@/components/navigation/SkipLink";
import { person } from "@/lib/content/portfolio";
import { ENTRY_STAMP_SCRIPT } from "@/lib/motion/entry";
import { HOUR_STAMP_SCRIPT } from "@/lib/world/hour";
import "./globals.css";
/* After the site's own: Lenis's few rules (height, the stopped state, nested
   scrollers) are about the scroll root and are meant to have the last word. */
import "lenis/dist/lenis.css";

/**
 * Four voices, self-hosted through next/font: no render-blocking third-party
 * request, no layout shift, each face subsetted rather than shipped whole.
 *
 * Each has the job a survey sheet gives it:
 *
 *   IM Fell        17th-century Fell types, with the ink spread the concept
 *                  wants. Names — the wordmark, chapters, places, headings.
 *   Source Serif   The book face. Everything read at length, and the digits
 *                  of anything measured, which Fell cuts old-style.
 *   Archivo        A grotesque drawn from late-19th-century American gothics.
 *                  The margin: labels, dates, units and controls, in the plain
 *                  spaced capitals an engraver lettered around a map rather
 *                  than on it.
 *   Caveat         THE HAND. It annotates; it never carries information.
 *
 * Rye is gone. It was saloon-bill wood type, set on the wordmark and every
 * chapter card, and it was the loudest reason the site read as a cowboy theme
 * rather than a survey — docs/design-direction.md §2 rules out "saloon-font
 * display type" by name. Chapters are Fell now, spaced the way an atlas
 * letters a title.
 *
 * Nothing reads a family name directly; every component goes through a token,
 * so any of these can be swapped in one line here.
 */

/* Variable in width as well as weight. The margin is lettered a little
   condensed — see --font-ui in globals.css, which sets the width once. */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const fell = IM_Fell_English_SC({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fell",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-caveat",
  display: "swap",
});

/* The site is the title cards (app/(cards)): the name, the role, and the
   tagline, all the content file's. */
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
  keywords: [
    "Basant Bhushan",
    "software developer",
    "portfolio",
    "TypeScript",
    "Next.js",
    "Node.js",
    "algorithms",
  ],
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
  themeColor: "#1b1713",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const fontVars = [fell, sourceSerif, archivo, caveat]
    .map((f) => f.variable)
    .join(" ");

  return (
    // The pre-paint script below stamps data-entry on this element before
    // React hydrates, which is a deliberate server/client difference. Without
    // this, React reports it as a hydration mismatch on every load.
    // data-scroll-behavior declares what globals.css already sets on <html>.
    // Next disables smooth scrolling during route transitions today and warns
    // that a future version will stop doing so unless the intent is stated
    // here. Saying it now keeps the behaviour when that lands, and clears the
    // warning from the console in the meantime.
    <html
      lang="en"
      className={fontVars}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint, and has to: the entry stamp for the earlier
            site's landing cinematic. If it fails to run, no rule matches and
            the document renders complete — the right failure.

            The boot screen and its stamp are gone from here. They belonged to
            the earlier site's home; the home is now the title cards, which
            open with their own bars (components/cards). Their code is kept,
            unmounted, in components/boot and lib/boot for review. */}
        <script dangerouslySetInnerHTML={{ __html: ENTRY_STAMP_SCRIPT }} />
        {/* The hour, stamped before first paint for the same reason as the
            two above. Without it the server renders dusk, the browser reads
            dawn out of session storage on mount, and the visitor watches the
            whole page change its mind — which is the one flash Phase 10C
            exists to avoid. */}
        <script dangerouslySetInnerHTML={{ __html: HOUR_STAMP_SCRIPT }} />
      </head>
      <body>
        {/* The application. Mounted and laid out from the first frame even
            while the boot layer covers it, so Home is uncovered rather than
            built when the boot ends. */}
        <div data-app-shell>
          <SkipLink />
          {/* One owner for route-entry choreography, above the router so it
              survives every navigation and sees the landing page too. */}
          <TransitionProvider>{children}</TransitionProvider>
          <Quiet name="TextureLayer"><TextureLayer /></Quiet>
          {/* One owner for scroll: the weighted, native-on-touch glide the
              trail is walked at. Enhancement only, so it sits inside a Quiet
              boundary like the rest — if it throws, the page scrolls the way
              every other page does. See SmoothScroll. */}
          <Quiet name="SmoothScroll"><SmoothScroll /></Quiet>
          {/* How much this machine may move: the still composition for a
              machine that has shown it is weak. See lib/motion/budget. */}
          <Quiet name="MotionBudget"><MotionBudget /></Quiet>
          {/* No audio. The air, the music and their switch (AtmosphereControl,
              CheckpointAudio, AudioLabMount) are unmounted: the site is silent.
              Their code is kept in components/audio and lib/audio with the
              earlier site, and nothing else can start the audio engine. */}
          {/* The world's own navigation, mounted once so it survives every
              route change and can remember the walk. It draws nothing on
              the landing or off the trail; see FrontierTrail. */}
          <Quiet name="FrontierTrail"><FrontierTrail /></Quiet>
        </div>

      </body>
    </html>
  );
}
