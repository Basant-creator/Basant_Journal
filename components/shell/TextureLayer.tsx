import styles from "./TextureLayer.module.css";

/**
 * THE DARK's atmospheric layer.
 *
 * One fixed element for the whole document rather than a pseudo-element per
 * component: dozens of separate turbulence layers is the fastest way to make a
 * site like this feel slow.
 *
 * The vignette and the grain do not animate — both are painted surfaces, and
 * moving either one means re-rasterising a full-viewport turbulence bitmap
 * every frame. The light does, because it is a gradient on its own promoted
 * layer moving by `transform` and `opacity` alone: the compositor's work, not
 * the main thread's, and no repaint at any point.
 *
 * That distinction is the whole design. Environmental motion is affordable
 * exactly when it is a transform on something already promoted, and ruinous
 * the moment it is anything else.
 */
export function TextureLayer() {
  return (
    <div className={styles.texture} aria-hidden="true">
      <span className={styles.light} />
    </div>
  );
}
