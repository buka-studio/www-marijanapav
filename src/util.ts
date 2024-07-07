import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...classes: clsx.ClassValue[]) {
  return twMerge(clsx(classes));
}
