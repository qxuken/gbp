import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getShortName(name?: string) {
  return (
    name
      ?.split(' ')
      .map((p) => p[0]?.toUpperCase())
      .join('') ?? '??'
  );
}

export function clamp(min: number, value: number, max: number) {
  return Math.max(min, Math.min(value, max));
}
