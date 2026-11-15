import type { StaticImageData } from "next/image";
import onsight from "@/public/work/onsight.jpg";
import strata from "@/public/work/strata.jpg";
import tuneit from "@/public/work/tuneit.jpg";

/* Each project's own front page, by project id. */
export const SHOTS: Record<string, StaticImageData> = { strata, tuneit, onsight };
