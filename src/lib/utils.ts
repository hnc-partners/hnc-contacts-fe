import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for merging Tailwind CSS classes
 *
 * Combines clsx for conditional classes with tailwind-merge
 * to handle Tailwind class conflicts correctly.
 *
 * @example
 * cn('text-red-500', condition && 'text-blue-500')
 * // Returns 'text-blue-500' when condition is true (tailwind-merge handles conflict)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
