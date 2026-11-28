import { useCallback, useMemo, useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
// used when storage is blocked (private windows)
const inMemory = new Map<string, string>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function readStored(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  inMemory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function read(key: string) {
  return readStored(key) ?? inMemory.get(key) ?? null;
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
      writeStored(key, JSON.stringify(next));
      listeners.forEach((listener) => listener());
    },
    [key],
  );

  return [value, setValue] as const;
}
