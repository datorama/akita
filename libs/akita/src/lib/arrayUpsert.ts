import { ID } from './types';
import { DEFAULT_ID_KEY } from './defaultIDKey';
import { arrayAdd } from './arrayAdd';
import { arrayUpdate } from './arrayUpdate';
import { isObject } from './isObject';
import { isArray } from './isArray';
import { coerceArray } from './coerceArray';

/**
 * Upsert item/s in a collection
 *
 * @example
 *
 * // upsert single
 * store.update(1, entity => ({
 *   comments: arrayUpsert(entity.comments, 1, { name: 'newComment' })
 * }))
 *
 * @example
 *
 * // upsert many
 * store.update(1, entities => ({
     comments: arrayUpsert(entities, newEntities, 'idKey')
 }));
 */
export function arrayUpsert<Root extends any[], Entity extends object[]>(arr: Root, objs: Entity, idKey?: string): Root[0][];
export function arrayUpsert<Root extends any[]>(arr: Root, id: ID, obj: Partial<Root[0]>, idKey?: string): Root[0][];
export function arrayUpsert<Root extends any[]>(arr: Root, objsOrId: Partial<Root> | ID, objOrIdKey: Partial<Root[0]> | ID = DEFAULT_ID_KEY, idKey = DEFAULT_ID_KEY): Root[0][] {
  let updatedRoot = [...coerceArray(arr)];
  if (isArray(objsOrId)) {
    idKey = objOrIdKey as string;
    const objs = objsOrId as Partial<Root>;
    objs.map((obj) => {
      const entityIsObject = isObject(obj);
      if (entityIsObject) {
        const id = obj[idKey];
        updatedRoot = upsert(updatedRoot, obj, id);
      }
    });
    return updatedRoot;
  } else {
    const obj = objOrIdKey as Partial<Root[0]>;
    const id = objsOrId as ID;
    return upsert(updatedRoot, obj, id);
  }

  function upsert(updatedArr, obj, id) {
    const entityIsObject = isObject(obj);
    const entityExists = updatedArr.some((entity) => (entityIsObject ? entity[idKey] === id : entity === id));
    if (entityExists) {
      return arrayUpdate(updatedArr, id, obj, idKey);
    } else {
      return arrayAdd(updatedArr, entityIsObject ? { ...obj, [idKey]: id } : obj);
    }
  }
}
