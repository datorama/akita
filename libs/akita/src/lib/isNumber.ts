import { isArray } from './isArray';

/** @internal */
export function isNumber(value: any): value is number {
  return !isArray(value) && value - parseFloat(value) + 1 >= 0;
}
