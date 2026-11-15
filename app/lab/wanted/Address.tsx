"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

type Copy = "idle" | "copying" | "copied" | "failed";

/* How long the stamp stays on the sheet. */
const STAMP_MS = 2400;

/**
 * The address, to write to or to take away.
 *
 * The address itself is the mail link it always was. Beside it, Copy puts
 * it on the clipboard, and only once the clipboard has said yes does the
 * sheet say so: "Copied", stamped in ink, and the same words to a screen
 * reader through a polite live region. If the clipboard says no (refused,
 * or not there at all), nothing pretends otherwise: the address is
 * selected, ready to be copied by hand, and the line says that instead.
 *
 * One press at a time: while the clipboard is being asked the button is
 * busy, and pressing again does nothing.
 */
export function Address({ email, className }: { email: string; className?: string }) {
  const link = useRef<HTMLAnchorElement>(null);
  const [state, setState] = useState<Copy>("idle");

  useEffect(() => {
    if (state !== "copied" && state !== "failed") return;
    const timer = window.setTimeout(() => setState("idle"), STAMP_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    if (state === "copying") return;
    setState("copying");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(email);
      setState("copied");
    } catch {
      const text = link.current;
      const selection = window.getSelection();
      if (text && selection) {
        const range = document.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setState("failed");
    }
  };

  return (
    <div className={`${styles.address} ${className ?? ""}`} data-enter="">
      <a ref={link} href={`mailto:${email}`} className={styles.email}>
        {email}
      </a>
      <span className={styles.copyWrap}>
        <button
          type="button"
          className={styles.copy}
          onClick={copy}
          aria-disabled={state === "copying" ? "true" : undefined}
          aria-label="Copy the email address"
        >
          Copy
        </button>
        <span className={styles.copied} role="status" data-state={state}>
          {state === "copied" ? (
            <>
              <span className={styles.srOnly}>Email address </span>Copied
            </>
          ) : state === "failed" ? (
            "Could not copy - the address is selected"
          ) : null}
        </span>
      </span>
    </div>
  );
}
