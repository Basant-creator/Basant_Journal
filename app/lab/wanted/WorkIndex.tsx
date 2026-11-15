"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import styles from "./page.module.css";

export type WorkItem = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  route: string;
  liveUrl: string | null;
  stack: string;
  image: StaticImageData;
};

/**
 * The work, as an index: one row per project, the name set large. On a
 * desktop the project's own front page floats beside the pointer while a
 * row is hovered — a glance at the thing itself without leaving the list;
 * on touch, where there is no hover, each row carries its picture inline.
 * A row reached by keyboard shows its picture too, beside the row.
 *
 * The whole row is the way to its case (the title's link, stretched over
 * it); the live site's link sits above that. The preview is one element
 * moved by transform, at most once a frame, its position read and written
 * in that same frame.
 *
 * A row becomes the one when the pointer moves over it, not when it
 * arrives under a pointer that is standing still: wheeling the list past a
 * resting mouse used to make every row the one in turn, each change a
 * round of fades on the main thread, on every frame of the scroll.
 */
export function WorkIndex({ items }: { items: WorkItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  /* Pictures that could not be had: their frame says what was meant to be
     there, in place of a broken image. */
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const fail = (id: string) => setFailed((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  const list = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });

  const place = (at: () => { x: number; y: number } | null) => {
    if (raf.current) return;
    raf.current = window.requestAnimationFrame(() => {
      raf.current = 0;
      const p = at();
      if (p && preview.current) preview.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
    });
  };

  const follow = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    pointer.current = { x: event.clientX, y: event.clientY };
    place(() => {
      const r = list.current?.getBoundingClientRect();
      return r ? { x: pointer.current.x - r.left, y: pointer.current.y - r.top } : null;
    });
  };

  /* Focus: the picture beside the row, three quarters of the way across. */
  const focusRow = (id: string, row: HTMLElement) => {
    setActive(id);
    place(() => {
      const r = list.current?.getBoundingClientRect();
      const b = row.getBoundingClientRect();
      return r ? { x: r.width * 0.74, y: b.top - r.top + b.height / 2 } : null;
    });
  };

  return (
    <div
      ref={list}
      className={styles.workList}
      onPointerMove={follow}
      onPointerLeave={() => setActive(null)}
      onBlur={(event) => {
        if (!list.current?.contains(event.relatedTarget as Node | null)) setActive(null);
      }}
    >
      {items.map((item, i) => (
        <article
          key={item.id}
          className={styles.workRow}
          data-enter=""
          data-active={active === item.id ? "" : undefined}
          onPointerMove={(event) => event.pointerType === "mouse" && active !== item.id && setActive(item.id)}
          onFocus={(event) => event.target.matches(":focus-visible") && focusRow(item.id, event.currentTarget)}
        >
          <div className={styles.workInline} data-failed={failed.has(item.id) ? "" : undefined} data-alt={`${item.title}, its front page`}>
            <Image
              src={item.image}
              alt={`${item.title}, its front page`}
              sizes="(max-width: 899px) 100vw, 900px"
              placeholder="blur"
              onError={() => fail(item.id)}
            />
          </div>
          <h3 className={styles.workTitle}>
            <Link href={item.route}>{item.title}</Link>
          </h3>
          <p className={styles.workLine}>{item.subtitle}</p>
          <p className={styles.workMeta}>
            <span className={styles.workNumber} aria-hidden="true">
              [ {String(i + 1).padStart(2, "0")} ]
            </span>
            <span>{item.date}</span>
            <span>{item.stack}</span>
          </p>
          <p className={styles.workLinks}>
            <span className={styles.workCase} aria-hidden="true">
              Read the case
            </span>
            {item.liveUrl ? (
              <a href={item.liveUrl} target="_blank" rel="noreferrer noopener" className={styles.inkLink} aria-describedby="new-tab">
                Visit the site
              </a>
            ) : null}
          </p>
        </article>
      ))}

      <div ref={preview} className={styles.preview} data-on={active ? "" : undefined} aria-hidden="true">
        {items.map((item) => (
          <div
            key={item.id}
            className={styles.previewCard}
            data-on={active === item.id ? "" : undefined}
            data-failed={failed.has(item.id) ? "" : undefined}
            data-alt={`${item.title}, its front page`}
          >
            <Image src={item.image} alt="" sizes="440px" placeholder="blur" onError={() => fail(item.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
