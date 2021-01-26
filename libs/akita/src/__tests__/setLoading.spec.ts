import { timer } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EntityStore, QueryEntity } from '..';
import { cacheable } from '../lib/index';
import { setLoading } from '../lib/setLoading';

const store = new EntityStore({}, { name: 'test' });
const query = new QueryEntity(store);

jest.useFakeTimers();

describe('setLoading', () => {
  it('should work', () => {
    const log = [];
    const request = timer(1000).pipe(
      setLoading(store),
      tap(() => log.push(1)),
      tap(() => store.set([{ id: 1 }]))
    );

    jest.spyOn(store, 'setLoading');

    const spy = jest.fn();
    cacheable(store, request).subscribe(spy);
    jest.runAllTimers();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(log.length).toEqual(1);
    expect(query.getValue().loading).toBe(false);
    cacheable(store, request).subscribe(spy);
    // from inside withLoading
    expect(store.setLoading).toBeCalledTimes(2);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(log.length).toEqual(1);

    cacheable(store, request).subscribe(spy);
    // from inside withLoading
    expect(store.setLoading).toBeCalledTimes(2);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(log.length).toEqual(1);
  });
});
