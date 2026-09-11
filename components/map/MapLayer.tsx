import type { ReactNode } from "react";

interface MapLayerProps {
  /** Layer name — also emitted as data-layer so layers stay inspectable. */
  name: string;
  children: ReactNode;
  opacity?: number;
  className?: string;
  /** Layers below the interaction layer must never eat pointer events. */
  interactive?: boolean;
}

/**
 * One independently controllable band of the map.
 *
 * The brief's rule: the map is a composition of layers, not a flattened
 * image. Every visual band goes through this so it can be dimmed, hidden or
 * re-ordered on its own — and so the DOM reads like the layer list.
 */
export function MapLayer({
  name,
  children,
  opacity,
  className,
  interactive = false,
}: MapLayerProps) {
  return (
    <g
      data-layer={name}
      className={className}
      opacity={opacity}
      pointerEvents={interactive ? undefined : "none"}
    >
      {children}
    </g>
  );
}
