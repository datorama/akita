import { timer } from 'rxjs';
import { mapTo, tap } from 'rxjs/operators';
import { Store, StoreConfig } from '..';
import { persistState, PersistStateStorage } from '../lib/persistState';
import { tick } from './setup';

function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

jest.useFakeTimers();

let cache = {};

const asyncStorage: PersistStateStorage = {
  getItem(key) {
    return timer(random(1000, 3000)).pipe(mapTo(cache[key]));
  },
  setItem(key, value) {
    return timer(random(1000, 10000)).pipe(
      tap(() => {
        cache[key] = value;
      })
    );
  },
  clear() {
    cache = {};
  },
};

persistState({ storage: asyncStorage });

@StoreConfig({
  name: 'auth',
})
class AuthStore extends Store<any> {
  constructor() {
    super({});
  }
}

const store = new AuthStore();

describe('Persist state async', () => {
  it('should work with async', async () => {
    await tick();

    store.update({ async: true });
    await tick();
    jest.runAllTimers();

    store.update({ async: false });
    await tick();
    jest.runAllTimers();

    store.update({ async: true });
    await tick();
    jest.runAllTimers();

    store.update({ async: false });
    await tick();
    jest.runAllTimers();

    store.update({ async: true });
    await tick();
    jest.runAllTimers();

    store.update({ async: false });
    await tick();
    jest.runAllTimers();
    expect(cache.AkitaStores.auth.async).toBeFalsy();
  });
});
