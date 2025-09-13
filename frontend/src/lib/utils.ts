/**
 * Combine multiple class names into a single string.
 * Filters out `false`, `null`, and `undefined`, but keeps numbers and truthy strings.
 *
 * @param classes - A list of class names or falsy values.
 * @returns A space-separated string of class names.
 *
 * @example
 * cn('btn', isActive && 'btn-active', null, undefined, false, 'extra')
 * // "btn btn-active extra"
 */

///Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/frontend/src/lib/api.ts
export function cn(...classes: Array<string | number | false | null | undefined>): string {
  return classes.filter((c) => typeof c === 'string' || typeof c === 'number').join(' ');
}
