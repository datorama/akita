import { isString } from './isString';
import { isUndefined } from './isUndefined';
import { HashMap, ItemPredicate } from './types';

/** @internal */
export function findEntityByPredicate<E>(predicate: ItemPredicate<E>, entities: HashMap<any>): string | undefined {
  return Object.keys(entities).find((entityId) => predicate(entities[entityId]));
}

/** @internal */
export function getEntity(id, project) {
  return (entities): any => {
    const entity = entities[id];

    if (isUndefined(entity)) {
      return undefined;
    }

    if (!project) {
      return entity;
    }

    if (isString(project)) {
      return entity[project];
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    return (project as Function)(entity);
  };
}
