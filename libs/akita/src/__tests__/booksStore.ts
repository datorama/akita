import { ActiveState, EntityState, EntityStore, ID, StoreConfig } from '..';

export interface TestBook {
  id: ID;
  title: string;
  price: number;
}

export interface TestBooksState extends EntityState<TestBook>, ActiveState {
  filter: string;
}

@StoreConfig({ name: 'books' })
export class BooksStore extends EntityStore<TestBooksState, TestBook> {
  constructor() {
    super({ filter: 'ALL', active: null });
  }
}
