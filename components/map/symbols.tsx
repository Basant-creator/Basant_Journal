import type { LocationSymbol } from "@/lib/content/types";

/**
 * Location glyphs.
 *
 * Engraver's line art: monochrome, one stroke weight, round caps, no fills,
 * and deliberately imperfect. Each is drawn in a 32 x 32 box centred on the
 * origin so a node can place it with a single translate.
 *
 * Rule from Phase 1: a tent is four strokes, not a rendered illustration.
 * Every glyph must stay legible at 16px.
 */

const SYMBOLS: Record<LocationSymbol, React.ReactNode> = {
  // Camp — a tent with a curl of smoke.
  tent: (
    <>
      <path d="M-13 10 L0 -11 L13 10 Z" />
      <path d="M0 -11 L0 10" />
      <path d="M-17 10 H17" />
      <path d="M13.5 -6 q5 -5 1 -9 q-4 -4 0 -8" />
    </>
  ),

  // Gear — a folded tool roll with three tool ends showing.
  toolroll: (
    <>
      <path d="M-13 -5 h26 v14 h-26 z" />
      <path d="M-13 2.5 h26" />
      <path d="M-7 -5 v-7 M0 -5 v-9.5 M7 -5 v-6" />
    </>
  ),

  // Journal — an open book, two leaves, a ribbon.
  journal: (
    <>
      <path d="M0 -7 q-7.5 -4.5 -13.5 -3.2 v15.4 q6.4 -1.2 13.5 3.2 q7.1 -4.4 13.5 -3.2 v-15.4 q-6 -1.3 -13.5 3.2 z" />
      <path d="M0 -7 v15.4" />
      <path d="M6.5 -8.6 v7.4 l2.4 -2 l2.4 2 v-8.2" />
    </>
  ),

  // Bounties — a nailed notice, one corner curled.
  notice: (
    <>
      <path d="M-11 -11 h22 v16 l-7 6 h-15 z" />
      <path d="M11 5 h-7 v6" />
      <path d="M-5.5 -4.5 h12 M-5.5 0.5 h9" />
      <path d="M0 -11 v-4.5" />
    </>
  ),

  // Town — three roofs and a flagpole.
  roofs: (
    <>
      <path d="M-16 8 L-10 -2 L-4 8" />
      <path d="M-4 8 L3 -8.5 L10 8" />
      <path d="M10 8 L15 0 L20 8" />
      <path d="M-19 8 H22" />
      <path d="M3 -8.5 v-6 h6.5 v4 h-6.5" />
    </>
  ),

  // Archive — a bound sheaf with a seal.
  sheaf: (
    <>
      <path d="M-12.5 -11.5 h20 v5 h-20 z" />
      <path d="M-12.5 -3.5 h22 v5 h-22 z" />
      <path d="M-12.5 4.5 h18 v5 h-18 z" />
      <circle cx="11" cy="9" r="4" />
    </>
  ),

  // Trail End — a signpost at a fork.
  signpost: (
    <>
      <path d="M0 13 v-24" />
      <path d="M0 -9.5 h13 l4 4 l-4 4 h-13" />
      <path d="M0 1.5 h-13 l-4 -4 l4 -4 h13" />
    </>
  ),
};

interface LocationGlyphProps {
  symbol: LocationSymbol;
  scale?: number;
  strokeWidth?: number;
  className?: string;
}

export function LocationGlyph({
  symbol,
  scale = 1,
  strokeWidth = 1.7,
  className,
}: LocationGlyphProps) {
  return (
    <g
      className={className}
      transform={scale === 1 ? undefined : `scale(${scale})`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth / scale}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {SYMBOLS[symbol]}
    </g>
  );
}
