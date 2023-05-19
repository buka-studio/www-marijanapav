"use client";

import { ReactNode, useEffect } from "react";

export const relativeMouseClassname = "relative-mouse";

export default function MouseVarsProvider({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    const handler = ({ clientX, clientY }: MouseEvent) => {
      const shinyCards = document.querySelectorAll(
        "." + relativeMouseClassname
      );
      const shinyBCRS = Array.from(shinyCards).map((el) => ({
        el: el as HTMLElement,
        bcr: el.getBoundingClientRect(),
      }));

      document.body.style.setProperty("--mouse-x", `${clientX}px`);
      document.body.style.setProperty("--mouse-y", `${clientY}px`);

      for (const { el, bcr } of shinyBCRS) {
        const x = clientX - bcr.left;
        const y = clientY - bcr.top;

        el.style.setProperty(`--mouse-x`, `${x}px`);
        el.style.setProperty(`--mouse-y`, `${y}px`);
      }
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handler);
    };
  }, []);

  return children as any;
}
