import { __stores__ } from './store';
import { applyTransaction } from './transaction';

export interface ResetStoresParams {
  exclude: string[];
}

/**
 * Reset stores back to their initial state
 *
 * @example
 *
 * resetStores()
 * resetStores({
 *   exclude: ['auth']
 * })
 */
export function resetStores(options?: Partial<ResetStoresParams>): void {
  const defaults: ResetStoresParams = {
    exclude: [],
  };

  const mergedOptions = { ...defaults, ...options };
  const stores = Object.keys(__stores__);

  applyTransaction(() => {
    // eslint-disable-next-line no-restricted-syntax
    for (const storeName of stores) {
      const s = __stores__[storeName];
      if (!mergedOptions.exclude) {
        s.reset();
      } else if (!mergedOptions.exclude.includes(storeName)) {
        s.reset();
      }
    }
  });
}
