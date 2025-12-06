import { ClassValue, clsx } from 'clsx';
import { formatHex, parse } from 'culori';
import ReactDOM from 'react-dom';
import { twMerge } from 'tailwind-merge';

export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}

export function oklabToHex(oklabString: string) {
  const color = parse(oklabString);

  return formatHex(color);
}

export async function withTimeout<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = 1000,
): Promise<T> {
  let timer: NodeJS.Timeout;

  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

export function preloadImage(url: string) {
  return ReactDOM.preload(url, { as: 'image' });
}
