import { isArray } from './isArray';
import { isNil } from './isNil';
import { isObject } from './isObject';
import { OrArray } from './types';

export type SetActiveOptions = { prev?: boolean; next?: boolean; wrap?: boolean };

/** @internal */
// eslint-disable-next-line complexity
export function getActiveEntities<IDType>(idsOrOptions: OrArray<IDType> | SetActiveOptions | null, ids: IDType[], currentActive: IDType | null): OrArray<IDType> | undefined {
  let result: OrArray<IDType>;

  if (isArray(idsOrOptions)) {
    result = idsOrOptions;
  } else if (isObject(idsOrOptions)) {
    if (isNil(currentActive)) return undefined;
    const idOrOptionsCopy = { wrap: true, ...idsOrOptions };
    const currentIdIndex = ids.indexOf(currentActive);
    if (idOrOptionsCopy.prev) {
      const isFirst = currentIdIndex === 0;
      if (isFirst && !idOrOptionsCopy.wrap) return undefined;
      result = isFirst ? ids[ids.length - 1] : ids[currentIdIndex - 1];
    } else if (idOrOptionsCopy.next) {
      const isLast = ids.length === currentIdIndex + 1;
      if (isLast && !idOrOptionsCopy.wrap) return undefined;
      result = isLast ? ids[0] : ids[currentIdIndex + 1];
    }
  } else {
    if (idsOrOptions === currentActive) return undefined;
    result = idsOrOptions;
  }

  return result;
}
