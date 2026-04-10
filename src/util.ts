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

export function supportsHtmlInCanvas() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  const canvas = document.createElement('canvas') as HTMLCanvasElement & {
    requestPaint?: () => void;
  };
  const gl = canvas.getContext('webgl') as
    | (WebGLRenderingContext & {
        texElementImage2D?: (
          target: number,
          level: number,
          internalformat: number,
          format: number,
          type: number,
          element: Element,
        ) => void;
      })
    | null;

  return typeof canvas.requestPaint === 'function' && typeof gl?.texElementImage2D === 'function';
}
