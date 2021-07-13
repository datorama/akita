import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { currentAction, resetCustomAction, setAction, StoreSnapshotAction } from './actions';
import { getAkitaConfig, getGlobalProducerFn } from './config';
import { deepFreeze } from './deepFreeze';
import { dispatchAdded, dispatchDeleted, dispatchUpdate } from './dispatchers';
import { isDev, __DEV__ } from './env';
import { assertStoreHasName } from './errors';
import { isDefined } from './isDefined';
import { isFunction } from './isFunction';
import { isPlainObject } from './isPlainObject';
import { isBrowser } from './root';
import { configKey, StoreConfigOptions, UpdatableStoreConfigOptions } from './storeConfig';
import { __stores__ } from './stores';
import { commit, isTransactionInProcess } from './transaction';
import { StoreCache, UpdateStateCallback } from './types';

interface StoreSnapshot<S> {
  state: S;
  action?: StoreSnapshotAction;
}

/**
 *
 * Store for managing any type of data
 *
 * @example
 *
 * export interface SessionState {
 *   token: string;
 *   userDetails: UserDetails
 * }
 *
 * export function createInitialState(): SessionState {
 *  return {
 *    token: '',
 *    userDetails: null
 *  };
 * }
 *
 * @StoreConfig({ name: 'session' })
 * export class SessionStore extends Store<SessionState> {
 *   constructor() {
 *    super(createInitialState());
 *   }
 * }
 */
export class Store<S = any> {
  private store: BehaviorSubject<Readonly<StoreSnapshot<S>>>;
  private storeValue: S;
  private inTransaction = false;
  private _initialState: S;
  protected cache: StoreCache = {
    active: new BehaviorSubject<boolean>(false),
    ttl: null,
  };

  constructor(initialState: Partial<S>, protected options: Partial<StoreConfigOptions> = {}) {
    this.onInit(initialState as S);
  }

  /**
   *  Set the loading state
   *
   *  @example
   *
   *  store.setLoading(true)
   *
   */
  setLoading(loading = false) {
    if (loading !== (this._value() as S & { loading: boolean }).loading) {
      isDev() && setAction('Set Loading');
      this._setState((state) => ({ ...state, loading } as S & { loading: boolean }));
    }
  }

  /**
   *
   * Set whether the data is cached
   *
   * @example
   *
   * store.setHasCache(true)
   * store.setHasCache(false)
   * store.setHasCache(true, { restartTTL: true })
   *
   */
  setHasCache(hasCache: boolean, options: { restartTTL: boolean } = { restartTTL: false }) {
    if (hasCache !== this.cache.active.value) {
      this.cache.active.next(hasCache);
    }

    if (options.restartTTL) {
      const ttlConfig = this.getCacheTTL();
      if (ttlConfig) {
        if (this.cache.ttl !== null) {
          clearTimeout(this.cache.ttl);
        }
        this.cache.ttl = <any>setTimeout(() => this.setHasCache(false), ttlConfig);
      }
    }
  }

  /**
   *
   * Sometimes we need to access the store value from a store
   *
   * @example middleware
   *
   */
  getValue() {
    return this.storeValue;
  }

  /**
   *  Set the error state
   *
   *  @example
   *
   *  store.setError({text: 'unable to load data' })
   *
   */
  setError<T>(error: T) {
    if (error !== (this._value() as S & { error: any }).error) {
      isDev() && setAction('Set Error');
      this._setState((state) => ({ ...state, error } as S & { error: any }));
    }
  }

  // @internal
  _select<R>(project: (store: S) => R): Observable<R> {
    return this.store.asObservable().pipe(
      map((snapshot) => project(snapshot.state)),
      distinctUntilChanged()
    );
  }

  // @internal
  _value(): S {
    return this.storeValue;
  }

  // @internal
  _cache(): BehaviorSubject<boolean> {
    return this.cache.active;
  }

  // @internal
  get config(): StoreConfigOptions {
    return this.constructor[configKey] || {};
  }

  // @internal
  get storeName() {
    return (this.config as StoreConfigOptions & { storeName: string }).storeName || (this.options as StoreConfigOptions & { storeName: string }).storeName || this.options.name;
  }

  // @internal
  get deepFreeze() {
    return this.config.deepFreezeFn || this.options.deepFreezeFn || deepFreeze;
  }

  // @internal
  get cacheConfig() {
    return this.config.cache || this.options.cache;
  }

