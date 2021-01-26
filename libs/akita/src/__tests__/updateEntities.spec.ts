import { BooksStore } from './booksStore';
import { createMockEntities } from './mocks';

describe('updateEntities', () => {
  describe('Update root state', () => {
    it('should update', () => {
      const store = new BooksStore();
      store.update({ filter: 'COMPLETED' });
      expect(store._value().filter).toEqual('COMPLETED');
    });

    it('should support callback', () => {
      const store = new BooksStore();
      store.update((state) => ({ filter: `${state.filter}_CHANGED` }));
      expect(store._value().filter).toEqual('ALL_CHANGED');
      expect(store._value().entities).toEqual({});
      expect(store._value().ids).toEqual([]);
    });
  });

  describe('Update entity', () => {
    it('should support partial entity', () => {
      const store = new BooksStore();
      store.add(createMockEntities());
      store.update(1, { title: 'new title' });
      expect(store._value().entities[1].title).toEqual('new title');
      store.remove();
    });

    it('should support entity callback', () => {
      const store = new BooksStore();
      store.add(createMockEntities());
      store.update(1, (entity) => ({
        title: `${entity.title}_changed`,
      }));
      expect(store._value().entities[1].title).toEqual('Item 1_changed');
      store.remove();
    });

    it('should support array of entities', () => {
      const store = new BooksStore();
      store.add(createMockEntities());
      store.update([1, 2], (entity) => ({
        title: `${entity.title}_changed`,
      }));
      expect(store._value().entities[1].title).toEqual('Item 1_changed');
      expect(store._value().entities[2].title).toEqual('Item 2_changed');
      store.remove();
    });

    it('should support all', () => {
      const store = new BooksStore();
      store.add(createMockEntities());
      store.update(null, { price: 10 });

      expect(store._value().entities[1].price).toEqual(10);
      expect(store._value().entities[2].price).toEqual(10);
      store.remove();
    });

    it('should support all with callback', () => {
      const store = new BooksStore();
      store.add(createMockEntities());
      store.update(null, (entity) => ({
        title: `${entity.title}_changed`,
      }));

      expect(store._value().entities[1].title).toEqual('Item 1_changed');
      expect(store._value().entities[2].title).toEqual('Item 2_changed');
      store.remove();
    });

    it('should support predicate', () => {
      const store = new BooksStore();
      store.add(createMockEntities());
      store.update((entity) => entity.price === 1, { title: 'Changed' });

      expect(store._value().entities[1].title).toEqual('Changed');
      expect(store._value().entities[2].title).toEqual('Item 2');
      store.remove();
    });

    it('should support predicate - callback', () => {
      const store = new BooksStore();
      store.add(createMockEntities());
      store.update(
        (entity) => entity.price === 1,
        (entity) => ({
          title: `${entity.title}_changed`,
        })
      );

      expect(store._value().entities[1].title).toEqual('Item 1_changed');
      expect(store._value().entities[2].title).toEqual('Item 2');
      store.remove();
    });

    it('should do nothing if non of the predicate matches', () => {
      const store = new BooksStore();
      store.add(createMockEntities());
      jest.spyOn(store, '_setState');
      store.update((entity) => entity.price === 10, { title: 'Changed' });
      expect(store._setState).not.toHaveBeenCalled();
      store.remove();
    });

    it('should update the id if changed', () => {
      const store = new BooksStore();
      store.add(createMockEntities());
      store.update(1, { title: 'Changed', id: 13 });
      expect(store._value().entities[13]).toBeDefined();
      expect(store._value().entities[1]).not.toBeDefined();
      expect(store._value().ids).toEqual([13, 2]);
      store.remove();
    });
  });
});
