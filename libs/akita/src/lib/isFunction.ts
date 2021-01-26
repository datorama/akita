/** @internal */
// eslint-disable-next-line @typescript-eslint/ban-types
export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}
