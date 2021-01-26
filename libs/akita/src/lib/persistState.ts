import { from, isObservable, Observable, of, OperatorFunction, ReplaySubject, Subscription } from 'rxjs';
import { filter, map, skip } from 'rxjs/operators';
import { setAction } from './actions';
import { $$addStore, $$deleteStore } from './dispatchers';
import { getValue } from './getValueByString';
import { isFunction } from './isFunction';
import { isNil } from './isNil';
import { isObject } from './isObject';
import { hasLocalStorage, hasSessionStorage, isNotBrowser } from './root';
import { setValue } from './setValueByString';
import { __stores__ } from './store';
import { HashMap, MaybeAsync } from './types';

let skipStorageUpdateState = false;

const _persistStateInit = new ReplaySubject(1);

export function selectPersistStateInit(): Observable<unknown> {
  return _persistStateInit.asObservable();
}

export function setSkipStorageUpdate(skipUpdate: boolean): void {
  skipStorageUpdateState = skipUpdate;
}

export function getSkipStorageUpdate(): boolean {
  return skipStorageUpdateState;
}

export interface PersistStateStorage {
  getItem(key: string): MaybeAsync;

  setItem(key: string, value: any): MaybeAsync;

  clear(): void;
}

function isPromise(v: any): boolean {
  return v && isFunction(v.then);
}

function observify(asyncOrValue: any): Observable<unknown> {
  if (isPromise(asyncOrValue) || isObservable(asyncOrValue)) {
    return from(asyncOrValue);
  }

  return of(asyncOrValue);
}

export type PersistStateSelectFn<T = any> = ((store: T) => Partial<T>) & { storeName: string };

export interface PersistStateParams {
  /** The storage key */
  key: string;
  /** Whether to enable persistState in a non-browser environment */
  enableInNonBrowser: boolean;
  /** Storage strategy to use. This defaults to LocalStorage but you can pass SessionStorage or anything that implements the StorageEngine API. */
  storage: PersistStateStorage;
  /** Custom deserializer. Defaults to JSON.parse */
  // eslint-disable-next-line @typescript-eslint/ban-types
  deserialize: Function;
  /** Custom serializer, defaults to JSON.stringify */
  // eslint-disable-next-line @typescript-eslint/ban-types
  serialize: Function;
  /** By default the whole state is saved to storage, use this param to include only the stores you need. */
  include: (string | ((storeName: string) => boolean))[];
  /** By default the whole state is saved to storage, use this param to include only the data you need. */
  select: PersistStateSelectFn[];

  preStorageUpdate(storeName: string, state: any): any;
  preStorageUpdate(storeName: string, state: any): any;

  preStoreUpdate(storeName: string, state: any, initialState: any): any;
  preStoreUpdate(storeName: string, state: any): any;

  skipStorageUpdate: () => boolean;
  preStorageUpdateOperator: () => OperatorFunction<any, any>;
  /** Whether to persist a dynamic store upon destroy */
  persistOnDestroy: boolean;
}

export interface PersistState {
  destroy(): void;
  /**
   * @deprecated Use clearStore instead.
   */
  clear(): void;
  clearStore(storeName?: string): void;
}

