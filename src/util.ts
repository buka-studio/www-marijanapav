import { ClassValue, clsx } from 'clsx';
import { formatHex, oklch } from 'culori';
import { twMerge } from 'tailwind-merge';

export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}

export function oklchToHex(oklchString: string) {
  const [l, c, h] = oklchString.split(' ').map(Number);
  const color = oklch({ l, c, h, mode: 'oklch' });

  return formatHex(color);
}
