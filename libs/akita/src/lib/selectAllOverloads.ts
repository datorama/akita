import { SelectOptions } from './types';
import { SortByOptions } from './queryConfig';

export type SelectAllOptionsA<E> = { asObject: true; filterBy?: SelectOptions<E>['filterBy']; limitTo?: number; sortBy?: undefined; sortByOrder?: undefined };
export type SelectAllOptionsB<E> = { filterBy: SelectOptions<E>['filterBy']; limitTo?: number; } & SortByOptions<E>
export type SelectAllOptionsC<E> = { asObject: true; limitTo?: number; sortBy?: undefined; sortByOrder?: undefined };
export type SelectAllOptionsD<E> = { limitTo?: number; } & SortByOptions<E>
export type SelectAllOptionsE<E> = { asObject: false; filterBy?: SelectOptions<E>['filterBy']; limitTo?: number; } & SortByOptions<E>
