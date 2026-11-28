'use client';

import { useEffect, useRef } from 'react';


const LEAD_IN = 0.5; // first word reached
const LEAD_START = 0.12; // all dim until here
const PAUSE_COMMA = 0.16;
const RING = 0.3; // last word stays lit briefly
const FADE_OUT = 0.5; // window fades out behind the last word
const SEC_PER_WORD = 0.22; // max cursor travel time per word
const LEAD = 2.2; // words fading in ahead of the cursor
const HOLD = 3.2; // fully bright words behind the cursor
const TRAIL = 2.6; // words fading out behind those

const DIM = 38; // % strength of unlit words (readable in both themes)
const BRIGHT = 100; // % strength of lit words
const STATIC_REDUCED = 55; // % strength of all words with reduced motion

function buildTimeline(words: string[]) {
  const onsets: number[] = [];
  let t = LEAD_IN;
  for (const w of words) {
    onsets.push(t);
    t += 0.2 + 0.015 * w.replace(/[^\p{L}]/gu, '').length;
    if (/,$/.test(w)) t += PAUSE_COMMA;
  }
  const n = words.length;
  const last = onsets[n - 1];
  const keys: [number, number][] = [
    [0, -LEAD],
    [LEAD_START, -LEAD],
    ...onsets.map((o, i): [number, number] => [o, i]),
    [last + RING, n - 1 + RING],
    [last + RING + FADE_OUT, n - 1 + HOLD + TRAIL],
  ];
  return keys;
}

const easeInOut = (u: number) => u * u * (3 - 2 * u);
const smooth = (u: number) => {
  const x = Math.max(0, Math.min(1, u));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

function cursorAt(keys: [number, number][], time: number) {
  if (time <= keys[0][0]) return keys[0][1];
  for (let k = 1; k < keys.length; k++) {
    const [t1, p1] = keys[k];
    if (time <= t1) {
      const [t0, p0] = keys[k - 1];
      if (p1 === p0) return p0;
      const move = Math.min(t1 - t0, SEC_PER_WORD * Math.abs(p1 - p0));
      const u = Math.min(1, (time - t0) / move);
      return p0 + (p1 - p0) * (0.5 * u + 0.5 * easeInOut(u));
    }
  }
  return keys[keys.length - 1][1];
}

function intensity(d: number) {
  if (d < 0) return smooth(1 + d / LEAD);
  if (d <= HOLD) return 1;
  return smooth(1 - (d - HOLD) / TRAIL);
}

const mix = (pct: number) =>
  `color-mix(in oklab, var(--color-text-primary) ${pct.toFixed(1)}%, transparent)`;

export function SpeechHighlight({ src, lines }: { src: string; lines: string[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const staticLines = lines.slice(0, -1);
  const lastWords = lines[lines.length - 1].trim().split(/\s+/);

  useEffect(() => {
    const video = videoRef.current;
    const spans = wordRefs.current;
    const keys = buildTimeline(lastWords);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;

    const render = (time: number) => {
      const p = cursorAt(keys, time);
      spans.forEach((el, i) => {
        if (el) el.style.color = mix(DIM + (BRIGHT - DIM) * Math.pow(intensity(p - i), 1.6));
      });
    };
    const tick = () => {
      if (video) render(video.currentTime);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (reduce.matches) {
        video?.pause();
        spans.forEach((el) => el && (el.style.color = mix(STATIC_REDUCED)));
        return;
      }
      video?.play().catch(() => {});
      raf = requestAnimationFrame(tick);
    };

    start();
    reduce.addEventListener('change', start);
    return () => {
      cancelAnimationFrame(raf);
      reduce.removeEventListener('change', start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.join('\n')]);

  return (
    <div className="bg-panel-overlay @container w-full p-[6.7%]">
      <div className="flex flex-col gap-[5cqw] @[560px]:flex-row @[560px]:items-center @[560px]:gap-[3cqw]">
        <div className="border-theme-2 relative w-full shrink-0 overflow-hidden rounded-[1.2cqw] border @[560px]:w-[38%] @[560px]:rounded-[0.9cqw]">
          <video
            ref={videoRef}
            src={src}
            className="block h-auto w-full object-cover grayscale"
            style={{ aspectRatio: '16 / 10' }}
            muted
            loop
            playsInline
            autoPlay
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [html[class*='-light']_&]:bg-white/30 [html[class*='theme-light']_&]:bg-white/30"
          />
        </div>
        <p className="text-[4.6cqw] leading-[1.25] text-pretty @[560px]:text-[2.75cqw]">
          {staticLines.map((line, i) => (
            <span key={i} style={{ color: mix(DIM) }}>
              {line}{' '}
            </span>
          ))}
          <span>
            {lastWords.map((w, i) => (
              <span
                key={i}
                ref={(el) => {
                  wordRefs.current[i] = el;
                }}
                style={{ color: mix(DIM) }}
              >
                {w}
                {i < lastWords.length - 1 ? ' ' : ''}
              </span>
            ))}
          </span>
        </p>
      </div>
    </div>
  );
}