export function persistState(params?: Partial<PersistStateParams>): PersistState {
  const defaults: PersistStateParams = {
    key: 'AkitaStores',
    enableInNonBrowser: false,
    storage: !hasLocalStorage() ? params.storage : localStorage,
    deserialize: JSON.parse,
    serialize: JSON.stringify,
    include: [],
    select: [],
    persistOnDestroy: false,
    preStorageUpdate(storeName, state) {
      return state;
    },
    preStoreUpdate(storeName, state) {
      return state;
    },
    skipStorageUpdate: getSkipStorageUpdate,
    preStorageUpdateOperator: () => (source): Observable<any> => source,
  };

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { storage, enableInNonBrowser, deserialize, serialize, include, select, key, preStorageUpdate, persistOnDestroy, preStorageUpdateOperator, preStoreUpdate, skipStorageUpdate } = Object.assign(
    {},
    defaults,
    params
  );

  if ((isNotBrowser && !enableInNonBrowser) || !storage) return;

  const hasInclude = include.length > 0;
  const hasSelect = select.length > 0;
  // eslint-disable-next-line @typescript-eslint/ban-types
  let includeStores: { fns: Function[]; [key: string]: Function[] | string };
  let selectStores: { [key: string]: PersistStateSelectFn };

  if (hasInclude) {
    includeStores = include.reduce(
      (accu, path) => {
        if (isFunction(path)) {
          accu.fns.push(path);
        } else {
          const storeName = path.split('.')[0];
          // reassigning reduce accumulator is perfectly legal
          // eslint-disable-next-line no-param-reassign
          accu[storeName] = path;
        }
        return accu;
      },
      { fns: [] }
    );
  }

  if (hasSelect) {
    selectStores = select.reduce((acc, selectFn) => {
      acc[selectFn.storeName] = selectFn;

      return acc;
    }, {});
  }

  let stores: HashMap<Subscription> = {};
  const acc = {};
  const subscriptions: Subscription[] = [];

  const buffer = [];

  function _save(v: any): void {
    observify(v).subscribe(() => {
      const next = buffer.shift();
      if (next) _save(next);
    });
  }

  // when we use the local/session storage we perform the serialize, otherwise we let the passed storage implementation to do it
  const isLocalStorage = (hasLocalStorage() && storage === localStorage) || (hasSessionStorage() && storage === sessionStorage);

  observify(storage.getItem(key)).subscribe((value: any) => {
    let storageState = isObject(value) ? value : deserialize(value || '{}');

    function save(storeCache): void {
      storageState.$cache = { ...(storageState.$cache || {}), ...storeCache };
      storageState = { ...storageState, ...acc };

      buffer.push(storage.setItem(key, isLocalStorage ? serialize(storageState) : storageState));
      _save(buffer.shift());
    }

    function subscribe(storeName, path): void {
      stores[storeName] = __stores__[storeName]
        ._select((state) => getValue(state, path))
        .pipe(
          skip(1),
          map((store) => {
            if (hasSelect && selectStores[storeName]) {
              return selectStores[storeName](store);
            }

            return store;
          }),
          filter(() => skipStorageUpdate() === false),
          preStorageUpdateOperator()
        )
        .subscribe((data) => {
          acc[storeName] = preStorageUpdate(storeName, data);
          void Promise.resolve().then(() => save({ [storeName]: __stores__[storeName]._cache().getValue() }));
        });
    }

    function setInitial(storeName, store, path): void {
      if (storeName in storageState) {
        setAction('@PersistState');
        store._setState((state) => {
          return setValue(state, path, preStoreUpdate(storeName, storageState[storeName], state));
        });
        const hasCache = storageState.$cache ? storageState.$cache[storeName] : false;
        __stores__[storeName].setHasCache(hasCache, { restartTTL: true });
      }
    }

    subscriptions.push(
      $$deleteStore.subscribe((storeName) => {
        if (stores[storeName]) {
          if (persistOnDestroy === false) {
            save({ [storeName]: false });
          }
          stores[storeName].unsubscribe();
          delete stores[storeName];
        }
      })
    );

    subscriptions.push(
      $$addStore.subscribe((storeName) => {
        if (storeName === 'router') {
          return;
        }

        const store = __stores__[storeName];
        if (hasInclude) {
          let path = includeStores[storeName];

          if (!path) {
            const passPredicate = includeStores.fns.some((fn) => fn(storeName));
            if (passPredicate) {
              path = storeName;
            } else {
              return;
            }
          }
          setInitial(storeName, store, path);
          subscribe(storeName, path);
        } else {
          setInitial(storeName, store, storeName);
          subscribe(storeName, storeName);
        }
      })
    );

    _persistStateInit.next();
  });

  return {
    destroy(): void {
      subscriptions.forEach((s) => s.unsubscribe());
      for (let i = 0, keys = Object.keys(stores); i < keys.length; i++) {
        const storeName = keys[i];
        stores[storeName].unsubscribe();
      }
      stores = {};
    },
    clear(): void {
      storage.clear();
    },
    clearStore(storeName?: string): void {
      if (isNil(storeName)) {
        const afterSaved$ = observify(storage.setItem(key, '{}'));
        afterSaved$.subscribe();
        return;
      }
      const value = storage.getItem(key);
      observify(value).subscribe((v) => {
        const storageState = deserialize(v || '{}');

        if (storageState[storeName]) {
          delete storageState[storeName];
          const afterSaved$ = observify(storage.setItem(key, serialize(storageState)));
          afterSaved$.subscribe();
        }
      });
    },
  };
}
