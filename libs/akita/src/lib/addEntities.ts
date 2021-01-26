import { hasEntity } from './hasEntity';
import { EntityState, PreAddEntity } from './types';

export interface AddEntitiesParams<State, Entity> {
  state: State;
  entities: Entity[];
  idKey: string;
  options: AddEntitiesOptions;
  preAddEntity: PreAddEntity<Entity>;
}

export interface AddEntitiesOptions {
  prepend?: boolean;
  loading?: boolean;
}

/** @internal */
export function addEntities<S extends EntityState<E>, E>({ state, entities, idKey, options = {}, preAddEntity }: AddEntitiesParams<S, E>): { newState: S; newIds: any[] } | null {
  const newEntities = {};
  const newIds = [];
  let hasNewEntities = false;

  // eslint-disable-next-line no-restricted-syntax
  for (const entity of entities) {
    if (hasEntity(state.entities, entity[idKey]) === false) {
      // evaluate the middleware first to support dynamic ids
      const current = preAddEntity(entity);
      const entityId = current[idKey];
      newEntities[entityId] = current;
      if (options.prepend) {
        newIds.unshift(entityId);
      } else {
        newIds.push(entityId);
      }

      hasNewEntities = true;
    }
  }

  return hasNewEntities
    ? {
        newState: {
          ...state,
          entities: {
            ...state.entities,
            ...newEntities,
          },
          ids: options.prepend ? [...newIds, ...state.ids] : [...state.ids, ...newIds],
        },
        newIds,
      }
    : null;
}
