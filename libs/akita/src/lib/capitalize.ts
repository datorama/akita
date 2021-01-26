/** @internal */
export function capitalize(value: string): string {
  return value && value.charAt(0).toUpperCase() + value.slice(1);
}
