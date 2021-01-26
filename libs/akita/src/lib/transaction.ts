import { BehaviorSubject, Observable, of, OperatorFunction, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { logAction } from './actions';

/** @internal */
const transactionFinished = new Subject();

/** @internal */
const transactionInProcess = new BehaviorSubject(false);

export type TransactionManager = {
  activeTransactions: number;
  batchTransaction: Subject<boolean> | null;
};

/** @internal */
export const transactionManager: TransactionManager = {
  activeTransactions: 0,
  batchTransaction: null,
};

/** @internal */
export function isTransactionInProcess(): boolean {
  return transactionManager.activeTransactions > 0;
}

/** @internal */
export function startBatch(): void {
  if (!isTransactionInProcess()) {
    transactionManager.batchTransaction = new Subject();
  }
  transactionManager.activeTransactions++;
  transactionInProcess.next(true);
}

/** @internal */
export function endBatch(): void {
  transactionManager.activeTransactions -= 1;
  if (transactionManager.activeTransactions === 0) {
    transactionManager.batchTransaction.next(true);
    transactionManager.batchTransaction.complete();
    transactionInProcess.next(false);
    transactionFinished.next(true);
  }
}

/** @internal */
export function commit(): Observable<boolean> {
  return transactionManager.batchTransaction ? transactionManager.batchTransaction.asObservable() : of(true);
}

/**
 *  A logical transaction.
 *  Use this transaction to optimize the dispatch of all the stores.
 *  The following code will update the store, BUT  emits only once
 *
 *  @example
 *  applyTransaction(() => {
 *    this.todosStore.add(new Todo(1, title));
 *    this.todosStore.add(new Todo(2, title));
 *  });
 *
 */
export function applyTransaction<T>(action: () => T, thisArg = undefined): T {
  startBatch();
  try {
    return action.apply(thisArg);
  } finally {
    logAction('@Transaction');
    endBatch();
  }
}

/**
 *  A logical transaction.
 *  Use this transaction to optimize the dispatch of all the stores.
 *
 *  The following code will update the store, BUT  emits only once.
 *
 *  @example
 *  @transaction
 *  addTodos() {
 *    this.todosStore.add(new Todo(1, title));
 *    this.todosStore.add(new Todo(2, title));
 *  }
 *
 *
 */
export function transaction() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const descriptorCopy = { ...descriptor };

    descriptorCopy.value = function transactionWrapper(...args): any {
      return applyTransaction(() => {
        return descriptor.value.apply(this, args);
      }, this);
    };

    return descriptorCopy;
  };
}

/**
 *
 * RxJS custom operator that wraps the callback inside transaction
 *
 * @example
 *
 * return http.get().pipe(
 *    withTransaction(response > {
 *      store.setActive(1);
 *      store.update();
 *      store.updateEntity(1, {});
 *    })
 * )
 *
 */
export function withTransaction<T>(next: (value: T) => void): OperatorFunction<T, T> {
  return (source: Observable<T>): Observable<T> => source.pipe(tap((value) => applyTransaction(() => next(value))));
}
