"use client";
import { useEffect, useRef } from "react";

import HighlightedText, { Controls } from "~/src/components/HighlightedHeading";
import Heading from "~/src/components/ui/Heading";

const lines = [
  "Visual designer",
  "exploring the best",
  "of traditional & digital",
];

const staggerMs = 300;

export default function Hheading() {
  const index = useRef(0);
  const textRefs = useRef(new Map<number, Controls>());

  useEffect(() => {
    if (index.current === lines.length) {
      return;
    }
    const interval = setInterval(() => {
      textRefs.current.get(index.current)?.start();
      index.current += 1;
    }, staggerMs);

    return () => {
      clearInterval(interval);
    };
  }, [index]);

  return (
    <Heading className="mb-[82px] max-w-[900px]">
      {lines.map((l, i) => (
        <HighlightedText
          aria-hidden
          className="text-5xl lg:text-8xl font-archivo"
          ref={(e) => textRefs.current.set(i, e!)}
          key={l}
        >
          {l}
        </HighlightedText>
      ))}
      <span className="sr-only">{lines.join(" ")}</span>
    </Heading>
  );
}
