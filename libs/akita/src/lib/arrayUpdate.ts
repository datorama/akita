import { coerceArray } from './coerceArray';
import { DEFAULT_ID_KEY } from './defaultIDKey';
import { isFunction } from './isFunction';
import { isObject } from './isObject';
import { IDS, ItemPredicate } from './types';
import { isArray } from './isArray';

/**
 * Update item in a collection
 *
 * @example
 *
 *
 /** store.update(1, entity => ({
 *   comments: arrayUpdate(entity.comments, 1, { name: 'newComment' })
 * }))
 *
 * @example
 * store.update(1, entity => ({
 *   comments: arrayUpdate(entity.comments, [{ id: 1, name: 'newComment1' }, { id: 2, name: 'newComment2' }])
 * }))
 */
export function arrayUpdate<T extends any[], Entity = object>(arr: T, objs: Partial<Entity>[], idKey?: string): T;
export function arrayUpdate<T extends any[], Entity = any>(arr: T, predicateOrIds: IDS | ItemPredicate<Entity>, obj: Partial<Entity>, idKey?: string): T;
export function arrayUpdate<T extends any[], Entity = any>(
  arr: T,
  predicateOrIdsOrObjs: IDS | ItemPredicate<Entity> | Partial<Entity>[],
  objOrIdKey: Partial<Entity> | string,
  idKey = DEFAULT_ID_KEY
): T {
  let condition: ItemPredicate<Entity>;
  let obj: Partial<Entity> | Partial<Entity>[];

  if (isFunction(predicateOrIdsOrObjs)) {
    obj = objOrIdKey as Partial<Entity>;
    condition = predicateOrIdsOrObjs;
  } else {
    const ids = coerceArray<IDS | Partial<Entity>[]>(predicateOrIdsOrObjs);
    if (isObject(ids[0])) {
      obj = predicateOrIdsOrObjs as Partial<Entity>[];
      condition = (item) =>
        (<Partial<Entity>[]>obj).some((objItem) => {
          return objItem[idKey] === item[idKey];
        });
      idKey = (objOrIdKey as string) || idKey;
    } else {
      condition = (item) => ids.includes(isObject(item) ? item[idKey] : item) === true;
      obj = objOrIdKey as Partial<Entity>;
    }
  }

  const updateFn = (state) =>
    state.map((entity, index) => {
      if (condition(entity, index) === true) {
        return isObject(entity)
          ? {
              ...entity,
              ...(isArray(obj) ? obj.find((item) => item[idKey] === entity[idKey]) : obj),
            }
          : obj;
      }

      return entity;
    });

  return updateFn(arr);
}
