import { hasActiveState, isMultiActiveState, resolveActiveEntity } from './activeState';
import { isNil } from './isNil';
import { EntityState, StateWithActive } from './types';

export interface RemoveEntitiesParams<State, Entity> {
  state: StateWithActive<State>;
  ids: any[];
}

/** @internal */
export function removeAllEntities<S>(state: StateWithActive<S>): S {
  return {
    ...state,
    entities: {},
    ids: [],
    active: isMultiActiveState(state.active) ? [] : null,
  };
}

/** @internal */
export function removeEntities<S extends EntityState<E>, E>({ state, ids }: RemoveEntitiesParams<S, E>): S {
  if (isNil(ids)) return removeAllEntities(state);
  const { entities } = state;
  const newEntities = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const id of state.ids) {
    if (ids.includes(id) === false) {
      newEntities[id] = entities[id];
    }
  }

  const newState = {
    ...state,
    entities: newEntities,
    ids: state.ids.filter((current) => ids.includes(current) === false),
  };

  if (hasActiveState(state)) {
    newState.active = resolveActiveEntity(newState);
  }

  return newState;
}
