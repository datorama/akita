import { Order } from './sort';

type SortByFunction<E, S = any> = (a: E, b: E, state?: S) => number;
type SortByKey<E> = keyof E;
export type SortBy<E, S = any> = SortByFunction<E, S> | SortByKey<E>;

interface SortByFunctionOptions<E> {
  sortBy?: SortByFunction<E>;
  sortByOrder?: undefined;
}

interface SortByKeyOptions<E> {
  sortBy?: SortByKey<E>;
  sortByOrder?: Order;
}

export type SortByOptions<E> = SortByFunctionOptions<E> | SortByKeyOptions<E>;

export type QueryConfigOptions<E = any> = SortByOptions<E>;

export const queryConfigKey = 'akitaQueryConfig';

export function QueryConfig<E>(metadata: QueryConfigOptions<E>) {
  return function(constructor: Function) {
    constructor[queryConfigKey] = {};
    for (let i = 0, keys = Object.keys(metadata); i < keys.length; i++) {
      const key = keys[i];
      constructor[queryConfigKey][key] = metadata[key];
    }
  };
}
