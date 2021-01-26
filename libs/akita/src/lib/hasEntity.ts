import { EntityState, ID } from './types';

/** @internal */
export function hasEntity<E>(entities: EntityState<E>, id: ID): boolean {
  return Object.prototype.hasOwnProperty.call(entities, id);
}
