import { coerceArray } from './coerceArray';
import { DEFAULT_ID_KEY } from './defaultIDKey';
import { isFunction } from './isFunction';
import { isObject } from './isObject';
import { not } from './not';
import { IDS, ItemPredicate } from './types';

/**
 * Remove item from collection
 *
 * @example
 *
 *
 * store.update(state => ({
 *   names: arrayRemove(state.names, ['one', 'second'])
 * }))
 */
export function arrayRemove<T extends any[], Entity = any>(arr: T, identifier: IDS | ItemPredicate<Entity>, idKey = DEFAULT_ID_KEY): T {
  let identifiers;
  let filterFn;

  if (isFunction(identifier)) {
    filterFn = not(identifier);
  } else {
    identifiers = coerceArray(identifier);
    filterFn = (current) => {
      return identifiers.includes(isObject(current) ? current[idKey] : current) === false;
    };
  }

  if (Array.isArray(arr)) {
    return arr.filter(filterFn) as any;
  }
}
