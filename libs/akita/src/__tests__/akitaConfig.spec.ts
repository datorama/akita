import { akitaConfig, QueryEntity } from '..';
import { initialState, Todo, TodosStore } from './setup';

akitaConfig({
  resettable: true,
  ttl: 300,
});

class TodosQuery extends QueryEntity<Todo> {}

describe('Akita global config', () => {
  let todosStore: TodosStore;
  let todosQuery: TodosQuery;

  beforeEach(() => {
    todosStore = new TodosStore({});
    todosQuery = new TodosQuery(todosStore);
  });

  it('should set cache timeout with 300ms', () => {
    jest.useFakeTimers();
    todosStore.setHasCache(true, { restartTTL: true });
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 300);
  });

  it('should not have cache after 300ms', () => {
    jest.useFakeTimers();
    todosStore.add({ id: 1 });
    todosStore.setHasCache(true, { restartTTL: true });
    jest.runAllTimers();
    expect(todosQuery.getHasCache()).toBe(false);
  });

  it('should reset the store', () => {
    const expected = {
      entities: {},
      ids: [],
      loading: true,
      error: null,
      ...initialState,
    };
    todosStore.add({ id: 1 });
    jest.spyOn(todosStore, 'setHasCache');
    todosStore.reset();
    expect(todosStore._value()).toEqual(expected);
    expect(todosStore.setHasCache).toHaveBeenCalledWith(false);
  });
});
