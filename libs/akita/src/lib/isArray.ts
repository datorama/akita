/** @internal */
export function isArray<T>(value: any): value is T[] {
  return Array.isArray(value);
}
