import type { ReactNode } from "react";
import styles from "./SceneObjects.module.css";

interface SceneObjectsProps {
  children: ReactNode;
  label: string;
  /**
   * Objects in the same scene that are not tabs.
   *
   * Camp's map is the case this exists for: it goes somewhere, so it is a
   * link, and a link is not allowed to be a child of a tablist. It was one
   * anyway — this component's own note said "where only tabs belong" while
   * the route put an anchor in beside the three tabs. A tablist with a
   * stray link in it is not a small untidiness: assistive technology counts
   * "tab 1 of 3" from the tabs it finds and has nothing to say about the
   * fourth thing sitting among them.
   *
   * They share the overlay, because they are positioned by the same
   * percentages and take pointer events on the same terms. They just do not
   * share the role.
   */
  aside?: ReactNode;
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
export function SceneObjects({ children, label, aside }: SceneObjectsProps) {
  return (
    <div className={styles.objects}>
      <div className={styles.list} role="tablist" aria-label={label}>
        {children}
      </div>
      {aside}
    </div>
  );
}
