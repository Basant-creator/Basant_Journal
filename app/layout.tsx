import { TransitionProvider } from "@/components/transition/TransitionProvider";
import type { Metadata, Viewport } from "next";
import { Caveat, IM_Fell_English_SC, Inter, Rye, Source_Serif_4 } from "next/font/google";
import { TextureLayer } from "@/components/shell/TextureLayer";
import { SkipLink } from "@/components/navigation/SkipLink";
import { person } from "@/lib/content/portfolio";
import { ENTRY_STAMP_SCRIPT } from "@/lib/motion/entry";
import { BOOT_STAMP_SCRIPT } from "@/lib/boot/boot";
import { BootScreen } from "@/components/boot/BootScreen";
import "./globals.css";

/**
 * Five voices, self-hosted through next/font: no render-blocking third-party
 * request, no layout shift, each face subsetted rather than shipped whole.
 *
 * Cinzel is gone. Phase 1 flagged it as a placeholder — it reads classical and
 * luxurious, closer to a perfume campaign than a frontier survey — and this
 * pass finally spends the decision:
 *
 *   Rye          19th-century wood type. Reserved for chapter cards, location
 *                reveals and the wordmark. Rare on purpose: it is the loudest
 *                thing on the site and would turn kitsch if used freely.
 *   IM Fell      17th-century Fell types, with the ink spread the concept
 *                wants. The general display face: section headings, map
 *                lettering, document headers, large numbers.
 *
 * Nothing reads a family name directly; every component goes through a token,
 * so either can be swapped in one line here.
 */
const rye = Rye({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rye",
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

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-caveat",
  display: "swap",
});

const DESCRIPTION =
  "The portfolio of Basant Bhushan — a Computer Science student building backend-heavy systems. Explored as a surveyor's record of territory still being mapped.";

export const metadata: Metadata = {
  metadataBase: new URL("https://basantbhushan.dev"),
  title: {
    default: `${person.name} — The Frontier`,
    template: `%s — ${person.name}`,
  },
  description: DESCRIPTION,
  applicationName: "The Frontier",
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
    siteName: "The Frontier",
    title: `${person.name} — The Frontier`,
    description: DESCRIPTION,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${person.name} — The Frontier`,
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
  const fontVars = [rye, fell, sourceSerif, inter, caveat]
    .map((f) => f.variable)
    .join(" ");

  return (
    // The pre-paint script below stamps data-entry on this element before
    // React hydrates, which is a deliberate server/client difference. Without
    // this, React reports it as a hydration mismatch on every load.
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <head>
        {/* Both run before first paint, and both have to.

            The boot stamp is what makes §1 possible: the browser must never
            paint one frame of Home behind the boot layer, and React cannot
            promise that because React runs after the first paint. The entry
            stamp is the same trick for the landing cinematic. If either fails
            to run, no rule matches and the document renders complete — which
            is the right failure for both. */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_STAMP_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: ENTRY_STAMP_SCRIPT }} />
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
          <TextureLayer />
        </div>

        {/* Server-rendered, so it is in the first painted frame. The boot
            system and the route transition system are separate on purpose:
            this happens once, before Home exists visually, and never again
            because somebody clicked Gear. */}
        <BootScreen />
      </body>
    </html>
  );
}
