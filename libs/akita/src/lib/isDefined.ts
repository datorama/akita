import { isNil } from './isNil';

/** @internal */
export function isDefined<T>(val: T): val is T {
  return isNil(val) === false;
}
