import { isBrowser } from './root';

export let __DEV__ = true;

export function enableAkitaProdMode(): void {
  __DEV__ = false;
  if (isBrowser) {
    delete (window as any).$$stores;
    delete (window as any).$$queries;
  }
}

/** @internal */
export function isDev(): boolean {
  return __DEV__;
}
