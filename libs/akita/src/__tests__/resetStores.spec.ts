import { akitaConfig } from '../lib/config';
import { EntityStore } from '../lib/entityStore';
import { resetStores } from '../lib/resetStores';
import { Store } from '../lib/store';
import { StoreConfig } from '../lib/storeConfig';

akitaConfig({
  resettable: true,
});

@StoreConfig({
  name: 'todos',
})
class TodosStore extends EntityStore<any, any> {}

@StoreConfig({
  name: 'auth',
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

@StoreConfig({ name: 'ui', resettable: false })
class UiStore extends Store {
  constructor() {
    super({
      isChecked: false,
      category: 'Category',
    });
  }
}

const todos = new TodosStore();
const auth = new AuthStore();
const uiStore = new UiStore();

todos.add([{ id: 1 }]);
auth._setState(() => {
  return {
    id: 1,
    firstName: 'Netanel',
    lastName: 'Basal',
    token: 'token',
  };
});

describe('Reset store', () => {
  afterEach(() => {
    todos._setState(() => [{ id: 1 }]);
    auth._setState(() => {
      return {
        id: 1,
        firstName: 'Netanel',
        lastName: 'Basal',
        token: 'token',
      };
    });
  });

  it('should reset store state to its initial state', () => {
    const expected = {
      entities: {},
      ids: [],
      loading: true,
      error: null,
    };

    todos.reset();
    expect(todos._value()).toEqual(expected);
  });

  it('should reset all stores states', () => {
    const expected = {
      todos: {
        entities: {},
        ids: [],
        loading: true,
        error: null,
      },
      auth: { id: null, firstName: '', lastName: '', token: '' },
    };
    resetStores();
    expect({ todos: todos._value(), auth: auth._value() }).toEqual(expected);
  });

  it('should reset all stores excluding the names passed as args', () => {
    const expected = {
      todos: {
        entities: {},
        ids: [],
        loading: true,
        error: null,
      },
      auth: {
        id: 1,
        firstName: 'Netanel',
        lastName: 'Basal',
        token: 'token',
      },
    };
    resetStores({ exclude: ['auth'] });
    expect({ todos: todos._value(), auth: auth._value() }).toEqual(expected);
  });

  it('should not reset store if resettable = true in global and false on decorator', () => {
    uiStore.update(() => ({
      isChecked: true,
      category: 'New Category',
    }));

    resetStores();

    expect(uiStore.getValue()).toEqual({
      isChecked: true,
      category: 'New Category',
    });
  });
});
