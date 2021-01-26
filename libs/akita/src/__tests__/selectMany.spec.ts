import { EntityState, EntityStore, ID, QueryEntity, StoreConfig } from '..';

interface Article {
  id: ID;
}

type ArticlesState = EntityState<Article>;

@StoreConfig({ name: 'articles' })
class ArticlesStore extends EntityStore<ArticlesState, Article> {}

class ArticlesQuery extends QueryEntity<ArticlesState, Article> {}

const store = new ArticlesStore();
const query = new ArticlesQuery(store);
jest.useFakeTimers();

describe('selectMany', () => {
  it('should filter nil', () => {
    const spy = jest.fn();
    store.set([]);
    query.selectMany([1, 2]).subscribe(spy);
    jest.runAllTimers();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith([]);
    store.add({ id: 1 });
    jest.runAllTimers();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith([{ id: 1 }]);
    expect(true).toBeTruthy();
  });
});
