import { isNil } from './isNil';

/** @internal */
export function coerceArray<T>(value: T | T[]): T[] {
  if (isNil(value)) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
