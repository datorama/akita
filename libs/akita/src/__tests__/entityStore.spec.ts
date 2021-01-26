import { Todo, TodosStore, TodosStoreCustomID } from './setup';

describe('EntitiesStore', () => {
  let store: TodosStore;

  beforeEach(() => {
    store = new TodosStore();
  });

  describe('set', () => {
    it('should set', () => {
      store.set([new Todo({ id: 1, title: '1' })]);
      expect(store._value().entities[1]).toBeDefined();
    });

    it(`should set empty array when passing null`, () => {
      store.set(null);
      expect(store._value().ids).toEqual([]);
      expect(Object.keys(store._value().entities).length).toEqual(0);
    });

    it(`should set empty array when passing undefined`, () => {
      store.set(undefined);
      expect(store._value().ids).toEqual([]);
      expect(Object.keys(store._value().entities).length).toEqual(0);
    });

    it('should reset the active if entity does not exist anymore', () => {
      store.set([new Todo({ id: 1, title: '1' })]);
      store.setActive(1);
      expect(store._value().active).toEqual(1);
      expect(store._value().entities[1]).toEqual(new Todo({ id: 1, title: '1' }));
      store.set([new Todo({ id: 2, title: '2' })]);
      expect(store._value().active).toBeNull();
      expect(store._value().entities[1]).toBeUndefined();
      expect(store._value().entities[2]).toEqual(new Todo({ id: 2, title: '2' }));
    });
  });

  describe('add', () => {
    it('should add entity', () => {
      store.add(new Todo({ id: 1 }));
      expect(store._value().entities[1]).toBeDefined();
    });

    it('should add many', () => {
      store.add([new Todo({ id: 1 }), new Todo({ id: 2 })]);
      expect(store._value().entities[1]).toBeDefined();
      expect(store._value().entities[2]).toBeDefined();
    });

    it('should NOT add if all exist', () => {
      store.add([new Todo({ id: 1 }), new Todo({ id: 2 })]);
      expect(store._value().entities[1]).toBeDefined();
      expect(store._value().entities[2]).toBeDefined();
      jest.spyOn(store, '_setState');
      store.add([new Todo({ id: 1 }), new Todo({ id: 2 })]);
      expect(store._setState).not.toHaveBeenCalled();
    });

    it('should add if one of them NOT exist', () => {
      store.add([new Todo({ id: 1 }), new Todo({ id: 2 })]);
      expect(store._value().entities[1]).toBeDefined();
      expect(store._value().entities[2]).toBeDefined();
      jest.spyOn(store, '_setState');
      store.add([new Todo({ id: 1 }), new Todo({ id: 3 })]);
      expect(store._setState).toHaveBeenCalled();
      expect(store._value().entities[3]).toBeDefined();
    });

    it('should prepend with uid', () => {
      store.add(new Todo({ id: 1 }));
      store.add(new Todo({ id: 2 }));
      store.add(new Todo({ id: 3 }));
      store.add(new Todo({ id: 4 }), { prepend: true });
      store.add(new Todo({ id: 5 }), { prepend: true });
      store.add(new Todo({ id: 6 }), { prepend: true });
      expect(store._value().ids).toEqual([6, 5, 4, 1, 2, 3]);
    });

    it('should prepend with multi add', () => {
      store.add(new Todo({ id: 1 }));
      store.add(new Todo({ id: 2 }));
      store.add(new Todo({ id: 3 }));
      store.add([new Todo({ id: 4 }), new Todo({ id: 5 }), new Todo({ id: 6 })], { prepend: true });
      expect(store._value().ids).toEqual([6, 5, 4, 1, 2, 3]);
    });
  });

  describe('replace', () => {
    it('should replace entity', () => {
      store.add(new Todo({ id: 1 }));
      store.add(new Todo({ id: 2 }));
      store.replace(2, { title: 'replaced' });
      expect(store._value().entities[2]).toEqual({ id: 2, title: 'replaced' });
    });
  });

  describe('update', () => {
    it('should update entity', () => {
      store.add(new Todo({ id: 1 }));
      store.update(1, { title: 'update' });
      expect(store._value().entities[1].title).toEqual('update');
    });

    it('should update entity id', () => {
      store.add(new Todo({ id: 1 }));
      store.add(new Todo({ id: 2 }));
      store.update(1, { id: 3 });
      expect(store._value().entities[3].id).toEqual(3);
      expect(store._value().ids).toEqual([3, 2]);
    });

    it('should not update entity id when id did not change', () => {
      store.add(new Todo({ id: 1 }));
      store.add(new Todo({ id: 2 }));
      const idsBeforeUpdate = store._value().ids;
      store.update(1, { id: 1, name: 'updated' });
      expect(store._value().ids).toBe(idsBeforeUpdate);
    });

    it('should update entity with callback', () => {
      store.add(new Todo({ id: 1 }));
      store.update(1, (entity) => {
        return {
          title: 'update',
        };
      });
      expect(store._value().entities[1].title).toEqual('update');
    });

    it('should update many', () => {
      store.add(new Todo({ id: 1 }));
      store.add(new Todo({ id: 2 }));
      store.add(new Todo({ id: 3 }));
      store.update([1, 2], { title: 'update' });
      expect(store._value().entities[1].title).toEqual('update');
      expect(store._value().entities[2].title).toEqual('update');
      expect(store._value().entities[3].title).toEqual('3');
    });

    it('should update many with callback using entity object', () => {
      store.add(new Todo({ id: 1 }));
      store.add(new Todo({ id: 2 }));
      store.add(new Todo({ id: 3 }));
      store.update([1, 2], (entity) => ({ title: `update${entity.id}` }));
      expect(store._value().entities[1].title).toEqual('update1');
      expect(store._value().entities[2].title).toEqual('update2');
      expect(store._value().entities[3].title).toEqual('3');
    });

    it('should update all', () => {
      store.add(new Todo({ id: 1 }));
      store.add(new Todo({ id: 2 }));
      store.update(null, { title: 'update' });
      expect(store._value().entities[1].title).toEqual('update');
      expect(store._value().entities[2].title).toEqual('update');
    });

    it('should update by predicate', () => {
      store.add(new Todo({ id: 1 }));
      store.add(new Todo({ id: 2 }));
      store.update((e) => e.title === '2', { title: 'update' });
      expect(store._value().entities[1].title).toEqual('1');
      expect(store._value().entities[2].title).toEqual('update');
    });

    it('should not update by predicate which does not match any entity', () => {
      store.add(new Todo({ id: 1 }));
      store.add(new Todo({ id: 2 }));
      jest.spyOn(store, '_setState');
      store.update((e) => e.title === '3', { title: 'update' });
      expect(store._value().entities[1].title).toEqual('1');
      expect(store._value().entities[2].title).toEqual('2');
      expect(store._setState).not.toHaveBeenCalled();
    });
  });

  describe('updateActive', () => {
    it('should update the active', () => {
      const todo = new Todo({ id: 1 });
      store.add(todo);
      store.setActive(1);
      store.updateActive({ title: 'update' });
      expect(store._value().entities[1].title).toEqual('update');
    });

    it('should update the active with callback', () => {
      const todo = new Todo({ id: 1 });
      store.add(todo);
      store.setActive(1);
      store.updateActive((active) => {
        return {
          title: 'update',
        };
      });
      expect(store._value().entities[1].title).toEqual('update');
      expect(store._value().entities[1].id).toEqual(1);
    });
  });

  describe('setActive - next/prev', () => {
    it('should work next', () => {
      const todos = [new Todo({ id: 1 }), new Todo({ id: 2 }), new Todo({ id: 3 }), new Todo({ id: 4 })];
      store.add(todos);
      store.setActive(1);
      store.setActive({ next: true });
      expect(store._value().active).toBe(2);
      store.setActive({ next: true });
      expect(store._value().active).toBe(3);
      store.setActive({ next: true });
      expect(store._value().active).toBe(4);
      store.setActive({ next: true });
      expect(store._value().active).toBe(1);
      store.setActive({ next: true });
      expect(store._value().active).toBe(2);
    });

    it('should work prev', () => {
      const todos = [new Todo({ id: 1 }), new Todo({ id: 2 }), new Todo({ id: 3 }), new Todo({ id: 4 })];
      store.add(todos);
      store.setActive(1);
      store.setActive({ prev: true });
      expect(store._value().active).toBe(4);
      store.setActive({ prev: true });
      expect(store._value().active).toBe(3);
      store.setActive({ prev: true });
      expect(store._value().active).toBe(2);
      store.setActive({ prev: true });
      expect(store._value().active).toBe(1);
      store.setActive({ prev: true });
      expect(store._value().active).toBe(4);
    });

    it('should work mixed', () => {
      const todos = [new Todo({ id: 1 }), new Todo({ id: 2 }), new Todo({ id: 3 }), new Todo({ id: 4 })];
      store.add(todos);
      store.setActive(1);
      store.setActive({ prev: true });
      expect(store._value().active).toBe(4);
      store.setActive({ next: true });
      expect(store._value().active).toBe(1);
      store.setActive({ next: true });
      expect(store._value().active).toBe(2);
      store.setActive({ prev: true });
      expect(store._value().active).toBe(1);
    });

    it('should not do anything if active isNil', () => {
      const todos = [new Todo({ id: 1 }), new Todo({ id: 2 }), new Todo({ id: 3 }), new Todo({ id: 4 })];
      store.add(todos);
      store.setActive({ prev: true });
      expect(store._value().active).toBe(null);
    });

    it('should work normally without object', () => {
      const todos = [new Todo({ id: 1 }), new Todo({ id: 2 }), new Todo({ id: 3 }), new Todo({ id: 4 })];
      store.add(todos);
      store.setActive(2);
      expect(store._value().active).toBe(2);
      store.setActive(3);
      expect(store._value().active).toBe(3);
      store.setActive({ prev: true });
      expect(store._value().active).toBe(2);
    });

    it('should work without cycle', () => {
      const todos = [new Todo({ id: 1 }), new Todo({ id: 2 }), new Todo({ id: 3 }), new Todo({ id: 4 })];
      store.add(todos);
      store.setActive(1);
      store.setActive({ prev: true, wrap: false });
      expect(store._value().active).toBe(1);
      store.setActive({ next: true, wrap: false });
      expect(store._value().active).toBe(2);
      store.setActive({ next: true, wrap: false });
      expect(store._value().active).toBe(3);
      store.setActive({ next: true, wrap: false });
      expect(store._value().active).toBe(4);
      store.setActive({ next: true, wrap: false });
      expect(store._value().active).toBe(4);
    });
  });

  describe('remove', () => {
    it('should remove one', () => {
      const todo = new Todo({ id: 1 });
      store.add(todo);
      store.remove(1);
      expect(store._value().entities[1]).toBeUndefined();
    });

    it('should remove and set active to null', () => {
      const todo = new Todo({ id: 2 });
      store.add(todo);
      store.setActive(2);
      expect(store._value().active).toEqual(2);
      store.remove(2);
      expect(store._value().entities[2]).toBeUndefined();
      expect(store._value().active).toBeNull();
    });

    it('should remove and NOT set active to null', () => {
      store.add(new Todo({ id: 1 }));
      store.add(new Todo({ id: 2 }));
      store.setActive(2);
      expect(store._value().active).toEqual(2);
      store.remove(1);
      expect(store._value().active).toEqual(2);
    });

    it('should remove many', () => {
      const todo = new Todo({ id: 1 });
      const todo2 = new Todo({ id: 2 });
      store.add(todo);
      store.add(todo2);
      store.remove([1, 2]);
      expect(store._value().entities[1]).toBeUndefined();
      expect(store._value().entities[2]).toBeUndefined();
      expect(store._value().ids.length).toEqual(0);
    });

    it('should remove many by predicate', () => {
      const todo = new Todo({ id: 1 });
      const todo2 = new Todo({ id: 2 });
      store.add(todo);
      store.add(todo2);
      store.remove((e) => e.id === 1);
      expect(store._value().entities[1]).toBeUndefined();
      expect(store._value().entities[2]).toBe(todo2);
      expect(store._value().ids.length).toEqual(1);
    });

    it('should not remove any by predicate which does not match any entity', () => {
      const todo = new Todo({ id: 1 });
      const todo2 = new Todo({ id: 2 });
      store.add(todo);
      store.add(todo2);
      jest.spyOn(store, '_setState');
      store.remove((e) => e.id === 3);
      expect(store._value().entities[1]).toBe(todo);
      expect(store._value().entities[2]).toBe(todo2);
      expect(store._value().ids.length).toEqual(2);
      expect(store._setState).not.toHaveBeenCalled();
    });

    it('should remove all', () => {
      const todo = new Todo({ id: 1 });
      const todo2 = new Todo({ id: 2 });
      store.add(todo);
      store.add(todo2);
      store.remove();
      expect(store._value().entities[1]).toBeUndefined();
      expect(store._value().entities[2]).toBeUndefined();
      expect(store._value().ids.length).toEqual(0);
    });

    it('should remove all and set active to null', () => {
      const todo = new Todo({ id: 1 });
      const todo2 = new Todo({ id: 2 });
      store.add(todo);
      store.add(todo2);
      store.setActive(1);
      store.remove();
      expect(store._value().entities[1]).toBeUndefined();
      expect(store._value().entities[2]).toBeUndefined();
      expect(store._value().ids.length).toEqual(0);
      expect(store._value().active).toBeNull();
    });
  });

  describe('active', () => {
    it('should set active', () => {
      const todo = new Todo({ id: 2 });
      store.add(todo);
      store.setActive(2);
      expect(store._value().active).toEqual(2);
    });
  });

  describe('cache', () => {
    describe('With TTL', () => {
      const ttl = 100;

      beforeEach(() => {
        store = new TodosStore({ cache: { ttl } });
      });

      it('should init with false', () => {
        expect(store.cache.active.value).toBe(false);
        expect(store.cache.ttl).toBe(null);
      });

      it('should work in full flow', () => {
        jest.useFakeTimers();
        expect(store.cache.active.value).toBe(false);
        expect(store.cache.ttl).toBe(null);
        const todo = new Todo({ id: 2 });
        store.set(todo);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), ttl);
        expect(store.cache.active.value).toBe(true);
        expect(typeof store.cache.ttl).toBe('number');
        // ttl has passed
        jest.runAllTimers();
        expect(store.cache.active.value).toBe(false);
        expect(typeof store.cache.ttl).toBe('number');
        let previousTtl = store.cache.ttl;
        store.set(todo);
        expect(clearTimeout).toHaveBeenCalledTimes(1);
        expect(clearTimeout).toHaveBeenCalledWith(previousTtl);
        expect(store.cache.active.value).toBe(true);
        expect(typeof store.cache.ttl).toBe('number');
        previousTtl = store.cache.ttl;
        store.set(todo);
        expect(clearTimeout).toHaveBeenCalledTimes(2);
        expect(clearTimeout).toHaveBeenCalledWith(previousTtl);
        expect(store.cache.active.value).toBe(true);
        expect(typeof store.cache.ttl).toBe('number');
        store.remove();
        expect(store.cache.active.value).toBe(false);
        expect(typeof store.cache.ttl).toBe('number');
        jest.spyOn(store, 'setHasCache');
        jest.runAllTimers();
        expect(store.setHasCache).toHaveBeenCalledWith(false);
      });
    });

    describe('Without TTL', () => {
      it('should init with false', () => {
        expect(store.cache.active.value).toBe(false);
        expect(store.cache.ttl).toBe(null);
      });

      it('should work in full flow', () => {
        jest.useFakeTimers();
        const todo = new Todo({ id: 2 });
        store.set(todo);
        expect(setTimeout).not.toHaveBeenCalled();
        expect(store.cache.active.value).toBe(true);
        expect(store.cache.ttl).toBe(null);
        jest.runAllTimers();
        expect(store.cache.active.value).toBe(true);
        expect(store.cache.ttl).toBe(null);
        store.remove();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(store.cache.active.value).toBe(false);
        expect(store.cache.ttl).toBe(null);
        store.setHasCache(true);
        expect(store.cache.active.value).toBe(true);
        expect(store.cache.ttl).toBe(null);
      });
    });
  });
});

describe('Custom ID', () => {
  const store2 = new TodosStoreCustomID();

  it('should set with custom id', () => {
    store2.set([{ todoId: 1, title: '1' }]);
    expect(store2._value().entities[1]).toBeDefined();
  });

  it('should add with custom id', () => {
    store2.add([{ todoId: 2, title: '2' } as any]);
    expect(store2._value().entities[1]).toBeDefined();
    expect(store2._value().entities[2]).toBeDefined();
    expect(store2._value().entities[2].title).toEqual('2');
  });
});

describe('Store set options', () => {
  const store = new TodosStore();

  it('should support passing active id', () => {
    store.set([new Todo({ id: 1 })], { activeId: 1 });
    expect(store.getValue().active).toEqual(1);
    store.set([new Todo({ id: 1 })]);
    // should persist the id because it's in the store
    expect(store.getValue().active).toEqual(1);
    store.remove();
    expect(store.getValue().active).toEqual(null);
    store.set([new Todo({ id: 2 })], { activeId: 2 });
    expect(store.getValue().active).toEqual(2);
  });
});
