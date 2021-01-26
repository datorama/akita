import { EntityStore } from '../lib/entityStore';
import { QueryEntity } from '../lib/queryEntity';
import { StoreConfig } from '../lib/storeConfig';
import { EntityState, ID } from '../lib/types';

type TodosState = EntityState<Todo>;

type Todo = {
  id: ID;
  completed?: boolean;
  title?: string;
};

@StoreConfig({
  name: 'todos',
})
class TodosStore extends EntityStore<TodosState, Todo> {}

class TodosQuery extends QueryEntity<TodosState, Todo> {
  constructor(protected store: TodosStore) {
    super(store);
  }
}

describe('Entity Query', () => {
  const store = new TodosStore();
  const query = new TodosQuery(store);

  describe('selectLast', () => {
    it('should work', () => {
      const spy = jest.fn();
      query.selectLast().subscribe(spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(undefined);
      store.add({ id: 1 });
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith({ id: 1 });
      store.add({ id: 2 });
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenCalledWith({ id: 2 });
      // should not have been call if the last id doesn't change
      store.add({ id: 20 }, { prepend: true });
      expect(spy).toHaveBeenCalledTimes(3);
      store.remove(2);
      expect(spy).toHaveBeenCalledTimes(4);
      expect(spy).toHaveBeenCalledWith({ id: 1 });
      store.update(1, { title: 'update' });
      expect(spy).toHaveBeenCalledTimes(5);
      expect(spy).toHaveBeenCalledWith({ id: 1, title: 'update' });
      store.remove();
      expect(spy).toHaveBeenCalledTimes(6);
      expect(spy).toHaveBeenCalledWith(undefined);
      store.add([{ id: 1 }, { id: 6 }, { id: 5 }]);
      expect(spy).toHaveBeenCalledTimes(7);
      expect(spy).toHaveBeenCalledWith({ id: 5 });
      // clear the store for the next spec
      store.remove();
      spy.mockClear();
    });
  });

  describe('selectFirst', () => {
    it('should work', () => {
      const spy = jest.fn();
      query.selectFirst().subscribe(spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(undefined);
      store.add({ id: 1 });
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith({ id: 1 });
      store.add({ id: 2 });
      // should not have been call if the first id doesn't change
      expect(spy).toHaveBeenCalledTimes(2);
      // should call upon update
      store.update(1, { title: 'update' });
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenCalledWith({ id: 1, title: 'update' });
      // should call when the id changed
      store.add({ id: 5 }, { prepend: true });
      expect(spy).toHaveBeenCalledTimes(4);
      expect(spy).toHaveBeenCalledWith({ id: 5 });
      store.remove();
      expect(spy).toHaveBeenCalledTimes(5);
      expect(spy).toHaveBeenCalledWith(undefined);
      spy.mockClear();
    });
  });

  it('with projection', () => {
    const spy = jest.fn();
    query.selectLast((entity) => entity.title).subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(undefined);
    store.add({ id: 1, title: 'a' });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith('a');
    // update different property should not cause next()
    store.update(1, { completed: true });
    expect(spy).toHaveBeenCalledTimes(2);
    store.update(1, { title: 'new title' });
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenCalledWith('new title');
    store.add({ id: 2, title: 'b' });
    expect(spy).toHaveBeenCalledTimes(4);
    expect(spy).toHaveBeenCalledWith('b');
  });
});
