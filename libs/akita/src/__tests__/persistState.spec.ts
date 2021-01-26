import { EntityStore } from '../lib/entityStore';
import { persistState } from '../lib/persistState';
import { Store } from '../lib/store';
import { StoreConfig } from '../lib/storeConfig';
import { tick } from './setup';

@StoreConfig({
  name: 'todos',
})
class TodosStore extends EntityStore<any, any> {}

@StoreConfig({
  name: 'products',
})
class ProductsStore extends EntityStore<any, any> {}

@StoreConfig({
  name: 'auth',
})
class AuthStore extends Store<any> {
  constructor() {
    super({});
  }
}

describe('persistState', () => {
  const mock = `{"cart":{"entities":{},"ids":[],"loading":false,"error":null},"products":{"entities":{},"ids":[],"loading":false,"error":null},"auth":{"id":null,"firstName":"","lastName":"","token":""},"todos":{"ui":{"filter":"SHOW_ALL"},"entities":{"0.5666823893391795":{"id":0.5666823893391795,"title":"ds","completed":true},"0.16954788680591548":{"id":0.16954788680591548,"title":"ds","completed":false}},"ids":[0.5666823893391795,0.16954788680591548],"loading":false,"error":null}}`;
  localStorage.setItem('AkitaStores', mock);
  const storage = persistState();

  afterAll(() => storage.destroy());

  const todos = new TodosStore();
  const products = new ProductsStore();
  const auth = new AuthStore();

  it('should initial the value if in storage', () => {
    expect(todos._value()).toMatchObject({
      ui: { filter: 'SHOW_ALL' },
      entities: {
        '0.5666823893391795': { id: 0.5666823893391795, title: 'ds', completed: true },
        '0.16954788680591548': { id: 0.16954788680591548, title: 'ds', completed: false },
      },
      ids: [0.5666823893391795, 0.16954788680591548],
      loading: false,
      error: null,
    });
  });

  it('should set the value upon update', async () => {
    localStorage.setItem.mockClear();
    products.add([{ id: 1 }]);
    await tick();
    const expected = {
      cart: { entities: {}, ids: [], loading: false, error: null },
      products: { entities: { '1': { id: 1 } }, ids: [1], loading: false, error: null },
      auth: { id: null, firstName: '', lastName: '', token: '' },
      todos: {
        ui: { filter: 'SHOW_ALL' },
        entities: {
          '0.5666823893391795': { id: 0.5666823893391795, title: 'ds', completed: true },
          '0.16954788680591548': { id: 0.16954788680591548, title: 'ds', completed: false },
        },
        ids: [0.5666823893391795, 0.16954788680591548],
        loading: false,
        error: null,
      },
    };

    expect(localStorage.setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem('AkitaStores'))).toMatchObject(expected);
  });

  it('should set the value upon update - simple store', async () => {
    localStorage.setItem.mockClear();
    auth._setState(() => {
      return {
        id: 1,
        firstName: 'Netanel',
        lastName: 'Basal',
        token: 'token',
      };
    });
    await tick();
    const expected = {
      cart: { entities: {}, ids: [], loading: false, error: null },
      products: { entities: { '1': { id: 1 } }, ids: [1], loading: false, error: null },
      auth: { id: 1, firstName: 'Netanel', lastName: 'Basal', token: 'token' },
      todos: {
        ui: { filter: 'SHOW_ALL' },
        entities: {
          '0.5666823893391795': { id: 0.5666823893391795, title: 'ds', completed: true },
          '0.16954788680591548': { id: 0.16954788680591548, title: 'ds', completed: false },
        },
        ids: [0.5666823893391795, 0.16954788680591548],
        loading: false,
        error: null,
      },
    };

    expect(localStorage.setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem('AkitaStores'))).toMatchObject(expected);
  });

  it('should clear store', async () => {
    storage.clearStore('todos');
    await tick();
    const expected = {
      cart: { entities: {}, ids: [], loading: false, error: null },
      products: { entities: { '1': { id: 1 } }, ids: [1], loading: false, error: null },
      auth: { id: 1, firstName: 'Netanel', lastName: 'Basal', token: 'token' },
    };
    expect(JSON.parse(localStorage.getItem('AkitaStores'))).toMatchObject(expected);
  });

  it('should clear all', () => {
    storage.clear();
    expect(JSON.parse(localStorage.getItem('AkitaStores'))).toBeNull();
  });
});
