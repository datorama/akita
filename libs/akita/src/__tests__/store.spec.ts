import { EntityStore, Query, Store, StoreConfig } from '..';
import { TodosStore } from './setup';

interface State {
  theme: {
    color: string;
  };
}

const state = {
  theme: {
    color: 'red',
  },
};

@StoreConfig({
  name: 'themes',
})
class ThemeStore extends Store<State> {
  constructor() {
    super(state);
  }
}

describe('Store', () => {
  let store: ThemeStore;

  beforeEach(() => {
    store = new ThemeStore();
  });

  it('should initialized the store', () => {
    expect(store._value()).toEqual(state);
  });

  it('should select slice from the store', () => {
    const spy = jest.fn();
    store._select((state2) => state2.theme).subscribe(spy);
    expect(spy).toHaveBeenCalledWith({ color: 'red' });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should return the store name', () => {
    expect(store.storeName).toEqual('themes');
  });

  it('should return the store value', () => {
    expect(store._value()).toEqual(state);
  });

  it('should set a new state', () => {
    const spy = jest.fn();
    store._select((state2) => state2.theme).subscribe(spy);
    store._setState((state2) => {
      return {
        ...state2,
        theme: {
          color: 'blue',
        },
      };
    });

    expect(spy.mock.calls[0][0]).toEqual({ color: 'red' });
    expect(spy.mock.calls[1][0]).toEqual({ color: 'blue' });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(store._value()).toEqual({
      theme: {
        color: 'blue',
      },
    });
  });

  it('should update the store config', () => {
    const todos = new TodosStore({ cache: { ttl: 100 } });
    expect(todos.options.cache.ttl).toBe(100);
    todos.updateStoreConfig({ cache: { ttl: 400 } });
    expect(todos.options.cache.ttl).toBe(400);
  });

  it('should destroy the store', () => {
    jest.spyOn(store, 'setHasCache');
    store.destroy();
    expect(store.setHasCache).toHaveBeenCalledTimes(1);
  });

  it('should NOT destroy the store when hmr enabled', () => {
    (window as any).hmrEnabled = true;
    jest.spyOn(store, 'setHasCache');
    store.destroy();
    expect(store.setHasCache).toHaveBeenCalledTimes(0);
  });
});

class User {
  firstName = '';

  lastName = '';

  constructor(params: Partial<User>) {
    Object.assign(this, params);
  }

  get name() {
    return `${this.firstName} ${this.lastName}`;
  }
}

@StoreConfig({
  name: 'user',
})
class UserStore extends Store<User> {
  constructor() {
    super(new User({ firstName: '', lastName: '' }));
  }
}

const userStore = new UserStore();

describe('With Class', () => {
  it('should support class', () => {
    expect(userStore._value().name).toEqual(' ');
  });

  it('should support updates', () => {
    userStore.update({ firstName: 'Netanel', lastName: 'Basal' });
    expect(userStore._value() instanceof User).toBeTruthy();
    expect(userStore._value()).toEqual(expect.any(User));
    expect(userStore._value().name).toEqual('Netanel Basal');
  });
});

@StoreConfig({
  name: 'user',
})
class TestStore extends Store<User> {
  constructor() {
    super({ config: {}, loading: true } as any);
  }
}

const testStore = new TestStore();
const testQuery = new Query(testStore);

describe('Loading Basic Store', () => {
  it('should support loading', () => {
    let value;
    testQuery.selectLoading().subscribe((v) => {
      value = v;
    });
    expect(value).toBeTruthy();
    testStore.setLoading(false);
    expect(value).toBeFalsy();
  });
});

@StoreConfig({ name: 'products' })
class ProductsStore extends EntityStore<any, any> {}

const productsStore = new ProductsStore();

class ProductsStoreWithoutDeco extends EntityStore<any, any> {}

const productsStore2 = new ProductsStoreWithoutDeco({}, { name: 'pr' });

describe('StoreConfig', () => {
  it('should take from decorator', () => {
    expect(productsStore.storeName).toBe('products');
    expect(productsStore.idKey).toBe('id');
  });

  it('should take from the constructor', () => {
    expect(productsStore2.storeName).toBe('pr');
    expect(productsStore2.idKey).toBe('id');
  });
});
