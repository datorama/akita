import { DEFAULT_ID_KEY } from './defaultIDKey';

/** @internal */
export function toEntitiesIds<E>(entities: E[], idKey = DEFAULT_ID_KEY): any[] {
  return entities.map((entity) => entity[idKey]);
}
