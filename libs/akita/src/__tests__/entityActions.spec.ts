import { EntityState, EntityStore, ID, QueryEntity, StoreConfig } from '..';
import { EntityActions } from '../lib/entityActions';

interface Article {
  id: ID;
  title: string;
}

type ArticlesState = EntityState<Article>;

@StoreConfig({ name: 'articles' })
class ArticlesStore extends EntityStore<ArticlesState, Article> {}

class ArticlesQuery extends QueryEntity<ArticlesState, Article> {}

const store = new ArticlesStore();
const query = new ArticlesQuery(store);

describe('Entity Actions', () => {
  it('should listen for specific actions', () => {
    const spy = jest.fn();
    query.selectEntityAction(EntityActions.Set).subscribe(spy);
    query.selectEntityAction(EntityActions.Add).subscribe(spy);
    query.selectEntityAction(EntityActions.Update).subscribe(spy);
    query.selectEntityAction(EntityActions.Remove).subscribe(spy);

    expect(spy).not.toHaveBeenCalled();

    // set
    store.set([
      { id: 1, title: '1' },
      { id: 2, title: '2 ' },
    ]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith([1, 2]);

    // update
    store.update(1, { title: 'new' });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith([1]);

    // add
    store.add([
      { id: 3, title: '3' },
      { id: 4, title: '4' },
    ]);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenCalledWith([3, 4]);

    // remove
    store.remove([1, 2]);
    expect(spy).toHaveBeenCalledTimes(4);
    expect(spy).toHaveBeenCalledWith([1, 2]);

    store.remove();
    expect(spy).toHaveBeenCalledTimes(5);
    expect(spy).toHaveBeenCalledWith([3, 4]);
  });

  it('should listen for a subset of actions', () => {
    const spy = jest.fn();

    query.selectEntityAction([EntityActions.Update, EntityActions.Remove]).subscribe(spy);

    expect(spy).not.toHaveBeenCalled();

    // set
    store.set([
      { id: 1, title: '1' },
      { id: 2, title: '2 ' },
    ]);

    // add
    store.add({ id: 3, title: 'new' });

    expect(spy).not.toHaveBeenCalled();

    // update
    store.update(1, { title: 'updated ' });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ type: EntityActions.Update, ids: [1] });

    // remove
    store.remove([1, 2]);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith({ type: EntityActions.Remove, ids: [1, 2] });
  });

  it('should listen for all action', () => {
    const spy = jest.fn();
    query.selectEntityAction().subscribe(spy);
    store.set([
      { id: 1, title: '1' },
      { id: 2, title: '2 ' },
    ]);
    expect(spy).toHaveBeenCalledWith({ type: EntityActions.Set, ids: [1, 2] });
  });
});
