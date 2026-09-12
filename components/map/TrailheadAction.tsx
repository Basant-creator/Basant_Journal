"use client";

import Link from "next/link";
import { beginPassage, isPlainNavigation } from "@/lib/motion/passage";
import { routes } from "@/lib/routes";

interface TrailheadActionProps {
  className: string;
  /** The map's own beats, where there is a map to play them on. */
  onRun?: () => void;
  /** Hover and focus preview the journey on the sheet. */
  onPreviewChange?: (previewing: boolean) => void;
}

/**
 * FOLLOW THE TRAIL.
 *
 * One control, two compositions. The sheet and the phone's vertical trail
 * both carry it, and it was previously written out twice — which is how the
 * phone ended up with a trailhead that navigated without the journey.
 *
 * What it owns is the passage: the paper wipe from Camp to the Journal, and
 * the decision about whether this particular click is the kind that navigates
 * here at all. What it does not own is the map's own animation, which only
 * exists where there is a map; that arrives as a callback.
 *
 * Nothing here delays navigation. The link is a real link and the browser
 * follows it on its own schedule.
 */
export function TrailheadAction({
  className,
  onRun,
  onPreviewChange,
}: TrailheadActionProps) {
  return (
    <Link
      href={routes.projects}
      className={className}
      onPointerEnter={onPreviewChange ? () => onPreviewChange(true) : undefined}
      onPointerLeave={
        onPreviewChange ? () => onPreviewChange(false) : undefined
      }
      onFocus={onPreviewChange ? () => onPreviewChange(true) : undefined}
      onBlur={onPreviewChange ? () => onPreviewChange(false) : undefined}
      /* Pointer-down for the head start; the click covers the keyboard, where
         there is no pointer-down to get a start from. */
      onPointerDown={onRun}
      onClick={(event) => {
        onRun?.();
        if (!isPlainNavigation(event.nativeEvent)) return;
        beginPassage({
          id: "camp-to-journal",
          to: routes.projects,
          from: "Camp · Trailhead",
          caption: "The Journal",
        });
      }}
    >
      Follow the trail
      <span aria-hidden="true">&nbsp;→</span>
    </Link>
  );
}
