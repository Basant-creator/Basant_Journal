"use client";

import Link from "next/link";
import type { CSSProperties, KeyboardEvent } from "react";
import { useSceneInteraction } from "./SceneContext";
import styles from "./SceneObject.module.css";

/** Position and size as a share of the scene, matching the artwork. */
export interface ObjectBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SceneObjectProps {
  id: string;
  box: ObjectBox;
  /** Always readable. The object's name. */
  label: string;
  /** The small reward for reaching for it. Never the only copy of a fact. */
  note?: string;
  /** Given an href, the object navigates and is a link rather than a tab. */
  href?: string;
  onHoverChange?: (hovering: boolean) => void;
  className?: string;
}

/**
 * A thing in a scene you can pick up.
 *
 * It is a real control positioned over the artwork, never a click handler on
 * an SVG path: a button or a link, in the tab order, with an accessible name.
 * That is the whole reason the box is expressed as percentages — the artwork
 * and the control are positioned from the same numbers, so they cannot drift
 * apart at any width.
 */
export function SceneObject({
  id,
  box,
  label,
  note,
  href,
  onHoverChange,
  className,
}: SceneObjectProps) {
  const scene = useSceneInteraction();
  const active = scene?.activeId === id;

  /*
    The box is where this object is in the artwork. --anchor-<id>-x/y is
    where it is on screen when a renderer is drawing it instead, projected
    per frame by ObjectAnchors.
    
    The fallback in each var() is the whole bridge. Nothing writes those
    properties unless a 3D scene is mounted and projecting, so the
    illustrated box is what applies the rest of the time — on a phone, with
    reduced motion, without WebGL, or in the frames before the canvas has
    loaded. One expression covers every case and neither renderer has to
    know the other exists.

    Width and height go through custom properties rather than being written
    straight in, because an inline style beats a stylesheet and two other
    presentations need to change them: the anchored one shortens the box, and
    the compact one stops positioning it at all. A stylesheet cannot win
    against style="..." — it can only be asked for by it.

    Projected anchors are centres, so the object is pulled back by half its
    own size; the 2D box is already a corner and needs no such correction.
    That is what the translate is for, and it is switched off with the
    same custom property that positions it.
  */
  const style = {
    left: `var(--anchor-${id}-x, ${box.x}%)`,
    top: `var(--anchor-${id}-y, ${box.y}%)`,
    width: `var(--object-w, var(--anchor-${id}-w, ${box.w}%))`,
    height: `var(--object-h, ${box.h}%)`,
    "--anchor-shift": `var(--anchor-${id}-on, 0)`,
  } as CSSProperties;

  const body = (
    <>
      <span className={styles.label}>{label}</span>
      {note ? <span className={styles.note}>{note}</span> : null}
    </>
  );

  const classes = [styles.object, active ? styles.active : "", className]
    .filter(Boolean)
    .join(" ");

  const hover = (on: boolean) => {
    scene?.hover(on ? id : null);
    onHoverChange?.(on);
  };

  if (href) {
    return (
      <Link
        href={href}
        className={`${classes} ${styles.asLink}`}
        style={style}
        onMouseOver={() => hover(true)}
        onMouseOut={() => hover(false)}
        onFocus={() => hover(true)}
        onBlur={() => hover(false)}
      >
        {body}
      </Link>
    );
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!scene) return;
    const map: Record<string, number | "first" | "last"> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
      Home: "first",
      End: "last",
    };
    const delta = map[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    scene.moveFocus(id, delta);
  };

  return (
    <button
      type="button"
      role="tab"
      id={scene ? `${scene.baseId}-tab-${id}` : undefined}
      aria-selected={active}
      aria-controls={scene ? `${scene.baseId}-panel` : undefined}
      tabIndex={active ? 0 : -1}
      ref={(el) => scene?.register(id, el)}
      className={classes}
      style={style}
      onClick={() => scene?.select(id)}
      onKeyDown={onKeyDown}
      onMouseOver={() => hover(true)}
      onMouseOut={() => hover(false)}
      onFocus={() => hover(true)}
      onBlur={() => hover(false)}
    >
      {body}
    </button>
  );
}
