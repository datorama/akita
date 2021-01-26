import { BooksStore } from './booksStore';
import { createMockEntities } from './mocks';

describe('removeEntities', () => {
  it('should remove one', () => {
    const store = new BooksStore();
    store.add(createMockEntities());
    store.remove(1);
    expect(store._value().entities[1]).not.toBeDefined();
    expect(store._value().ids).toEqual([2]);
    store.remove();
  });

  it('should remove many', () => {
    const store = new BooksStore();
    store.add([...createMockEntities(), ...createMockEntities(10, 12)]); // [1, 2, 11, 12]
    store.remove([1, 11]);
    expect(store._value().entities[1]).not.toBeDefined();
    expect(store._value().entities[11]).not.toBeDefined();
    expect(store._value().entities[2]).toBeDefined();
    expect(store._value().entities[12]).toBeDefined();
    expect(store._value().ids).toEqual([2, 12]);
    store.remove();
  });

  it('should remove all', () => {
    const store = new BooksStore();
    store.add([...createMockEntities(), ...createMockEntities(10, 12)]); // [1, 2, 11, 12]
    store.remove();
    expect(store._value().entities).toEqual({});
    expect(store._value().ids).toEqual([]);
    store.remove();
  });

  it('should remove by predicate', () => {
    const store = new BooksStore();
    store.add([...createMockEntities(), ...createMockEntities(10, 12)]); // [1, 2, 11, 12]
    store.remove((entity) => entity.price === 11);
    expect(store._value().entities[11]).not.toBeDefined();
    expect(store._value().entities[1]).toBeDefined();
    expect(store._value().entities[2]).toBeDefined();
    expect(store._value().entities[12]).toBeDefined();
    expect(store._value().ids).toEqual([1, 2, 12]);
    store.remove();
  });

  it('should reset the active when removed', () => {
    const store = new BooksStore();
    store.add([...createMockEntities(), ...createMockEntities(10, 12)]); // [1, 2, 11, 12]
    store.setActive(1);
    store.remove(1);
    expect(store._value().active).toEqual(null);
    store.remove();
  });

  it('should reset the actives when removed', () => {
    const store = new BooksStore();
    store.add([...createMockEntities(), ...createMockEntities(10, 12)]); // [1, 2, 11, 12]
    store.setActive([1, 12] as any);
    store.remove([1, 12]);
    expect(store._value().active).toEqual([]);
    store.remove();
  });

  it('should reset the actives when removed (2)', () => {
    const store = new BooksStore();
    store.add([...createMockEntities(), ...createMockEntities(10, 12)]); // [1, 2, 11, 12]
    store.setActive([12, 2] as any);
    store.remove([12]);
    expect(store._value().active).toEqual([2]);
    store.remove();
  });
});
