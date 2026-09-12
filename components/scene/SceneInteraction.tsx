"use client";

import { type ReactNode, useCallback, useId, useMemo, useRef, useState } from "react";
import { SceneInteractionContext } from "./SceneContext";

interface SceneInteractionProps {
  children: ReactNode;
  /** Object ids in the order arrow keys should walk them. */
  order: string[];
  /** Which object is open on arrival. Something is always open. */
  initial?: string;
  onChange?: (id: string) => void;
  /**
   * Own the id space. A tabpanel rendered outside this provider — the record
   * column beside a scene, usually — has to name the same ids the tabs use,
   * and cannot reach a generated one.
   */
  id?: string;
}

/**
 * The selection model for a scene's objects.
 *
 * Objects behave as a tablist: exactly one is open, one is in the tab order,
 * and arrow keys walk between them. That matters more than it sounds — it is
 * what stops a scene becoming a hunt. Nothing is hidden behind noticing
 * something; choosing an object changes *which* record is showing, never
 * whether the content exists.
 *
 * Objects that navigate rather than select (a map that returns to the survey)
 * opt out and render as plain links, because a link is not a tab.
 *
 * This provides the state and nothing else. The tablist element is
 * SceneObjects, deliberately separate: artwork has to sit inside the provider
 * so it can react to what is being reached for, and artwork has no business
 * inside a tablist.
 */
export function SceneInteraction({
  children,
  order,
  initial,
  onChange,
  id,
}: SceneInteractionProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const [activeId, setActiveId] = useState<string | null>(initial ?? order[0] ?? null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const elements = useRef<Record<string, HTMLElement | null>>({});

  const select = useCallback(
    (id: string) => {
      setActiveId(id);
      onChange?.(id);
    },
    [onChange],
  );

  const register = useCallback((id: string, element: HTMLElement | null) => {
    elements.current[id] = element;
  }, []);

  const moveFocus = useCallback(
    (fromId: string, delta: number | "first" | "last") => {
      if (order.length === 0) return;
      const from = order.indexOf(fromId);
      const next =
        delta === "first"
          ? 0
          : delta === "last"
            ? order.length - 1
            : (from + delta + order.length) % order.length;

      const id = order[next];
      setActiveId(id);
      onChange?.(id);
      elements.current[id]?.focus();
    },
    [onChange, order],
  );

  const value = useMemo(
    () => ({ activeId, hoverId, order, baseId, select, hover: setHoverId, register, moveFocus }),
    [activeId, hoverId, order, baseId, select, register, moveFocus],
  );

  return (
    <SceneInteractionContext.Provider value={value}>
      {children}
    </SceneInteractionContext.Provider>
  );
}
