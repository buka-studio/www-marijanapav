'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { cn } from '~/src/util';

const THEME_TOKEN_NAMES = [
  '--theme-1',
  '--theme-2',
  '--theme-3',
  '--theme-4',
  '--main-background',
  '--main-accent',
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--text-contrast',
  '--panel-background',
  '--panel-border',
  '--panel-shadow',
  '--panel-overlay',
] as const;

type ThemeTokenName = (typeof THEME_TOKEN_NAMES)[number];

const LIGHT_COLUMNS = [
  { id: 'light', label: 'Light', className: 'theme-light' },
  { id: 'red-light', label: 'Red · light', className: 'theme-light theme-red-light' },
  { id: 'blue-light', label: 'Blue · light', className: 'theme-light theme-blue-light' },
  { id: 'green-light', label: 'Green · light', className: 'theme-light theme-green-light' },
] as const;

const DARK_COLUMNS = [
  { id: 'dark', label: 'Dark', className: 'theme-dark' },
  { id: 'red-dark', label: 'Red · dark', className: 'theme-dark theme-red-dark' },
  { id: 'blue-dark', label: 'Blue · dark', className: 'theme-dark theme-blue-dark' },
  { id: 'green-dark', label: 'Green · dark', className: 'theme-dark theme-green-dark' },
] as const;

function TokenSwatch({
  name,
  resolved,
  className,
}: {
  name: ThemeTokenName;
  resolved: string;
  className?: string;
}) {
  const isShadow = name === '--panel-shadow';
  const rowBorder = { borderBottomColor: 'color-mix(in oklab, var(--text-primary) 14%, transparent)' } as const;
  const swatchOutline = {
    border: '1px solid color-mix(in oklab, var(--text-primary) 22%, transparent)',
  } as const;

  return (
    <div
      className={cn('flex gap-2 border-b py-2 last:border-b-0', className)}
      style={rowBorder}
    >
      <div
        className="size-10 shrink-0 rounded"
        style={
          isShadow
            ? {
                ...swatchOutline,
                backgroundColor: 'var(--main-background)',
                boxShadow: '0 0 14px 2px var(--panel-shadow)',
              }
            : { ...swatchOutline, backgroundColor: `var(${name})` }
        }
      />
      <div className="min-w-0 flex-1 font-mono text-[11px] leading-snug">
        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
          {name}
        </div>
        {resolved ? (
          <div className="mt-0.5 break-all" style={{ color: 'var(--text-muted)' }}>
            {resolved}
          </div>
        ) : (
          <div className="mt-0.5 italic" style={{ color: 'var(--text-muted)' }}>
            unset
          </div>
        )}
      </div>
    </div>
  );
}

function ThemeColumn({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [resolved, setResolved] = useState<Partial<Record<ThemeTokenName, string>>>({});

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const next: Partial<Record<ThemeTokenName, string>> = {};
    for (const name of THEME_TOKEN_NAMES) {
      const v = cs.getPropertyValue(name).trim();
      if (v) next[name] = v;
    }
    setResolved(next);
  }, [className]);

  const headerStyle = {
    backgroundColor: 'var(--theme-3)',
    color: 'var(--text-primary)',
    borderBottomColor: 'color-mix(in oklab, var(--text-primary) 12%, transparent)',
  } as const;

  return (
    <div
      ref={rootRef}
      className={cn('flex min-w-[200px] flex-1 flex-col overflow-hidden rounded-lg border', className)}
      style={{ borderColor: 'color-mix(in oklab, var(--text-primary) 18%, transparent)' }}
    >
      <div className="border-b px-3 py-2" style={headerStyle}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </h2>
        <p className="mt-0.5 font-mono text-[10px] break-all" style={{ color: 'var(--text-muted)' }}>
          {className}
        </p>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3" style={{ backgroundColor: 'var(--main-background)' }}>
        <div
          className="border-b py-3"
          style={{ borderBottomColor: 'color-mix(in oklab, var(--text-primary) 12%, transparent)' }}
        >
          <p className="text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>
            Primary body copy uses text-primary on the page background.
          </p>
          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            Muted supporting line (text-muted).
          </p>
          <div
            className="shadow-card mt-3 rounded-md border p-3 text-xs"
            style={{
              backgroundColor: 'var(--panel-background)',
              borderColor: 'var(--panel-border)',
              color: 'var(--text-secondary)',
            }}
          >
            Panel sample: secondary text inside panel-background with panel-border and shadow token.
          </div>
        </div>

        <div className="pt-2">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Tokens
          </p>
          {THEME_TOKEN_NAMES.map((name) => (
            <TokenSwatch key={name} name={name} resolved={resolved[name] ?? ''} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ColorTokenPlayground() {
  /* Shell uses fixed neutrals so copy stays readable regardless of html theme (next-themes). */
  return (
    <div
      className="mx-auto max-w-[1600px] rounded-xl border border-neutral-200 bg-white p-4 text-neutral-950 shadow-sm md:p-6 [color-scheme:light]"
    >
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-950">Color token playground</h1>
        <p className="mt-1 text-sm text-neutral-700">
          Eight theme stacks side by side (same class composition as production). Resolved values are read from the browser
          after paint.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-neutral-800 uppercase">Light mode themes</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {LIGHT_COLUMNS.map((col) => (
            <ThemeColumn key={col.id} label={col.label} className={col.className} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-neutral-800 uppercase">Dark mode themes</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {DARK_COLUMNS.map((col) => (
            <ThemeColumn key={col.id} label={col.label} className={col.className} />
          ))}
        </div>
      </section>
    </div>
  );
}
