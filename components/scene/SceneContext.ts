"use client";

import { createContext, useContext } from "react";

/**
 * What a Scene tells the things inside it.
 *
 * Parallax is deliberately *not* in here as state. The pointer writes
 * --px/--py straight onto the stage element inside one rAF, and layers read
 * those custom properties in CSS — so moving the mouse never triggers a React
 * render anywhere in the tree. This context carries only what genuinely has
 * to be shared.
 */
export interface SceneContextValue {
  /** The scene's coordinate space, matching its artwork's viewBox. */
  width: number;
  height: number;
  /** True once the stage has mounted; entry animations wait for it. */
  ready: boolean;
  /** Honours prefers-reduced-motion. Layers and objects check it. */
  reducedMotion: boolean;
}

export const SceneContext = createContext<SceneContextValue | null>(null);

export function useScene(): SceneContextValue {
  const value = useContext(SceneContext);
  if (!value) {
    throw new Error("Scene parts must be rendered inside a <Scene>.");
  }
  return value;
}

/**
 * The selection model for a scene's interactive objects.
 *
 * A scene's objects behave as a tablist: exactly one is open, arrow keys move
 * between them, and the open one's record is shown elsewhere on the page.
 * Objects that navigate instead of selecting opt out by rendering as links.
 */
export interface SceneInteractionValue {
  activeId: string | null;
  hoverId: string | null;
  order: string[];
  baseId: string;
  select: (id: string) => void;
  hover: (id: string | null) => void;
  register: (id: string, element: HTMLElement | null) => void;
  moveFocus: (fromId: string, delta: number | "first" | "last") => void;
}

export const SceneInteractionContext = createContext<SceneInteractionValue | null>(null);

export function useSceneInteraction(): SceneInteractionValue | null {
  return useContext(SceneInteractionContext);
}

/** What an object is doing, from the artwork's point of view. */
export type ObjectState = "rest" | "hover" | "active";

/**
 * The state of one object, for the drawing of it.
 *
 * The controls live in the DOM over the scene and the objects are drawn
 * inside it, so without this the artwork cannot know that anyone is reaching
 * for it — which is how you end up with a scene where an invisible rectangle
 * lights up and the thing it is over does nothing.
 *
 * Three states, not four: `focus` is the control's, because a focus ring
 * belongs to the focusable thing. A focused object reports `hover` here, so
 * the drawing responds to the keyboard exactly as it does to the pointer.
 */
export function useObjectState(id: string): ObjectState {
  const scene = useContext(SceneInteractionContext);
  if (!scene) return "rest";
  if (scene.activeId === id) return "active";
  return scene.hoverId === id ? "hover" : "rest";
}
