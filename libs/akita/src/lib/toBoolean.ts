/** @internal */
export function toBoolean(value: any): boolean {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return value != null && `${value}` !== 'false';
}
