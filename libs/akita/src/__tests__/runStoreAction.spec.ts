import { BooksStore, TestBook, TestBooksState } from './booksStore';
import { runStoreAction, StoreActions } from '../lib/runStoreAction';
import { createMockEntities } from './mocks';

describe('runStoreAction', () => {
  it('should run store actions', () => {
    const store = new BooksStore();

    runStoreAction<TestBook>('books', StoreActions.SetEntities({ data: createMockEntities() }));
    expect(store._value().ids.length).toBe(2);

    runStoreAction<TestBook>('books', StoreActions.AddEntities({ data: createMockEntities(10, 12) }));
    expect(store._value().ids.length).toBe(4);

    runStoreAction<TestBook>(
      'books',
      StoreActions.UpdateEntities({
        data: { title: 'New title' },
        entityIds: 2,
      })
    );
    expect(store._value().entities[2].title).toBe('New title');

    runStoreAction<TestBook>(
      'books',
      StoreActions.UpsertEntities({
        data: { title: 'Another title' },
        entityIds: [2, 3],
      })
    );
    expect(store._value().entities[2].title).toBe('Another title');
    expect(store._value().entities[3].title).toBe('Another title');
    expect(store._value().entities[3].price).toBe(undefined);
    expect(store._value().ids.length).toBe(5);

    runStoreAction<TestBook>(
      'books',
      StoreActions.UpsertEntities({
        data: {
          newState: { title: 'Another title 2' },
          onCreate: (id, newState) => ({ id, ...newState, price: 0 }),
        },
        entityIds: [2, 3],
      })
    );
    expect(store._value().entities[2].title).toBe('Another title 2');
    expect(store._value().entities[3].title).toBe('Another title 2');
    expect(store._value().ids.length).toBe(5);

    runStoreAction<TestBook>(
      'books',
      StoreActions.UpsertManyEntities({
        data: [
          { id: 2, title: 'New title', price: 0 },
          { id: 4, title: 'Another title', price: 0 },
        ],
      })
    );
    expect(store._value().entities[2].title).toBe('New title');
    expect(store._value().ids.length).toBe(6);

    runStoreAction<TestBook>('books', StoreActions.RemoveEntities({ entityIds: 1 }));
    expect(store._value().entities[1]).toBeUndefined();

    runStoreAction<TestBooksState>('books', StoreActions.Update({ data: { filter: 'COMPLETE' } }));
    expect(store._value().filter).toBe('COMPLETE');
  });
});
