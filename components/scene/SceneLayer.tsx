import type { CSSProperties, ReactNode } from "react";
import styles from "./SceneLayer.module.css";

/** 0 is furthest from the viewer, 6 is nearest. */
export type Depth = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface SceneLayerProps {
  children: ReactNode;
  depth: Depth;
  /** `g` for artwork inside the scene's SVG, `div` for DOM layers over it. */
  as?: "g" | "div";
  /** Vertical parallax is always gentler than horizontal — heads turn more
   *  than they nod. This scales the vertical share. */
  verticalRatio?: number;
  name?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * One band of depth.
 *
 * The band number is the whole API: it picks the parallax distance from
 * --depth-shift-N, and by convention the tone from --scene-depth-N. Layers do
 * not know where the pointer is; they read the --px/--py the Scene wrote, so
 * the entire parallax system costs zero renders.
 */
export function SceneLayer({
  children,
  depth,
  as = "g",
  verticalRatio = 0.38,
  name,
  className,
  style,
}: SceneLayerProps) {
  const layerStyle = {
    "--layer-shift": `var(--depth-shift-${depth})`,
    "--layer-vertical": verticalRatio,
    ...style,
  } as CSSProperties;

  const classes = [styles.layer, className].filter(Boolean).join(" ");

  if (as === "div") {
    return (
      <div className={classes} style={layerStyle} data-depth={depth} data-layer={name}>
        {children}
      </div>
    );
  }

  return (
    <g className={classes} style={layerStyle} data-depth={depth} data-layer={name}>
      {children}
    </g>
  );
}
