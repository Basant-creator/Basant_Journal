import styles from "./TextureLayer.module.css";

/**
 * THE DARK's atmospheric layer.
 *
 * One fixed element for the whole document rather than a pseudo-element per
 * component: dozens of separate turbulence layers is the fastest way to make a
 * site like this feel slow. Nothing here animates, so it costs one paint.
 */
export function TextureLayer() {
  return <div className={styles.texture} aria-hidden="true" />;
}
