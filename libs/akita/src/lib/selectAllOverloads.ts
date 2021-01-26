import { SortBy } from './queryConfig';
import { Order } from './sort';
import { SelectOptions } from './types';

export type SelectAllOptionsA<E> = { asObject: true; filterBy?: SelectOptions<E>['filterBy']; limitTo?: number; sortBy?: undefined; sortByOrder?: undefined };
export type SelectAllOptionsB<E> = { filterBy: SelectOptions<E>['filterBy']; limitTo?: number; sortBy?: SortBy<E>; sortByOrder?: Order };
export type SelectAllOptionsC<E> = { asObject: true; limitTo?: number; sortBy?: undefined; sortByOrder?: undefined };
export type SelectAllOptionsD<E> = { limitTo?: number; sortBy?: SortBy<E>; sortByOrder?: Order };
export type SelectAllOptionsE<E> = { asObject: false; filterBy?: SelectOptions<E>['filterBy']; limitTo?: number; sortBy?: SortBy<E>; sortByOrder?: Order };
