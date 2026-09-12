"use client";

import Link from "next/link";
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
 * What it owns is the journey preview and the map's own beats, which only
 * exist where there is a map and so arrive as callbacks. What it no longer
 * owns is the transition: that is the route transition controller's, for
 * every route, which is the whole point of there being one.
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
      onClick={onRun}
    >
      Follow the trail
      <span aria-hidden="true">&nbsp;→</span>
    </Link>
  );
}
