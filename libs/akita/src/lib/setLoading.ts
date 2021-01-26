import { defer, MonoTypeOperatorFunction, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Store } from './store';

export function setLoading<T>(store: Store): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> =>
    defer(() => {
      store.setLoading(true);
      return source.pipe(finalize(() => store.setLoading(false)));
    });
}
