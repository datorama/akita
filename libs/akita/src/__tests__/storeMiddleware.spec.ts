import { BooksStore } from './booksStore';
import { createMockEntities } from './mocks';

describe('Middleware', () => {
  describe('akitaPreAddEntity', () => {
    it('should apply akitaPreAddEntity middleware', () => {
      BooksStore.prototype.akitaPreAddEntity = function (book) {
        if (book.price === 1) {
          return {
            ...book,
            price: 20,
          };
        }

        return book;
      };
      const store = new BooksStore();
      store.add(createMockEntities());

      expect(store._value().entities[1].price).toBe(20);
      store.remove();
      store.set(createMockEntities());
      expect(store._value().entities[1].price).toBe(20);
    });
  });

  describe('akitaPreUpdateEntity', () => {
    it('should apply akitaPreUpdateEntity middleware', () => {
      BooksStore.prototype.akitaPreUpdateEntity = function (prevBook, nextBook) {
        if (nextBook.price === 100) {
          return {
            ...prevBook,
            price: 99,
          };
        }

        return nextBook;
      };
      const store = new BooksStore();
      store.add(createMockEntities());
      store.update(2, { price: 100 });

      expect(store._value().entities[2].price).toBe(99);
    });
  });
});
