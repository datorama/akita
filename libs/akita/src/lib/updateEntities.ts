import { hasEntity } from './hasEntity';
import { isFunction } from './isFunction';
import { isPlainObject } from './isPlainObject';
import { EntityState, ID, PreUpdateEntity, UpdateStateCallback } from './types';

export type UpdateEntitiesParams<State, Entity> = {
  state: State;
  ids: any[];
  idKey: string;
  newStateOrFn: UpdateStateCallback<Entity> | Partial<Entity> | Partial<State>;
  preUpdateEntity: PreUpdateEntity<Entity>;
  producerFn;
  onEntityIdChanges: (oldId: any, newId: any) => void;
};

/** @internal */
export function updateEntities<S extends EntityState<E>, E>({ state, ids, idKey, newStateOrFn, preUpdateEntity, producerFn, onEntityIdChanges }: UpdateEntitiesParams<S, E>) {
  const updatedEntities = {};

  let isUpdatingIdKey = false;
  let idToUpdate: ID;

  // eslint-disable-next-line no-restricted-syntax
  for (const id of ids) {
    // if the entity doesn't exist don't do anything
    if (hasEntity(state.entities, id) === false) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const oldEntity = state.entities[id];
    let newState;
    if (isFunction(newStateOrFn)) {
      newState = isFunction(producerFn) ? producerFn(oldEntity, newStateOrFn) : newStateOrFn(oldEntity);
    } else {
      newState = newStateOrFn;
    }

    const isIdChanged = Object.prototype.hasOwnProperty.call(newState, idKey) && newState[idKey] !== oldEntity[idKey];
    let newEntity: E;
    idToUpdate = id;

    if (isIdChanged) {
      isUpdatingIdKey = true;
      idToUpdate = newState[idKey];
    }

    const merged = {
      ...oldEntity,
      ...newState,
    };

    if (isPlainObject(oldEntity)) {
      newEntity = merged;
    } else {
      /**
       * In case that new state is class of it's own, there's
       * a possibility that it will be different than the old
       * class.
       * For example, Old state is an instance of animal class
       * and new state is instance of person class.
       * To avoid run over new person class with the old animal
       * class we check if the new state is a class of it's own.
       * If so, use it. Otherwise, use the old state class
       */
      // eslint-disable-next-line no-lonely-if
      if (isPlainObject(newState)) {
        newEntity = new (oldEntity as any).constructor(merged);
      } else {
        newEntity = new newState.constructor(merged);
      }
    }

    updatedEntities[idToUpdate] = preUpdateEntity(oldEntity, newEntity);
  }

  let updatedIds = state.ids;
  let stateEntities = state.entities;

  if (isUpdatingIdKey) {
    const [id] = ids;
    // TODO figure out was is going on here and fix the linting error
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [id]: deletedEntity, ...rest } = state.entities;
    stateEntities = rest;
    updatedIds = state.ids.map((current) => (current === id ? idToUpdate : current));
    onEntityIdChanges(id, idToUpdate);
  }

  return {
    ...state,
    entities: {
      ...stateEntities,
      ...updatedEntities,
    },
    ids: updatedIds,
  };
}
