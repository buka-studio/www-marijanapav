import { useCallback, useMemo, useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
// What was last written here, for when the browser keeps no storage: private windows, blocked cookies.
const written = new Map<string, string>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab wrote.
  window.addEventListener('storage', listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function read(key: string) {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored !== null) {
      return stored;
    }
  } catch {
    // No storage: what was written in this window is all there is.
  }

  return written.get(key) ?? null;
}

function parse<T>(raw: string | null, fallback: T, isValid?: (value: unknown) => value is T) {
  if (raw === null) {
    return fallback;
  }

  try {
    const value: unknown = JSON.parse(raw);

    return !isValid || isValid(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

// A value kept in local storage as JSON. It is `fallback` on the server, while hydrating, and
// whenever what is stored isn't valid. Pass a stable `isValid`.
export default function useLocalStorage<T>(
  key: string,
  fallback: T,
  isValid?: (value: unknown) => value is T,
) {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const value = useMemo(() => parse(raw, fallback, isValid), [raw, fallback, isValid]);

  const setValue = useCallback(
    (next: T) => {
      const stored = JSON.stringify(next);
      written.set(key, stored);
      try {
        window.localStorage.setItem(key, stored);
      } catch {
        // Kept for this window only.
      }
      listeners.forEach((listener) => listener());
    },
    [key],
  );

  return [value, setValue] as const;
}
