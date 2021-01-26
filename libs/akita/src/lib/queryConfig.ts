import { Order } from './sort';

export type SortBy<E, S = any> = ((a: E, b: E, state?: S) => number) | keyof E;

export interface SortByOptions<E> {
  sortBy?: SortBy<E>;
  sortByOrder?: Order;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueryConfigOptions<E = any> extends SortByOptions<E> {}

export const queryConfigKey = 'akitaQueryConfig';

export function QueryConfig<E>(metadata: QueryConfigOptions<E>) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (constructor: Function): void => {
    // eslint-disable-next-line no-param-reassign
    constructor[queryConfigKey] = { ...metadata };
  };
}
