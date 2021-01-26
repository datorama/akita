import { Subscription } from 'rxjs';
import { setSkipAction } from './actions';
import { capitalize } from './capitalize';
import { $$addStore, $$deleteStore, $$updateStore } from './dispatchers';
import { isDefined } from './isDefined';
import { isNotBrowser } from './root';
import { __stores__ } from './store';

export type DevtoolsOptions = {
  /** instance name visible in devtools */
  name: string;
  /**  maximum allowed actions to be stored in the history tree */
  maxAge: number;
  latency: number;
  actionsBlacklist: string[];
  actionsWhitelist: string[];
  storesWhitelist: string[];
  shouldCatchErrors: boolean;
  logTrace: boolean;
  predicate: (state: any, action: any) => boolean;
  shallow: boolean;
  sortAlphabetically: boolean;
};
const subs: Subscription[] = [];

export type NgZoneLike = { run: <T>(fn: (...args: any[]) => T) => T };

/** @internal */
function isNgZone(option: NgZoneLike | Partial<DevtoolsOptions>): option is NgZoneLike {
  return !!(option as NgZoneLike).run;
}

export function akitaDevtools(ngZone: NgZoneLike, options?: Partial<DevtoolsOptions>): void;
export function akitaDevtools(options?: Partial<DevtoolsOptions>): void;
export function akitaDevtools(ngZoneOrOptions: NgZoneLike | Partial<DevtoolsOptions> = {}, options: Partial<DevtoolsOptions> = {}): void {
  if (isNotBrowser) return;

  if (!(window as any).__REDUX_DEVTOOLS_EXTENSION__) {
    return;
  }

  if (subs.length) {
    subs.forEach((s) => {
      // extra-boolean-cast is the correct way to check for function
      // eslint-disable-next-line no-extra-boolean-cast, @typescript-eslint/unbound-method
      if (!!s.unsubscribe) {
        s.unsubscribe();
      } else if (s) {
        (s as any)();
      }
    });
  }

  let ngZoneLikeOptions: NgZoneLike & Partial<DevtoolsOptions>;
  if (isNgZone(ngZoneOrOptions)) {
    ngZoneLikeOptions = { run: ngZoneOrOptions.run, ...options };
  } else {
    ngZoneLikeOptions = { run: <T>(cb): T => cb(), ...ngZoneOrOptions };
  }

  const defaultOptions: Partial<DevtoolsOptions> & { name: string } = { name: 'Akita', shallow: true, storesWhitelist: [] };
  const merged = { ...defaultOptions, ...ngZoneLikeOptions };
  const { storesWhitelist } = merged;
  const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect(merged);
  let appState = {};

  const isAllowed = (storeName): boolean => {
    if (!storesWhitelist.length) {
      return true;
    }

    return storesWhitelist.includes(storeName);
  };

  subs.push(
    $$addStore.subscribe((storeName) => {
      if (isAllowed(storeName) === false) return;
      appState = {
        ...appState,
        [storeName]: __stores__[storeName]._value(),
      };
      devTools.send({ type: `[${capitalize(storeName)}] - @@INIT` }, appState);
    })
  );

  subs.push(
    $$deleteStore.subscribe((storeName) => {
      if (isAllowed(storeName) === false) return;
      delete appState[storeName];
      devTools.send({ type: `[${storeName}] - Delete Store` }, appState);
    })
  );

  subs.push(
    $$updateStore.subscribe(({ storeName, action }) => {
      if (isAllowed(storeName) === false) return;
      const { type, entityIds, skip, ...rest } = action;

      const payload = rest.payload;
      if (skip) {
        setSkipAction(false);
        return;
      }

      const store = __stores__[storeName];
      if (!store) {
        return;
      }

      if (options.shallow === false && appState[storeName]) {
        const isEqual = JSON.stringify(store._value()) === JSON.stringify(appState[storeName]);
        if (isEqual) return;
      }

      appState = {
        ...appState,
        [storeName]: store._value(),
      };

      const normalize = capitalize(storeName);
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      const msg = isDefined(entityIds) ? `[${normalize}] - ${type} (ids: ${entityIds})` : `[${normalize}] - ${type}`;

      if (options.logTrace) {
        console.group(msg);
        console.trace();
        console.groupEnd();
      }

      if (options.sortAlphabetically) {
        const sortedAppState = Object.keys(appState)
          .sort()
          .reduce((acc, curStoreName) => {
            acc[curStoreName] = appState[curStoreName];
            return acc;
          }, {});

        devTools.send({ type: msg, ...payload }, sortedAppState);
        return;
      }

      devTools.send({ type: msg, ...payload }, appState);
    })
  );

  subs.push(
    devTools.subscribe((message) => {
      if (message.type === 'DISPATCH') {
        const payloadType = message.payload.type;

        if (payloadType === 'COMMIT') {
          devTools.init(appState);
          return;
        }

        if (message.state) {
          const rootState = JSON.parse(message.state);
          for (let i = 0, keys = Object.keys(rootState); i < keys.length; i++) {
            const storeName = keys[i];
            if (__stores__[storeName]) {
              merged.run(() => {
                __stores__[storeName]._setState(() => rootState[storeName], false);
              });
            }
          }
        }
      }
    })
  );
}
