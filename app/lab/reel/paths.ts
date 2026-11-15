import type { StaticImageData } from "next/image";
import bobai from "@/public/work/bobai.jpg";
import onsight from "@/public/work/onsight.jpg";
import tuneit from "@/public/work/tuneit.jpg";

/* The reel's own routes, in one place: a lab prototype's addresses, kept
   out of lib/routes.ts with the rest of the lab's. */
export const reelHome = "/lab/reel";
export const reelCase = (id: string) => `${reelHome}/${id}`;

/* Each project's own front page, by project id. */
export const SHOTS: Record<string, StaticImageData> = { tuneit, onsight, bobai };

/* Roman numerals for case files, in the order the content file lists them. */
export const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

/* The content file sets ranges with long dashes; the reel sets them with a
   plain hyphen. Punctuation only. */
export const plain = (s: string) => s.replace(/\s*[—–]\s*/g, " - ");
