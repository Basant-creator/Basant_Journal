import type { ReactNode } from "react";
import styles from "./SceneObjects.module.css";

interface SceneObjectsProps {
  children: ReactNode;
  label: string;
}

/**
 * The tablist a scene's objects live in.
 *
 * Split out from SceneInteraction so that artwork can sit inside the provider
 * — reacting to what is being reached for — without sitting inside a tablist,
 * where only tabs belong.
 *
 * It covers the scene, but only its children take pointer events: the gaps
 * between objects are scene, not control, and clicking the fire should do
 * exactly nothing.
 */
export function SceneObjects({ children, label }: SceneObjectsProps) {
  return (
    <div className={styles.objects} role="tablist" aria-label={label}>
      {children}
    </div>
  );
}
