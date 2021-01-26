/** @internal */
// TODO isObject() determines that it's an object or a function? That's a bit odd...
// eslint-disable-next-line @typescript-eslint/ban-types
export function isObject(value: any): value is object | Function {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}
