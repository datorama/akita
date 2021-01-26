import { ReplaySubject, Subject } from 'rxjs';
import { StoreSnapshotAction } from './actions';

/** @internal */
export const $$deleteStore = new Subject<string>();
/** @internal */
export const $$addStore = new ReplaySubject<string>(50, 5000);
/** @internal */
export const $$updateStore = new Subject<{ storeName: string; action: StoreSnapshotAction }>();

/** @internal */
export function dispatchDeleted(storeName: string): void {
  $$deleteStore.next(storeName);
}

/** @internal */
export function dispatchAdded(storeName: string): void {
  $$addStore.next(storeName);
}

/** @internal */
export function dispatchUpdate(storeName: string, action: StoreSnapshotAction): void {
  $$updateStore.next({ storeName, action });
}
