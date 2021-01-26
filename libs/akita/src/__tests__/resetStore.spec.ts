import { EntityStore } from '../lib/entityStore';
import { Store } from '../lib/store';
import { StoreConfig } from '../lib/storeConfig';

@StoreConfig({
  name: 'todos',
  resettable: true,
})
class TodosStore extends EntityStore<any, any> {}

const todosstore = new TodosStore();

@StoreConfig({
  name: 'auth',
  resettable: true,
})
class AuthStore extends Store<any> {
  constructor() {
    super({
      id: null,
      firstName: '',
      lastName: '',
      token: '',
    });
  }
}

const authStore = new AuthStore();

describe('Reset store', () => {
  it('should reset store state to its initial state - Store', () => {
    authStore._setState(() => {
      return {
        id: 1,
        firstName: 'Netanel',
        lastName: 'Basal',
        token: 'token',
      };
    });
    jest.spyOn(authStore, 'setHasCache');
    authStore.reset();
    expect(authStore._value()).toEqual({ id: null, firstName: '', lastName: '', token: '' });
    expect(authStore.setHasCache).toHaveBeenCalledWith(false);
  });

  it('should reset store state to its initial state - EntityStore', () => {
    todosstore.add({ id: 1 });
    const expected = {
      entities: {},
      ids: [],
      loading: true,
      error: null,
    };
    jest.spyOn(todosstore, 'setHasCache');
    todosstore.reset();
    expect(todosstore._value()).toEqual(expected);
    expect(todosstore.setHasCache).toHaveBeenCalledWith(false);
  });
});
