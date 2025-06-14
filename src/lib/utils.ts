import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges class names, resolving Tailwind CSS class conflicts.
 *
 * Accepts any number of class name values, conditionally joins them using {@link clsx}, and merges them with {@link twMerge} to ensure Tailwind CSS classes are deduplicated and conflicts are resolved.
 *
 * @param inputs - Class name values to combine and merge.
 * @returns A single string of merged class names suitable for use with Tailwind CSS.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
