import { Subscription } from 'rxjs';
import { getInitialEntitiesState } from '..';
import { isObject } from '../lib/isObject';
import { QueryConfig, SortBy } from '../lib/queryConfig';
import { QueryEntity } from '../lib/queryEntity';
import { Order } from '../lib/sort';
import { trackIdChanges } from '../lib/trackIdChanges';
import { cot, createTodos, ct, Todo, TodosStore } from './setup';

function ga(spy, num = 0) {
  return spy.mock.calls[num][0];
}

describe('Entities Query', () => {
  const store = new TodosStore({});
  const query = new QueryEntity(store);

  let spy;
  let sub;

  beforeEach(() => {
    spy = jest.fn();
    store.remove();
  });

  afterEach(() => {
    if (sub) sub.unsubscribe();
  });

  it('should set the initial value', () => {
    expect(store._value()).toEqual({ active: null, metadata: { name: 'metadata' }, ...getInitialEntitiesState() });
  });

  describe('Select', () => {
    it('should select ids', () => {
      sub = query.select((state) => state.ids).subscribe(spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(store._value().ids);
    });

    it('should select entities', () => {
      sub = query.select((state) => state.entities).subscribe(spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(store._value().entities);
    });

    it('should fire only when updating the state', () => {
      sub = query.select((state) => state.entities).subscribe(spy);
      const todo = cot();
      store.add(todo);
      expect(store._value().entities[1]).toBe(todo);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(ga(spy)).toEqual({});
      expect(ga(spy, 1)).toEqual({ 1: todo });
    });
  });

  describe('selectAll', () => {
    it('should select all as array', () => {
      const todo = cot();
      store.add(todo);
      sub = query.selectAll().subscribe(spy);
      expect(spy).toHaveBeenCalledTimes(1);
      const todos = ga(spy);
      expect(Array.isArray(todos)).toBeTruthy();
      expect(todos.length).toEqual(1);
      expect(todos[0]).toBe(todo);
    });

    it('should select all as map', () => {
      const todo = cot();
      store.add(todo);
      sub = query.selectAll({ asObject: true }).subscribe(spy);
      expect(spy).toHaveBeenCalledTimes(1);
      const todos = ga(spy);
      expect(Array.isArray(todos)).toBeFalsy();
      expect(Object.keys(todos).length).toEqual(1);
      expect(todos[1]).toBe(todo);
    });
  });

  describe('getAll', () => {
    it('should get all as array', () => {
      const todo = cot();
      store.add(todo);
      const todos = query.getAll();
      expect(Array.isArray(todos)).toBe(true);
      expect(todos.length).toBe(1);
      expect(todos[0]).toBe(todo);
    });

    it('should get all as map', () => {
      const todo = cot();
      store.add(todo);
      const todos = query.getAll({ asObject: true });
      expect(Array.isArray(todos)).toBe(false);
      expect(todos[1]).toBe(todo);
    });
  });

  describe('selectEntity', () => {
    it('should select entity', () => {
      const todo = cot();
      store.add(todo);
      sub = query.selectEntity(1).subscribe(spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(ga(spy)).toBe(todo);
    });

    it('should select slice from entity', () => {
      const todo = cot();
      store.add(todo);
      sub = query.selectEntity(1, (entity) => entity.title).subscribe(spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(ga(spy)).toBe(todo.title);
    });

    it('should not fire when the selected value does not changed', () => {
      const todo = cot();
      store.add(todo);
      sub = query.selectEntity(1, (entity) => entity.title).subscribe(spy);
      store.update(1, { completed: true });
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should fire when the selected value changed', () => {
      const todo = cot();
      store.add(todo);
      sub = query.selectEntity(1, (entity) => entity.title).subscribe(spy);
      store.update(1, { title: 'changed' });
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should not throw when the entity does not exists', () => {
      sub = query
        .selectEntity(2, (entity) => entity.title)
        .subscribe((entity) => {
          expect(entity).toBe(undefined);
        });
    });

    it('should select by predicate', () => {
      const factory = ct();
      store.add(factory());
      store.add(factory());
      const spy = jest.fn();
      query.selectEntity((e) => e.id === 1).subscribe(spy);
      expect(spy).toHaveBeenCalledWith({ complete: false, id: 1, title: 'Todo 1' });
      store.remove(1);
      expect(spy).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getEntity', () => {
    it('should get the entity', () => {
      const todo = cot();
      store.add(todo);
      expect(query.getEntity(1)).toBe(todo);
    });
  });

  describe('selectActive', () => {
    it('should return undefined when active not exist', () => {
      let res;
      query.selectActive().subscribe((active) => {
        res = active;
      });
      expect(res).toBeUndefined();
    });

    it('should select the active id', () => {
      const todo = cot();
      store.add(todo);
      store.setActive(1);
      sub = query.selectActiveId().subscribe((activeId) => expect(activeId).toBe(1));
    });

    it('should select the active', () => {
      const todo = cot();
      store.add(todo);
      store.setActive(1);
      sub = query.selectActive().subscribe((active) => expect(active).toBe(query.getActive()));
    });

    it('should select a slice from the active', () => {
      const todo = cot();
      store.add(todo);
      store.setActive(1);
      sub = query.selectActive((entity) => entity.title).subscribe((title) => expect(title).toBe(query.getActive().title));
    });
  });

  describe('getActive', () => {
    it('should get the active id', () => {
      const todo = cot();
      store.add(todo);
      store.setActive(1);
      expect(query.getActiveId()).toBe(1);
    });

    it('should get the active', () => {
      const todo = cot();
      store.add(todo);
      store.setActive(1);
      expect(query.getActive()).toBe(todo);
    });
  });

  describe('hasActive', () => {
    it('should have active entity', () => {
      const todo = cot();
      store.add(todo);
      store.setActive(1);
      expect(query.hasActive()).toBeTruthy();
    });

    it('should NOT have active entity initially', () => {
      const todo = cot();
      store.add(todo);
      expect(query.hasActive()).toBeFalsy();
    });

    it('should NOT have active entity after unset', () => {
      const todo = cot();
      store.add(todo);
      store.setActive(1);
      expect(query.hasActive()).toBeTruthy();
      store.setActive(null);
      expect(query.hasActive()).toBeFalsy();
    });

    it('should NOT have active entity after unset undefined', () => {
      store.setActive(undefined);
      expect(query.hasActive()).toBeFalsy();
    });

    it('should have single active entity', () => {
      const todo = cot();
      store.add(todo);
      store.setActive(1);
      expect(query.hasActive()).toBeTruthy();
      expect(query.hasActive(1)).toBeTruthy();
      expect(query.hasActive(2)).toBeFalsy();
    });
  });

  describe('selectCount', () => {
    it('should return the count', () => {
      const factory = ct();
      store.add(factory());
      sub = query.selectCount().subscribe(spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(1);
      store.add(factory());
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(2);
    });
    it('should return the count based on the condition', () => {
      const factory = ct();
      store.add(factory());
      sub = query.selectCount((entity) => entity.completed).subscribe(spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(0);
      store.add(factory());
      store.update(1, { completed: true });
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenCalledWith(1);
    });
  });

  describe('getCount', () => {
    it('should return the count', () => {
      const factory = ct();
      store.add(factory());
      expect(query.getCount()).toEqual(1);
    });

    it('should return the count based on the condition', () => {
      const factory = ct();
      store.add(factory());
      const initial = query.getCount((entity) => entity.completed);
      expect(initial).toEqual(0);
      store.add(factory());
      store.update(1, { completed: true });
      const updated = query.getCount((entity) => entity.completed);
      expect(updated).toEqual(1);
    });
  });

  describe('store cache', () => {
    beforeEach(() => {
      store.setHasCache(false);
    });
    describe('with TTL', () => {
      let storeWithTtl;
      let ttlQuery;
      const ttl = 100;
      beforeEach(() => {
        storeWithTtl = new TodosStore({ cache: { ttl } });
        ttlQuery = new QueryEntity(storeWithTtl);
      });
      describe('selectHasCache', () => {
        it('should work in a full flow', () => {
          jest.useFakeTimers();
          sub = ttlQuery.selectHasCache().subscribe(spy);
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(false);
          const factory = ct();
          storeWithTtl.set(factory());
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy).toHaveBeenCalledWith(true);
          // ttl passed
          jest.runAllTimers();
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy).toHaveBeenCalledWith(false);
          storeWithTtl.remove();
          expect(spy).toHaveBeenCalledTimes(3);
          storeWithTtl.set(factory());
          expect(spy).toHaveBeenCalledTimes(4);
          expect(spy).toHaveBeenCalledWith(true);
          storeWithTtl.setHasCache(false);
          expect(spy).toHaveBeenCalledTimes(5);
          expect(spy).toHaveBeenCalledWith(false);
          storeWithTtl.set(factory());
          expect(spy).toHaveBeenCalledTimes(6);
          expect(spy).toHaveBeenCalledWith(true);
          // ttl passed
          jest.runAllTimers();
          expect(spy).toHaveBeenCalledTimes(7);
          expect(spy).toHaveBeenCalledWith(false);
          storeWithTtl.set(factory());
          expect(spy).toHaveBeenCalledTimes(8);
          expect(spy).toHaveBeenCalledWith(true);
          storeWithTtl.remove();
          expect(spy).toHaveBeenCalledTimes(9);
          expect(spy).toHaveBeenCalledWith(false);
          storeWithTtl.setHasCache(true);
          expect(spy).toHaveBeenCalledTimes(10);
          expect(spy).toHaveBeenCalledWith(true);
          storeWithTtl.setHasCache(true);
          expect(spy).toHaveBeenCalledTimes(10);
        });
      });

      describe('getHasCache', () => {
        it('should work in a full flow', () => {
          jest.useFakeTimers();
          expect(ttlQuery.getHasCache()).toBe(false);
          const factory = ct();
          storeWithTtl.set(factory());
          expect(ttlQuery.getHasCache()).toBe(true);
          jest.advanceTimersByTime(ttl / 2);
          storeWithTtl.set(factory());
          jest.advanceTimersByTime(ttl / 2);
          // cancel he previous ttl timer
          expect(ttlQuery.getHasCache()).toBe(true);
          // ttl passed
          jest.runAllTimers();
          expect(ttlQuery.getHasCache()).toBe(false);
          storeWithTtl.remove();
          expect(ttlQuery.getHasCache()).toBe(false);
          storeWithTtl.set(factory());
          expect(ttlQuery.getHasCache()).toBe(true);
          storeWithTtl.setHasCache(false);
          expect(ttlQuery.getHasCache()).toBe(false);
          storeWithTtl.set(factory());
          expect(ttlQuery.getHasCache()).toBe(true);
          // ttl passed
          jest.runAllTimers();
          expect(ttlQuery.getHasCache()).toBe(false);
          storeWithTtl.set(factory());
          expect(ttlQuery.getHasCache()).toBe(true);
          storeWithTtl.remove();
          expect(ttlQuery.getHasCache()).toBe(false);
          storeWithTtl.setHasCache(true);
          expect(ttlQuery.getHasCache()).toBe(true);
        });
      });
    });

    describe('without TTL', () => {
      describe('selectHasCache', () => {
        it('should work in a full flow', () => {
          sub = query.selectHasCache().subscribe(spy);
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(false);
          const factory = ct();
          store.set(factory());
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy).toHaveBeenCalledWith(true);
          store.remove();
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy).toHaveBeenCalledWith(false);
          store.set(factory());
          expect(spy).toHaveBeenCalledTimes(4);
          expect(spy).toHaveBeenCalledWith(true);
          store.setHasCache(false);
          expect(spy).toHaveBeenCalledTimes(5);
          expect(spy).toHaveBeenCalledWith(false);
          store.set(factory());
          expect(spy).toHaveBeenCalledTimes(6);
          expect(spy).toHaveBeenCalledWith(true);
          store.remove();
          expect(spy).toHaveBeenCalledTimes(7);
          expect(spy).toHaveBeenCalledWith(false);
          store.setHasCache(true);
          expect(spy).toHaveBeenCalledTimes(8);
          expect(spy).toHaveBeenCalledWith(true);
          store.setHasCache(true);
          expect(spy).toHaveBeenCalledTimes(8);
        });
      });

      describe('getHasCache', () => {
        it('should work in a full flow', () => {
          expect(query.getHasCache()).toBe(false);
          const factory = ct();
          store.set(factory());
          expect(query.getHasCache()).toBe(true);
          store.remove();
          expect(query.getHasCache()).toBe(false);
          store.set(factory());
          expect(query.getHasCache()).toBe(true);
          store.setHasCache(false);
          expect(query.getHasCache()).toBe(false);
          store.set(factory());
          expect(query.getHasCache()).toBe(true);
          store.remove();
          expect(query.getHasCache()).toBe(false);
          store.setHasCache(true);
          expect(query.getHasCache()).toBe(true);
        });
      });
    });
  });

  describe('hasEntity', () => {
    it('should have entity', () => {
      const todo = cot();
      store.add(todo);
      expect(query.hasEntity(1)).toBeTruthy();
    });

    it('should have entity - callback', () => {
      const todo = cot();
      store.add(todo);
      expect(query.hasEntity((entity) => entity.completed)).toBeFalsy();
    });

    it('should NOT have entity - callback', () => {
      const todo = cot();
      store.add(todo);
      expect(query.hasEntity((entity) => entity.title === 'not exists')).toBeFalsy();
    });

    it('should NOT have entity', () => {
      expect(query.hasEntity(5)).toBeFalsy();
    });

    it('should return false when store is empty', () => {
      store.remove();
      expect(query.hasEntity()).toBeFalsy();
    });

    it('should return false when store is not empty', () => {
      const todo = cot();
      store.add(todo);
      expect(query.hasEntity()).toBeTruthy();
    });

    describe('multi', () => {
      it('should return true if all entities in the store', () => {
        const factory = ct();
        store.add(factory());
        store.add(factory());
        store.add(factory());

        expect(query.hasEntity([0, 1, 2])).toBeTruthy();
      });

      it('should return false if NOT all entities in the store', () => {
        const factory = ct();
        store.add(factory());
        store.add(factory());
        store.add(factory());

        expect(query.hasEntity([0, 1, 23])).toBeFalsy();
      });
    });
  });
});

describe('State', () => {
  it('should get the initial state', () => {
    expect(getInitialEntitiesState()).toEqual({
      entities: {},
      loading: true,
      ids: [],
      error: null,
    });
  });
});

describe('getAll', () => {
  const todosStore = new TodosStore();
  const queryTodos = new QueryEntity(todosStore);

  beforeEach(() => {
    todosStore.remove();
    todosStore.add([new Todo({ id: 1, title: 'aaa' }), new Todo({ id: 2, title: 'bbb' })]);
  });

  it('should getAll - asArray', () => {
    const search = queryTodos.getAll();
    expect(search.length).toEqual(2);
  });

  it('should getAll - asObject', () => {
    const search = queryTodos.getAll({
      asObject: true,
    });
    expect(search[1]).toEqual(new Todo({ id: 1, title: 'aaa' }));
    expect(search[2]).toEqual(new Todo({ id: 2, title: 'bbb' }));
  });

  it('should support filter by function', () => {
    const result = queryTodos.getAll({
      filterBy: (entity) => entity.title === 'aaa',
    });
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
    expect(result[0].title).toEqual('aaa');
  });

  it('should support filter by function - asObject', () => {
    const result = queryTodos.getAll({
      asObject: true,
      filterBy: (entity) => entity.title === 'aaa',
    });
    expect(isObject(result)).toBeTruthy();
    expect(Object.keys(result).length).toEqual(1);
    expect(result[1].title).toEqual('aaa');
  });

  it('should support filter by function with index', () => {
    const result = queryTodos.getAll({
      filterBy: (entity, index) => index % 2 === 0,
    });
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
    expect(result[0].title).toEqual('aaa');
  });

  it('should support filter by multi functions', () => {
    const result = queryTodos.getAll({
      filterBy: [(entity, index) => index % 2 === 0, (entity) => entity.completed === false],
    });
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);

    const result2 = queryTodos.getAll({
      filterBy: [(entity, index) => index % 2 === 0, (entity) => entity.completed === true],
    });
    expect(result2.length).toEqual(0);

    const result3 = queryTodos.getAll({
      filterBy: [(entity) => entity.completed === false],
    });
    expect(result3.length).toEqual(2);
  });

  it('should support limitTo', () => {
    const res = queryTodos.getAll({
      limitTo: 1,
    });
    expect(res.length).toBe(1);
  });

  it('should support limitTo - asObject', () => {
    const res = queryTodos.getAll({
      limitTo: 1,
      asObject: true,
    });

    expect(Object.keys(res).length).toBe(1);
  });
});

describe('selectAll', () => {
  const todosStore = new TodosStore();
  const queryTodos = new QueryEntity(todosStore);

  let subscription: Subscription;

  beforeEach(() => {
    todosStore.remove();
    todosStore.add([new Todo({ id: 1, title: 'aaa' }), new Todo({ id: 2, title: 'bbb' })]);
  });

  afterEach(() => subscription && subscription.unsubscribe());

  it('should selectAll - asArray', () => {
    subscription = queryTodos.selectAll().subscribe((result) => {
      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toEqual(2);
    });
  });

  it('should selectAll with search by - asArray', () => {
    subscription = queryTodos
      .selectAll({
        filterBy: (entity) => entity.title === 'aaa',
      })
      .subscribe((result) => {
        expect(Array.isArray(result)).toBeTruthy();
        expect(result.length).toEqual(1);
        expect(result[0].title).toEqual('aaa');
      });
  });

  it('should selectAll - asMap', () => {
    subscription = queryTodos.selectAll({ asObject: true }).subscribe((result) => {
      expect(isObject(result)).toBeTruthy();
      expect(Object.keys(result).length).toEqual(2);
    });
  });

  it('should selectAll with search by - asMap', () => {
    subscription = queryTodos
      .selectAll({
        asObject: true,
        filterBy: (entity) => entity.title === 'aaa',
      })
      .subscribe((result) => {
        expect(isObject(result)).toBeTruthy();
        expect(Object.keys(result).length).toEqual(1);
        expect(result[1].title).toEqual('aaa');
      });
  });

  it('should support limitTo', () => {
    let res;
    subscription = queryTodos
      .selectAll({
        limitTo: 1,
      })
      .subscribe((_res) => {
        res = _res;
      });
    expect(res.length).toBe(1);
  });

  it('should support limitTo - asObject', () => {
    let res;
    subscription = queryTodos
      .selectAll({
        limitTo: 1,
        asObject: true,
      })
      .subscribe((_res) => {
        res = _res;
      });
    expect(Object.keys(res).length).toBe(1);
  });
});

describe('Many', () => {
  jest.useFakeTimers();
  const todosStore = new TodosStore();
  const queryTodos = new QueryEntity(todosStore);
  let spy;

  beforeEach(() => {
    spy = jest.fn();
    todosStore.remove();
  });

  describe('SelectMany', () => {
    it('should select many', () => {
      queryTodos.selectMany([0, 1]).subscribe(spy);
      expect(spy).toHaveBeenCalledTimes(1);

      todosStore.add(createTodos(3));
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(createTodos(2));
    });

    it('should not fire when a different entity change', () => {
      todosStore.add(createTodos(3));
      queryTodos.selectMany([0, 1]).subscribe(spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(createTodos(2));
      todosStore.update(2, { completed: true });
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should work with function projection', () => {
      todosStore.add(createTodos(3));
      queryTodos.selectMany([0, 1], (entity) => entity.title).subscribe(spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(['Todo 0', 'Todo 1']);
      todosStore.update(2, { completed: true });
      expect(spy).toHaveBeenCalledTimes(1);
      todosStore.update(1, { title: 'new title' });
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(['Todo 0', 'new title']);
    });
  });
});

describe('Check subscriptions calls', () => {
  const todosStore = new TodosStore();
  const queryTodos = new QueryEntity(todosStore);
  let spy;

  beforeEach(() => {
    spy = jest.fn();
    todosStore.remove();
  });

  it('should call twice - initial and after set', () => {
    queryTodos.selectAll().subscribe(spy);
    expect(spy).toHaveBeenCalledWith([]);
    todosStore.set(createTodos(3));
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(createTodos(3));
    expect(queryTodos.getValue().ids).toEqual([0, 1, 2]);
  });

  it('should call three times - initial and after set + add', () => {
    queryTodos.selectAll().subscribe(spy);
    expect(spy).toHaveBeenCalledWith([]);
    todosStore.set(createTodos(3));
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(createTodos(3));
    expect(queryTodos.getValue().ids).toEqual([0, 1, 2]);
    todosStore.add({ id: 3, title: '3', completed: false });
    expect(spy).toHaveBeenCalledTimes(3);
    expect(queryTodos.getEntity(3)).toBeDefined();
    expect(queryTodos.getValue().ids).toEqual([0, 1, 2, 3]);
  });

  it('should call three times - initial and after set + update', () => {
    queryTodos.selectAll().subscribe(spy);
    expect(spy).toHaveBeenCalledWith([]);
    todosStore.set(createTodos(3));
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(createTodos(3));
    expect(queryTodos.getValue().ids).toEqual([0, 1, 2]);
    todosStore.update(1, { completed: true });
    expect(spy).toHaveBeenCalledTimes(3);
    expect(queryTodos.getEntity(1).completed).toEqual(true);
  });

  it('should call three times - initial and after set + remove', () => {
    queryTodos.selectAll().subscribe(spy);
    expect(spy).toHaveBeenCalledWith([]);
    todosStore.set(createTodos(3));
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(createTodos(3));
    expect(queryTodos.getValue().ids).toEqual([0, 1, 2]);
    todosStore.remove(1);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(queryTodos.getEntity(1)).toEqual(undefined);
    expect(queryTodos.getValue().ids).toEqual([0, 2]);
  });
});

describe('Sort by', () => {
  const todosStore = new TodosStore();
  const queryTodos = new QueryEntity(todosStore);
  let res;
  let sub;

  beforeEach(() => {
    todosStore.remove();
    if (sub) sub.unsubscribe();
  });

  it('should sort by provided key', () => {
    todosStore.set([
      { id: 1, title: 'Todo 1', complete: false },
      { id: 0, title: 'Todo 0', complete: false },
      {
        id: 2,
        title: 'Todo 2',
        complete: true,
      },
    ] as any);

    todosStore.update(2, { complete: true } as any);
    sub = queryTodos
      .selectAll({
        sortBy: 'id',
      })
      .subscribe((_res) => (res = _res));

    expect(res[0].id).toEqual(0);
    expect(res[1].id).toEqual(1);
    expect(res[2].id).toEqual(2);
  });

  it('should sort by provided key - number', () => {
    todosStore.set([
      { id: 1, title: 'Todo 1', complete: false, price: 10 },
      {
        id: 0,
        title: 'Todo 0',
        complete: false,
        price: 40,
      },
      { id: 2, title: 'Todo 2', complete: true, price: 3 },
    ] as any);

    sub = queryTodos
      .selectAll({
        sortBy: 'price',
      })
      .subscribe((_res) => (res = _res));

    expect(res[0].price).toEqual(3);
    expect(res[1].price).toEqual(10);
    expect(res[2].price).toEqual(40);
  });

  it('should sort by provided key desc - number', () => {
    todosStore.set([
      { id: 1, title: 'Todo 1', complete: false, price: 10 },
      {
        id: 0,
        title: 'Todo 0',
        complete: false,
        price: 40,
      },
      { id: 2, title: 'Todo 2', complete: true, price: 3 },
    ] as any);

    sub = queryTodos
      .selectAll({
        sortBy: 'price',
        sortByOrder: Order.DESC,
      })
      .subscribe((_res) => (res = _res));

    expect(res[0].price).toEqual(40);
    expect(res[1].price).toEqual(10);
    expect(res[2].price).toEqual(3);
  });

  it('should sort by provided key - desc', () => {
    todosStore.set([
      { id: 1, title: 'Todo 1', completed: false, price: 10 },
      {
        id: 0,
        title: 'Todo 0',
        completed: false,
        price: 40,
      },
      { id: 2, title: 'Todo 2', completed: true, price: 3 },
    ] as any);

    todosStore.update(2, { completed: true } as any);
    sub = queryTodos
      .selectAll({
        asObject: false,
        sortBy: 'completed',
        sortByOrder: Order.DESC,
      })
      .subscribe((_res) => (res = _res));

    expect(res[0].completed).toEqual(true);
    expect(res[1].completed).toEqual(false);
    expect(res[2].completed).toEqual(false);
  });

  it('should sort by provided custom function', () => {
    function customSortBy(obj1, obj2) {
      return obj1.price - obj2.price;
    }

    todosStore.set([
      { id: 1, title: 'Todo 1', complete: false, price: 10 },
      {
        id: 0,
        title: 'Todo 0',
        complete: false,
        price: 40,
      },
      { id: 2, title: 'Todo 2', complete: true, price: 3 },
    ] as any);

    sub = queryTodos
      .selectAll({
        sortBy: customSortBy,
      })
      .subscribe((_res) => (res = _res));

    expect(res[0].price).toEqual(3);
    expect(res[1].price).toEqual(10);
    expect(res[2].price).toEqual(40);
  });

  it('should sort using conditional state value', () => {
    function sortByPrice(obj1, obj2) {
      return obj1.price - obj2.price;
    }

    function sortById(obj1, obj2) {
      return obj1.id - obj2.id;
    }

    todosStore.set([
      { id: 1, title: 'Todo 1', complete: false, price: 10 },
      {
        id: 0,
        title: 'Todo 0',
        complete: false,
        price: 40,
      },
      { id: 2, title: 'Todo 2', complete: true, price: 3 },
    ] as any);

    todosStore.update({ sortyByPrice: true });

    const sortBy: SortBy<any, any> = (a, b, state) => (state.sortyByPrice ? sortByPrice(a, b) : sortById(a, b));

    sub = queryTodos.selectAll({ sortBy }).subscribe((_res) => (res = _res));

    expect(res[0].price).toEqual(3);
    expect(res[1].price).toEqual(10);
    expect(res[2].price).toEqual(40);
  });
});

describe('Sort by - Query Level', () => {
  const todosStore = new TodosStore();
  QueryConfig({ sortBy: 'price' })(QueryEntity);
  const queryTodos = new QueryEntity(todosStore);
  let res;
  let sub;

  beforeEach(() => {
    todosStore.remove();
    if (sub) sub.unsubscribe();
  });

  it('should sort by provided key - number', () => {
    todosStore.set([
      { id: 1, title: 'Todo 1', complete: false, price: 10 },
      {
        id: 0,
        title: 'Todo 0',
        complete: false,
        price: 40,
      },
      { id: 2, title: 'Todo 2', complete: true, price: 3 },
    ] as any);

    sub = queryTodos.selectAll().subscribe((_res) => (res = _res));

    expect(res[0].price).toEqual(3);
    expect(res[1].price).toEqual(10);
    expect(res[2].price).toEqual(40);
  });

  it('should let selectAll win', () => {
    todosStore.set([
      { id: 1, title: 'Todo 1', complete: false, price: 10 },
      {
        id: 0,
        title: 'Todo 0',
        complete: false,
        price: 40,
      },
      { id: 2, title: 'Todo 2', complete: true, price: 3 },
    ] as any);

    sub = queryTodos
      .selectAll({
        sortBy: 'price',
        sortByOrder: Order.DESC,
      })
      .subscribe((_res) => (res = _res));

    expect(res[0].price).toEqual(40);
    expect(res[1].price).toEqual(10);
    expect(res[2].price).toEqual(3);
  });

  it('should let selectAll win (2)', () => {
    todosStore.set([
      { id: 1, title: 'Todo 1', complete: false },
      { id: 0, title: 'Todo 0', complete: false },
      {
        id: 2,
        title: 'Todo 2',
        complete: true,
      },
    ] as any);

    todosStore.update(2, { complete: true } as any);
    sub = queryTodos
      .selectAll({
        sortBy: 'id',
      })
      .subscribe((_res) => (res = _res));

    expect(res[0].id).toEqual(0);
    expect(res[1].id).toEqual(1);
    expect(res[2].id).toEqual(2);
  });
});

describe('selectAll - limit to and filterBy', () => {
  const store = new TodosStore();
  const query = new QueryEntity<any, any>(store);

  const elements = [
    { id: 1, value: 3 },
    { id: 2, value: 3 },
    { id: 3, value: 5 },
    { id: 4, value: 5 },
    { id: 5, value: 3 },
    { id: 6, value: 3 },
    { id: 7, value: 5 },
    { id: 8, value: 5 },
    { id: 9, value: 5 },
    { id: 10, value: 5 },
    { id: 11, value: 5 },
  ];

  let subscription: Subscription;
  store.add(elements);
  afterEach(() => subscription && subscription.unsubscribe());

  it('should support array', () => {
    let res;
    subscription = query
      .selectAll({
        filterBy: (el) => el.value === 5,
        limitTo: 5,
      })
      .subscribe((_res) => {
        res = _res;
      });
    expect(res.length).toBe(5);
  });

  it('should support asObject', () => {
    let res;
    subscription = query
      .selectAll({
        asObject: true,
        filterBy: (el) => el.value === 5,
        limitTo: 5,
      })
      .subscribe((_res) => {
        res = _res;
      });
    expect(Object.keys(res).length).toBe(5);
  });
});

describe('selectAll - limit to and filterBy and sorting', () => {
  const store = new TodosStore();
  const query = new QueryEntity<any, any>(store);

  const elements = [
    { id: 4, value: 5 },
    { id: 6, value: 3 },
    { id: 2, value: 3 },
    { id: 1, value: 3 },
    { id: 10, value: 5 },
    { id: 7, value: 5 },
    { id: 9, value: 5 },
    { id: 8, value: 5 },
    { id: 5, value: 3 },
    { id: 3, value: 5 },
    { id: 11, value: 5 },
  ];

  let subscription: Subscription;
  store.add(elements);
  afterEach(() => subscription && subscription.unsubscribe());

  it('should support array', () => {
    let res;
    subscription = query
      .selectAll({
        filterBy: (el) => el.value === 5,
        limitTo: 5,
        sortBy: 'id',
      })
      .subscribe((_res) => {
        res = _res;
      });
    expect(res.length).toBe(5);
  });

  it('should support array (2)', () => {
    let res;
    subscription = query
      .selectAll({
        filterBy: (el) => el.value === 5,
        limitTo: 8,
        sortBy: 'id',
      })
      .subscribe((_res) => {
        res = _res;
      });
    expect(res.length).toBe(7);
  });
});

describe('track entity ids', () => {
  const store = new TodosStore();
  const query = new QueryEntity(store);

  it('should track new entity id', () => {
    let res;

    store.add({ id: 10, title: 'title 10' });
    store.add({ id: 20, title: 'title 20' });

    query
      .selectEntity(10)
      .pipe(trackIdChanges(query))
      .subscribe((_res) => (res = _res));

    expect(res.id).toBe(10);
    expect(res.title).toBe('title 10');
    expect(Object.keys(store._value().entities).length).toBe(2);
    expect(Object.keys(store._value().ids).length).toBe(2);

    store.update(10, { id: 11, title: 'title 11' });
    store.update(20, { id: 21, title: 'title 21 - a' });

    expect(res.id).toBe(11);
    expect(res.title).toBe('title 11');
    expect(Object.keys(store._value().entities).length).toBe(2);
    expect(Object.keys(store._value().ids).length).toBe(2);

    store.update(11, { id: 12 });
    store.update(21, { title: 'title 21 - b' });

    expect(res.id).toBe(12);
    expect(res.title).toBe('title 11');
    expect(Object.keys(store._value().entities).length).toBe(2);
    expect(Object.keys(store._value().ids).length).toBe(2);

    store.update(12, { title: 'title 12' });

    expect(res.id).toBe(12);
    expect(res.title).toBe('title 12');
    expect(Object.keys(store._value().entities).length).toBe(2);
    expect(Object.keys(store._value().ids).length).toBe(2);
  });
});