  get _producerFn() {
    return this.config.producerFn || this.options.producerFn || getGlobalProducerFn();
  }

  // @internal
  get resettable() {
    return isDefined(this.config.resettable) ? this.config.resettable : this.options.resettable;
  }

  // @internal
  get disabledTracking() {
    return isDefined(this.config.disableTracking) ? this.config.disableTracking : this.options.disableTracking;
  }

  // @internal
  _setState(newState: ((state: Readonly<S>) => S) | S, _dispatchAction = true) {
    if (isFunction(newState)) {
      const _newState = newState(this._value());
      this.storeValue = __DEV__ ? this.deepFreeze(_newState) : _newState;
    } else {
      this.storeValue = newState;
    }

    if (!this.store) {
      this.store = new BehaviorSubject({ state: this.storeValue });

      if (isDev()) {
        this.store.subscribe(({ action }) => {
          if (action) {
            dispatchUpdate(this.storeName, action);
          }
        });
      }

      return;
    }

    if (isTransactionInProcess()) {
      this.handleTransaction();
      return;
    }

    this.dispatch(this.storeValue, _dispatchAction);
  }

  /**
   *
   * Reset the current store back to the initial value
   *
   * @example
   *
   * store.reset()
   *
   */
  reset() {
    if (this.isResettable()) {
      isDev() && setAction('Reset');
      this._setState(() => Object.assign({}, this._initialState));
      this.setHasCache(false);
    } else {
      isDev() && console.warn(`You need to enable the reset functionality`);
    }
  }

  /**
   *
   * Update the store's value
   *
   * @example
   *
   * this.store.update(state => {
   *   return {...}
   * })
   */
  update(stateCallback: UpdateStateCallback<S>);
  /**
   *
   * @example
   *
   *  this.store.update({ token: token })
   */
  update(state: Partial<S>);
  update(stateOrCallback: Partial<S> | UpdateStateCallback<S>) {
    isDev() && setAction('Update');

    let newState;
    const currentState = this._value();
    if (isFunction(stateOrCallback)) {
      newState = isFunction(this._producerFn) ? this._producerFn(currentState, stateOrCallback) : stateOrCallback(currentState);
    } else {
      newState = stateOrCallback;
    }

    const withHook = this.akitaPreUpdate(currentState, { ...currentState, ...newState } as S);
    const resolved = isPlainObject(currentState) ? withHook : new (currentState as any).constructor(withHook);
    this._setState(resolved);
  }

  updateStoreConfig(newOptions: UpdatableStoreConfigOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  // @internal
  akitaPreUpdate(_: Readonly<S>, nextState: Readonly<S>): S {
    return nextState;
  }

  /**
   *
   * @deprecated
   *
   * This method will be removed in v7
   *
   * Akita isn't coupled to Angular and should not use Angular
   * specific code
   *
   */
  ngOnDestroy() {
    this.destroy();
  }

  /**
   *
   * Destroy the store
   *
   * @example
   *
   * store.destroy()
   *
   */
  destroy() {
    const hmrEnabled = isBrowser ? (window as any).hmrEnabled : false;
    if (!hmrEnabled && this === __stores__[this.storeName]) {
      delete __stores__[this.storeName];
      dispatchDeleted(this.storeName);
      this.setHasCache(false);
      this.cache.active.complete();
      this.store.complete();
    }
  }

  private onInit(initialState: S) {
    __stores__[this.storeName] = this;
    this._setState(() => initialState);
    dispatchAdded(this.storeName);
    if (this.isResettable()) {
      this._initialState = initialState;
    }
    isDev() && assertStoreHasName(this.storeName, this.constructor.name);
  }

  private dispatch(state: S, _dispatchAction = true) {
    let action: StoreSnapshotAction | undefined = undefined;

    if (_dispatchAction) {
      action = currentAction;
      resetCustomAction();
    }

    this.store.next({ state, action });
  }

  private watchTransaction() {
    commit().subscribe(() => {
      this.inTransaction = false;
      this.dispatch(this._value());
    });
  }

  private isResettable() {
    if (this.resettable === false) {
      return false;
    }
    return this.resettable || getAkitaConfig().resettable;
  }

  private handleTransaction() {
    if (!this.inTransaction) {
      this.watchTransaction();
      this.inTransaction = true;
    }
  }

  private getCacheTTL() {
    return (this.cacheConfig && this.cacheConfig.ttl) || getAkitaConfig().ttl;
  }
}
