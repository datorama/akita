import { TestBook } from './booksStore';

export const entitiesMapMock = {
  1: {
    id: 1,
    title: `Item 1`,
    price: 1,
  },
  2: {
    id: 2,
    title: `Item 2`,
    price: 2,
  },
};

export function createMockEntities(start = 0, end = 2): TestBook[] {
  return Array.from({ length: end - start }, (v, k) => {
    const i = k + start;
    return {
      id: i + 1,
      title: `Item ${i + 1}`,
      price: i + 1,
    };
  });
}
