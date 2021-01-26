import { take } from 'rxjs/operators';
import { EntityStore } from '../lib/entityStore';
import { QueryEntity } from '../lib/queryEntity';
import { StoreConfig } from '../lib/storeConfig';
import { EntityState, ID, MultiActiveState } from '../lib/types';

type Todo = {
  id: ID;
  title: string;
  completed?: boolean;
};

interface TodosState extends EntityState<Todo>, MultiActiveState {}

@StoreConfig({
  name: 'todos',
})
class TodosStore extends EntityStore<TodosState, Todo> {}

class TodosQuery extends QueryEntity<TodosState, Todo> {}

const store = new TodosStore();
const query = new TodosQuery(store);

describe('Multi active', () => {
  store.set(
    Array.from({ length: 10 }, (_, i) => {
      return {
        id: i,
        title: `Todo ${i}`,
      };
    })
  );

  it('should set multiple ids', () => {
    jest.spyOn(store as any, '_setActive');
    store.setActive([1, 2, 3]);
    expect((store as any)._setActive).toHaveBeenCalledWith([1, 2, 3]);
    expect(store._value().active).toEqual([1, 2, 3]);
  });

  it('should check whether hasActive', () => {
    expect(query.hasActive(2)).toBe(true);
    expect(query.hasActive(23)).toBe(false);
    expect(query.hasActive()).toBe(true);
  });

  it('should add ids', () => {
    store.addActive([4, 5]);
    expect(store._value().active).toEqual([1, 2, 3, 4, 5]);
    store.addActive(6);
    expect(store._value().active).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should not add if exist', () => {
    store.addActive(6);
    store.addActive(6);
    store.addActive(6);
    expect(store._value().active).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should not remove if not exist', () => {
    jest.spyOn(store, '_setState');
    store.removeActive(64);
    store.removeActive([33, 44]);
    expect(store._setState).not.toHaveBeenCalled();
  });

  it('should remove ids', () => {
    store.removeActive([4, 5]);
    expect(store._value().active).toEqual([1, 2, 3, 6]);
  });

  describe('Query', () => {
    jest.useFakeTimers();

    it('should get active ids', () => {
      const active = query.getActiveId();
      expect(active).toEqual([1, 2, 3, 6]);
    });

    it('should select active ids', () => {
      const spy = jest.fn();
      query.selectActiveId().pipe(take(2)).subscribe(spy);
      expect(spy).toHaveBeenCalledWith([1, 2, 3, 6]);
      store.addActive([55]);
      expect(spy).toHaveBeenCalledWith([1, 2, 3, 6, 55]);
    });

    it('should get actives', () => {
      const actives = query.getActive();
      expect(actives.length).toEqual(5);
      expect(actives[0].id).toEqual(1);
      expect(actives[1].id).toEqual(2);
      expect(actives[2].id).toEqual(3);
      expect(actives[3].id).toEqual(6);
    });

    it('should remove the entity from the actives upon deletion', () => {
      store.remove(6);
      expect(query.getActiveId()).toEqual([1, 2, 3]);
    });

    it('should return the same reference if nothing has changed', () => {
      const ids = query.getActiveId();
      store.remove(8);
      expect(ids).toBe(ids);
    });

    it('should toggle', () => {
      store.toggleActive(9);
      expect(query.getActiveId().includes(9)).toBe(true);
      store.toggleActive(9);
      expect(query.getActiveId().includes(9)).toBe(false);
    });

    it('should update actives', () => {
      // [1, 2, 3]
      store.updateActive({ completed: true });
      // eslint-disable-next-line no-restricted-syntax
      for (const active of query.getActive()) {
        expect(active.completed).toBe(true);
      }
    });

    it('should select actives', () => {
      const spy = jest.fn();
      store.setActive([1, 2]);

      query.selectActive().pipe(take(2)).subscribe(spy);
      jest.runAllTimers();
      expect(spy).toHaveBeenCalledWith([
        {
          id: 1,
          title: 'Todo 1',
          completed: true,
        },
        {
          id: 2,
          title: 'Todo 2',
          completed: true,
        },
      ]);

      store.setActive([3, 4]);
      jest.runAllTimers();
      expect(spy).toHaveBeenCalledWith([
        {
          id: 3,
          title: 'Todo 3',
          completed: true,
        },
        {
          id: 4,
          title: 'Todo 4',
        },
      ]);
    });

    it('should update actives callback', () => {
      // [3. 4]
      store.updateActive((todo) => {
        return {
          completed: !todo.completed,
        };
      });
      expect(store._value().entities[3].completed).toBe(false);
      expect(store._value().entities[4].completed).toBe(true);
    });
  });
});
