import { getImageProps, type StaticImageData } from "next/image";
import dustRider from "./dust-rider.jpg";
import moonlightWolf from "./camp-moonlight-wolf.jpg";
import dashForTheTimber from "./journey-dash-for-the-timber.jpg";
import inWithoutKnocking from "./work-in-without-knocking.jpg";
import fallOfTheCowboy from "./contact-fall-of-the-cowboy.jpg";
import dustRiderLines from "./dust-rider.lines.jpg";
import moonlightWolfLines from "./camp-moonlight-wolf.lines.jpg";
import dashForTheTimberLines from "./journey-dash-for-the-timber.lines.jpg";
import inWithoutKnockingLines from "./work-in-without-knocking.lines.jpg";
import fallOfTheCowboyLines from "./contact-fall-of-the-cowboy.lines.jpg";

/**
 * The pictures, and where each one came from.
 *
 * The photograph is under the Unsplash licence (free to use, no permission
 * needed; the credit is courtesy and is kept). The paintings are public
 * domain: Remington died in 1909, Russell in 1926, and every one of these was
 * published before 1929. Files were resized and recompressed on download;
 * nothing else was changed.
 *
 * Each has a `lines` twin, its chalk line drawing (white on black), made by
 * scripts/chalk-lines.py: the picture is sketched in from it before it is
 * rubbed back to colour. Rerun the script if a picture is replaced.
 */

export type Art = {
  src: StaticImageData;
  lines: StaticImageData;
  title: string;
  artist: string;
  /* A painting's date; a photograph's is not known, so it has none. */
  year?: string;
  source: string;
  licence: string;
};

export const OPENING: Art = {
  src: dustRider,
  lines: dustRiderLines,
  title: "A man riding a horse across a dirt field",
  artist: "Cemrecan Yurtman",
  source: "https://unsplash.com/photos/a-man-riding-a-horse-across-a-dirt-field-Vg4ePdejI8Y",
  licence: "Unsplash licence",
};

export type Plate = Art & { year: string; numeral: string; chapter: string; id: string; focus: string };

/* The chapter each painting heads, in the order the page is read. */
export const PLATES: Plate[] = [
  {
    id: "camp",
    numeral: "I",
    chapter: "Camp",
    src: moonlightWolf,
    lines: moonlightWolfLines,
    title: "Moonlight, Wolf",
    artist: "Frederic Remington",
    year: "c. 1909",
    source: "https://commons.wikimedia.org/wiki/File:FredericRemington-Moonlight_Wolf_c1909.jpg",
    licence: "Public domain",
    focus: "40% 55%",
  },
  {
    id: "journey",
    numeral: "II",
    chapter: "Journey",
    src: dashForTheTimber,
    lines: dashForTheTimberLines,
    title: "A Dash for the Timber",
    artist: "Frederic Remington",
    year: "1889",
    source: "https://commons.wikimedia.org/wiki/File:A_Dash_for_the_Timber_by_Frederic_Remington.jpg",
    licence: "Public domain",
    focus: "50% 55%",
  },
  {
    id: "work",
    numeral: "III",
    chapter: "Work",
    src: inWithoutKnocking,
    lines: inWithoutKnockingLines,
    title: "In Without Knocking",
    artist: "Charles M. Russell",
    year: "1909",
    source: "https://commons.wikimedia.org/wiki/File:Charles_Marion_Russell_%E2%80%93_In_Without_Knocking_%E2%80%93_Google_Art_Project.jpg",
    licence: "Public domain",
    focus: "55% 45%",
  },
  {
    id: "contact",
    numeral: "IV",
    chapter: "Contact",
    src: fallOfTheCowboy,
    lines: fallOfTheCowboyLines,
    title: "The Fall of the Cowboy",
    artist: "Frederic Remington",
    year: "1895",
    source: "https://commons.wikimedia.org/wiki/File:Remington_The_Fall_of_the_Cowboy_1895.jpg",
    licence: "Public domain",
    focus: "50% 50%",
  },
];

export const plate = (id: string): Plate => {
  const found = PLATES.find((p) => p.id === id);
  if (!found) throw new Error(`No plate for chapter "${id}"`);
  return found;
};

/**
 * A picture as an <Image sizes="100vw"> of it would fetch it on a screen
 * `px` device pixels wide: the next width up among the optimiser's
 * candidates. Asking for exactly those URLs is what lets one picture be
 * used twice (a chalk board, and the same drawing on a field report) and
 * fetched once.
 */
export function fullWidth(image: StaticImageData, px: number): string {
  const { srcSet, src } = getImageProps({ src: image, alt: "", fill: true, sizes: "100vw" }).props;
  const candidates = (srcSet ?? "")
    .split(", ")
    .map((entry) => {
      const [url, width] = entry.split(" ");
      return { url, width: parseInt(width, 10) };
    })
    .filter((c) => c.url && Number.isFinite(c.width));
  return (candidates.find((c) => c.width >= px) ?? candidates.at(-1))?.url ?? src ?? image.src;
}

/**
 * A drawing at the size a board needs, through the image optimiser like
 * every other picture (AVIF or WebP, at the next width up from what will be
 * painted) rather than the full-size JPEG whatever the screen. The board
 * covers a box of `w` by `h` device pixels, so the drawing must be at least
 * as wide as covering that box makes it — but never wider than the
 * photograph it is drawn over, which is fetched for the screen's width
 * (`screen`, in device pixels): on a tall phone, covering the box would ask
 * for a drawing twice the photograph's size, to be rubbed away to it.
 */
export function chalkSrc(lines: StaticImageData, w: number, h: number, screen: number): string {
  return fullWidth(lines, Math.min(Math.max(w, (h * lines.width) / lines.height), screen));
}
