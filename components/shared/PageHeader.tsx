import type { ReactNode } from "react";
import { LocationGlyph } from "@/components/map/symbols";
import type { LocationSymbol } from "@/lib/content/types";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  lede?: string;
  symbol?: LocationSymbol;
  children?: ReactNode;
}

/**
 * The head of every territory page.
 *
 * Carries the location's own glyph, so arriving from the map is visibly the
 * same place rather than a differently-styled document.
 */
export function PageHeader({ eyebrow, title, lede, symbol, children }: PageHeaderProps) {
  return (
    <header className={styles.head}>
      <div className={styles.top}>
        {symbol ? (
          <span className={styles.glyph} aria-hidden="true">
            <svg viewBox="-20 -20 40 40" width="46" height="46">
              <LocationGlyph symbol={symbol} strokeWidth={1.6} />
            </svg>
          </span>
        ) : null}
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
        </div>
      </div>
      {lede ? <p className={styles.lede}>{lede}</p> : null}
      {children}
    </header>
  );
}
