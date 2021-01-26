import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Diff } from './types';

/**
 * @example
 *
 * query.selectEntity(2).pipe(filterNil)
 */
export const filterNil = <T>(source: Observable<T | undefined | null>): Observable<Diff<T, null>> =>
  source.pipe(filter((value): value is Diff<T, null | undefined> => value !== null && typeof value !== 'undefined'));
