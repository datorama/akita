import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { currentAction, resetCustomAction, setAction, StoreSnapshotAction } from './actions';
import { getAkitaConfig, getGlobalProducerFn } from './config';
import { deepFreeze } from './deepFreeze';
import { dispatchAdded, dispatchDeleted, dispatchUpdate } from './dispatchers';
import { isDev } from './env';
import { assertStoreHasName } from './errors';
import { isDefined } from './isDefined';
import { isFunction } from './isFunction';
import { isPlainObject } from './isPlainObject';
import { isBrowser } from './root';
import { configKey, StoreConfigOptions, UpdatableStoreConfigOptions } from './storeConfig';
import { commit, isTransactionInProcess } from './transaction';
import { StoreCache, UpdateStateCallback } from './types';

/** @internal */
export const __stores__: { [storeName: string]: Store<any> } = {};

if (isBrowser && isDev()) {
  (window as any).$$stores = __stores__;
}

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
  setLoading(loading = false): void {
    if (loading !== (this._value() as S & { loading: boolean }).loading) {
      if (isDev()) setAction('Set Loading');
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
  setHasCache(hasCache: boolean, options: { restartTTL: boolean } = { restartTTL: false }): void {
    if (hasCache !== this.cache.active.value) {
      this.cache.active.next(hasCache);
    }

    if (options.restartTTL) {
      const ttlConfig = this.getCacheTTL();
      if (ttlConfig) {
        if (this.cache.ttl !== null) {
          clearTimeout(this.cache.ttl);
        }
        // TODO setTimeout() returns a timeoutID not a TTL
        this.cache.ttl = setTimeout(() => this.setHasCache(false), ttlConfig) as any;
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
  getValue(): S {
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
  setError<T>(error: T): void {
    if (error !== (this._value() as S & { error: any }).error) {
      if (isDev()) setAction('Set Error');
      this._setState((state) => ({ ...state, error } as S & { error: any }));
    }
  }

  /** @internal */
  _select<R>(project: (store: S) => R): Observable<R> {
    return this.store.asObservable().pipe(
      map((snapshot) => project(snapshot.state)),
      distinctUntilChanged()
    );
  }

  /** @internal */
  _value(): S {
    return this.storeValue;
  }

  /** @internal */
  _cache(): BehaviorSubject<boolean> {
    return this.cache.active;
  }

  /** @internal */
  get config(): StoreConfigOptions {
    return this.constructor[configKey] || {};
  }

  /** @internal */
  get storeName(): string {
    return (this.config as StoreConfigOptions & { storeName: string }).storeName || (this.options as StoreConfigOptions & { storeName: string }).storeName || this.options.name;
  }

  /** @internal */
  get deepFreeze(): StoreConfigOptions['deepFreezeFn'] {
    return this.config.deepFreezeFn || this.options.deepFreezeFn || deepFreeze;
  }

  /** @internal */
  get cacheConfig(): StoreConfigOptions['cache'] {
    return this.config.cache || this.options.cache;
  }

  get _producerFn(): StoreConfigOptions['producerFn'] {
    return this.config.producerFn || this.options.producerFn || getGlobalProducerFn();
  }

  /** @internal */
  get resettable(): boolean {
    return isDefined(this.config.resettable) ? this.config.resettable : this.options.resettable;
  }

  /** @internal */
  _setState(newState: ((state: Readonly<S>) => S) | S, _dispatchAction = true): void {
    if (isFunction(newState)) {
      const _newState = newState(this._value());
      this.storeValue = isDev() ? this.deepFreeze(_newState) : _newState;
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
  reset(): void {
    if (this.isResettable()) {
      if (isDev()) setAction('Reset');
      this._setState(() => ({ ...this._initialState }));
      this.setHasCache(false);
    } else if (isDev()) console.warn(`You need to enable the reset functionality`); // TODO add store name
  }

  /**
   * Update the store's value
   *
   * @example
   * this.store.update(state => {
   *   return {...}
   * })
   */
  update(stateCallback: UpdateStateCallback<S>): void;

  /**
   * @example
   *  this.store.update({ token: token })
   */
  update(state: Partial<S>): void;

  update(stateOrCallback: Partial<S> | UpdateStateCallback<S>): void {
    if (isDev()) setAction('Update');

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

  updateStoreConfig(newOptions: UpdatableStoreConfigOptions): void {
    this.options = { ...this.options, ...newOptions };
  }

  /** @internal */
  // eslint-disable-next-line class-methods-use-this
  akitaPreUpdate(_: Readonly<S>, nextState: Readonly<S>) {
    return nextState;
  }

  ngOnDestroy(): void {
    // TODO this is angular specific?
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
  destroy(): void {
    const hmrEnabled = isBrowser ? (window as any).hmrEnabled : false;
    if (!hmrEnabled && this === __stores__[this.storeName]) {
      delete __stores__[this.storeName];
      dispatchDeleted(this.storeName);
      this.setHasCache(false);
      this.cache.active.complete();
      this.store.complete();
    }
  }

  private onInit(initialState: S): void {
    __stores__[this.storeName] = this;
    this._setState(() => initialState);
    dispatchAdded(this.storeName);
    if (this.isResettable()) {
      this._initialState = initialState;
    }
    if (isDev()) assertStoreHasName(this.storeName, this.constructor.name);
  }

  private dispatch(state: S, _dispatchAction = true): void {
    let action: StoreSnapshotAction | undefined;

    if (_dispatchAction) {
      action = currentAction;
      resetCustomAction();
    }

    this.store.next({ state, action });
  }

  private watchTransaction(): void {
    commit().subscribe(() => {
      this.inTransaction = false;
      this.dispatch(this._value());
    });
  }

  private isResettable(): boolean {
    if (this.resettable === false) {
      return false;
    }
    return this.resettable || getAkitaConfig().resettable;
  }

  private handleTransaction(): void {
    if (!this.inTransaction) {
      this.watchTransaction();
      this.inTransaction = true;
    }
  }

  private getCacheTTL(): number {
    return (this.cacheConfig && this.cacheConfig.ttl) || getAkitaConfig().ttl;
  }
}
