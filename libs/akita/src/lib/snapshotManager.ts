/* eslint-disable class-methods-use-this */
import { filter, take } from 'rxjs/operators';
import { $$addStore } from './dispatchers';
import { isString } from './isString';
import { setSkipStorageUpdate } from './persistState';
import { __stores__ } from './store';

export class SnapshotManager {
  /**
   * Get a snapshot of the whole state or a specific stores
   * Use it ONLY for things such as saving the state in the server
   */
  getStoresSnapshot(stores: string[] = []): Record<string, unknown> {
    const hasInclude = stores.length > 0;
    const keys = hasInclude ? stores : Object.keys(__stores__);

    return keys.reduce((accu, storeName) => {
      if (storeName !== 'router') {
        // reassigning reduce accumulator is perfectly legal
        // eslint-disable-next-line no-param-reassign
        accu[storeName] = __stores__[storeName]._value();
      }
      return accu;
    }, {});
  }

  setStoresSnapshot(stores: { [storeName: string]: any } | string, options?: { skipStorageUpdate?: boolean; lazy?: boolean }): void {
    const mergedOptions = { ...{ skipStorageUpdate: false, lazy: false }, ...options };
    if (mergedOptions.skipStorageUpdate) setSkipStorageUpdate(true);

    let normalizedStores = stores;

    if (isString(stores)) {
      normalizedStores = JSON.parse(normalizedStores as string);
    }

    const size = Object.keys(normalizedStores).length;

    if (mergedOptions.lazy) {
      $$addStore
        .pipe(
          filter((name) => Object.prototype.hasOwnProperty.call(normalizedStores, name)),
          take(size)
        )
        .subscribe((name) => __stores__[name]._setState(() => normalizedStores[name]));
    } else {
      // eslint-disable-next-line no-restricted-syntax
      for (const [storeName, store] of Object.entries(normalizedStores)) {
        if (__stores__[storeName]) {
          __stores__[storeName]._setState(store);
        }
      }
    }

    if (mergedOptions.skipStorageUpdate) setSkipStorageUpdate(false);
  }
}

export const snapshotManager = new SnapshotManager();
