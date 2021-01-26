import { MonoTypeOperatorFunction, Observable, OperatorFunction } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { coerceArray } from './coerceArray';
import { DEFAULT_ID_KEY } from './defaultIDKey';
import { isArray } from './isArray';
import { isEmpty } from './isEmpty';
import { isFunction } from './isFunction';
import { ID, IDS, ItemPredicate } from './types';

/** @internal */
export function find<T>(collection: T[], idsOrPredicate: IDS | ItemPredicate, idKey: string): T[] {
  if (isFunction(idsOrPredicate)) {
    return collection.filter((entity) => idsOrPredicate(entity) === true);
  }

  const toSet = coerceArray(idsOrPredicate).reduce((acc, current) => acc.add(current), new Set());
  return collection.filter((entity) => toSet.has(entity[idKey]));
}

/** @internal */
function hasChange<T>(first: T[], second: T[]): boolean {
  return second.some((currentItem) => {
    const oldItem = first.find((prevItem) => prevItem === currentItem);
    return oldItem === undefined;
  });
}

/** @internal */
export function distinctUntilArrayItemChanged<T>(): MonoTypeOperatorFunction<T[]> {
  return distinctUntilChanged((prevCollection: T[], currentCollection: T[]) => {
    if (prevCollection === currentCollection) {
      return true;
    }

    if (isArray(prevCollection) === false || isArray(currentCollection) === false) {
      return false;
    }

    if (isEmpty(prevCollection) && isEmpty(currentCollection)) {
      return true;
    }

    // if item is new in the current collection but not exist in the prev collection
    const hasNewItem = hasChange(currentCollection, prevCollection);

    if (hasNewItem) {
      return false;
    }

    const isOneOfItemReferenceChanged = hasChange(prevCollection, currentCollection);

    // return false means there is a change and we want to call next()
    return isOneOfItemReferenceChanged === false;
  });
}

/**
 * Find items in a collection
 *
 * @example
 *
 * selectEntity(1, 'comments').pipe(
 *   arrayFind(comment => comment.text = 'text')
 * )
 */
export function arrayFind<T>(ids: ItemPredicate<T>, idKey?: never): MonoTypeOperatorFunction<T[]>;
/**
 * @example
 *
 * selectEntity(1, 'comments').pipe(
 *   arrayFind(3)
 * )
 */
export function arrayFind<T>(ids: ID, idKey?: string): OperatorFunction<T[], T>;
/**
 * @example
 *
 * selectEntity(1, 'comments').pipe(
 *   arrayFind([1, 2, 3])
 * )
 */
export function arrayFind<T>(ids: ID[], idKey?: string): MonoTypeOperatorFunction<T[]>;
export function arrayFind<T>(idsOrPredicate: ID[] | ID | ItemPredicate<T>, idKey?: string): OperatorFunction<T[], T[] | T> {
  return (source: Observable<T[]>): Observable<T | T[]> => {
    return source.pipe(
      map((collection: T[] | undefined | null) => {
        // which means the user deleted the root entity or set the collection to nil
        if (isArray(collection) === false) {
          return collection;
        }
        return find(collection, idsOrPredicate, idKey || DEFAULT_ID_KEY);
      }),
      distinctUntilArrayItemChanged(),
      map((value) => {
        if (isArray(value) === false) {
          return value;
        }

        if (isArray(idsOrPredicate) || isFunction(idsOrPredicate)) {
          return value;
        }

        return value[0];
      })
    );
  };
}
