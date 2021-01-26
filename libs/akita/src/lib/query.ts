import { Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { compareKeys } from './compareKeys';
import { isDev } from './env';
import { isFunction } from './isFunction';
import { isString } from './isString';
import { queryConfigKey, QueryConfigOptions } from './queryConfig';
import { isBrowser } from './root';
import { Store } from './store';
import { ReturnTypes } from './types';

/** @internal */
const __queries__: { [storeName: string]: Query<any> } = {};

if (isBrowser && isDev()) {
  (window as any).$$queries = __queries__;
}

export class Query<S> {
  /** @internal */
  __store__: Store<S>;

  constructor(protected store: Store<S>) {
    this.__store__ = store;
    if (isDev()) {
      /** @internal */
      __queries__[store.storeName] = this;
    }
  }

  /**
   * Select a slice from the store
   *
   * @example
   *
   * this.query.select()
   * this.query.select(state => state.entities)
   * this.query.select('token');
   * this.query.select(['name', 'email'])
   * this.query.select([state => state.name, state => state.age])
   *
   */
  select<K extends keyof S>(key: K): Observable<S[K]>;

  select<R>(project: (store: S) => R): Observable<R>;

  select<K extends keyof S>(stateKeys: K[]): Observable<Pick<S, K>>;

  select<R extends [(state: S) => any] | ((state: S) => any)[]>(selectorFns: R): Observable<ReturnTypes<R>>;

  select(): Observable<S>;

  select<R>(project?: ((store: S) => R) | keyof S | (keyof S)[] | ((state: S) => any)[]): Observable<R | S | any[]> {
    let mapFn;
    if (isFunction(project)) {
      mapFn = project;
    } else if (isString(project)) {
      mapFn = (state): any => state[project];
    } else if (Array.isArray(project)) {
      return this.store
        ._select((state) => state)
        .pipe(
          distinctUntilChanged(compareKeys(project)),
          map((state) => {
            if (isFunction(project[0])) {
              return (project as ((state: S) => any)[]).map((func) => func(state));
            }

            return (project as (keyof S)[]).reduce((acc, k) => {
              acc[k as any] = state[k];
              return acc;
            }, {});
          })
        ) as any;
    } else {
      mapFn = (state): any => state;
    }

    return this.store._select(mapFn);
  }

  /**
   * Select the loading state
   *
   * @example
   *
   * this.query.selectLoading().subscribe(isLoading => {})
   */
  selectLoading(): Observable<boolean> {
    return this.select((state) => (state as S & { loading: boolean }).loading);
  }

  /**
   * Select the error state
   *
   * @example
   *
   * this.query.selectError().subscribe(error => {})
   */
  selectError<ErrorType = any>(): Observable<ErrorType> {
    return this.select((state) => (state as S & { error: ErrorType }).error);
  }

  /**
   * Get the store's value
   *
   * @example
   *
   * this.query.getValue()
   *
   */
  getValue(): S {
    return this.store._value();
  }

  /**
   * Select the cache state
   *
   * @example
   *
   * this.query.selectHasCache().pipe(
   *   switchMap(hasCache => {
   *     return hasCache ? of() : http().pipe(res => store.set(res))
   *   })
   * )
   */
  selectHasCache(): Observable<boolean> {
    return this.store._cache().asObservable();
  }

  /**
   * Whether we've cached data
   *
   * @example
   *
   * this.query.getHasCache()
   *
   */
  getHasCache(): boolean {
    return this.store._cache().value;
  }

  /** @internal */
  get config(): QueryConfigOptions {
    return this.constructor[queryConfigKey];
  }
}
