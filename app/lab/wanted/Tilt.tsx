"use client";

import { useRef } from "react";

/**
 * A card that leans toward the pointer, a few degrees, the way a poster
 * pinned at one edge gives when you reach for it. Two custom properties,
 * written at most once a frame; nothing at all on touch or for reduced
 * motion (the stylesheet ignores the properties there).
 */
export function Tilt({ className, children }: { className?: string; children: React.ReactNode }) {
  const el = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const set = (rx: number, ry: number) => {
    if (raf.current) return;
    raf.current = window.requestAnimationFrame(() => {
      raf.current = 0;
      el.current?.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.current?.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
    });
  };

  return (
    <div
      ref={el}
      className={className}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const r = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - r.left) / r.width - 0.5;
        const y = (event.clientY - r.top) / r.height - 0.5;
        set(y * -7, x * 9);
      }}
      onPointerLeave={() => set(0, 0)}
    >
      {children}
    </div>
  );
}
