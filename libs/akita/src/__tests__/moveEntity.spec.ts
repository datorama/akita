import { EntityStore, QueryEntity, StoreConfig } from '..';
import { EntityState } from '../lib/types';

interface Article {
  id: number;
  title: string;
}

type ArticlesState = EntityState<Article>;

@StoreConfig({ name: 'articles' })
class ArticlesStore extends EntityStore<ArticlesState> {}

class ArticlesQuery extends QueryEntity<ArticlesState> {}

const store = new ArticlesStore();
const query = new ArticlesQuery(store);

describe('Move', () => {
  it('should move entity in the collection', () => {
    const data = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      title: i.toString(),
    }));

    store.set(data);
    const spy = jest.fn();
    query.selectAll().subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);
    store.move(3, 2);
    expect(spy).toHaveBeenCalledTimes(2);

    expect(query.getValue().ids).toEqual([1, 2, 4, 3, 5]);
    // now it's [1, 2, 4, 3, 5]
    store.move(4, 3);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(query.getValue().ids).toEqual([1, 2, 4, 5, 3]);
  });
});
