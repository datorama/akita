import { hasEntity } from './hasEntity';
import { isArray } from './isArray';
import { ActiveState, EntityState, ID, IDS, MultiActiveState } from './types';

/** @internal */
export function hasActiveState<E>(state: EntityState<E>): state is EntityState<E> & (ActiveState | MultiActiveState) {
  return Object.prototype.hasOwnProperty.call(state, 'active');
}

/** @internal */
export function isMultiActiveState(active: IDS): active is ID[] {
  return isArray(active);
}

/** @internal */
export function getExitingActives(currentActivesIds: ID[], newIds: ID[]): ID[] {
  const filtered = currentActivesIds.filter((id) => newIds.includes(id));
  /** Return the same reference if nothing has changed */
  if (filtered.length === currentActivesIds.length) {
    return currentActivesIds;
  }

  return filtered;
}

/** @internal */
export function resolveActiveEntity<E>({ active, ids, entities }: EntityState<E> & (ActiveState | MultiActiveState)): ID | ID[] | null {
  if (isMultiActiveState(active)) {
    return getExitingActives(active, ids);
  }

  if (hasEntity(entities, active) === false) {
    return null;
  }

  return active;
}
