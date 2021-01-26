import { toBoolean } from './toBoolean';

/** @internal */
// eslint-disable-next-line @typescript-eslint/ban-types
export function isPlainObject(value): value is object {
  return toBoolean(value) && value.constructor.name === 'Object';
}
