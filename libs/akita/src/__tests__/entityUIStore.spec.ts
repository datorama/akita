import { EntityState, EntityStore, EntityUIStore, ID, QueryEntity, StoreConfig } from '..';
import { EntityUIQuery } from '../lib/queryEntity';

interface Article {
  id: ID;
  title: string;
}

interface ArticleUI {
  isLoading: boolean;
  isOpen: boolean;
}

type ArticlesState = EntityState<Article>;

interface ArticlesUIState extends EntityState<ArticleUI> {
  rootProp: string;
}

@StoreConfig({ name: 'articles' })
class ArticlesStore extends EntityStore<ArticlesState, Article> {
  ui: EntityUIStore<ArticlesUIState, ArticleUI>;

  constructor() {
    super();
    this.createUIStore().setInitialEntityState({ isLoading: false, isOpen: true });
  }
}

class ArticlesQuery extends QueryEntity<ArticlesState, Article> {
  ui: EntityUIQuery<ArticlesUIState, ArticleUI>;

  constructor(store) {
    super(store);
    this.createUIQuery();
  }
}

const store = new ArticlesStore();
const query = new ArticlesQuery(store);

describe('EntityUIState', () => {
  it('should create a ui store', () => {
    expect(store.ui).toBeInstanceOf(EntityStore);
  });

  it('should create a ui query', () => {
    expect(query.ui).toBeInstanceOf(QueryEntity);
  });

  it('should set the default state when add entity to the store and remove it upon delete', () => {
    jest.spyOn(store.ui, 'set');
    jest.spyOn(store.ui, 'add');

    store.set([
      { id: 1, title: 'hello' },
      { id: 2, title: 'hello2' },
    ]);
    expect(store.ui.set).toHaveBeenCalledTimes(1);
    expect(store.ui.add).not.toHaveBeenCalled();
    expect(store.ui._value().ids.length).toBe(2);
    expect(store.ui._value().entities).toEqual({
      1: {
        id: 1,
        isLoading: false,
        isOpen: true,
      },
      2: {
        id: 2,
        isLoading: false,
        isOpen: true,
      },
    });

    store.add([
      { id: 3, title: 'hello3' },
      { id: 4, title: 'hello4' },
    ]);
    expect(store.ui.add).toHaveBeenCalledTimes(1);
    expect(store.ui._value().ids.length).toBe(4);
    expect(store.ui._value().entities).toEqual(
      expect.objectContaining({
        3: {
          id: 3,
          isLoading: false,
          isOpen: true,
        },
        4: {
          id: 4,
          isLoading: false,
          isOpen: true,
        },
      })
    );

    store.remove(2);
    expect(store.ui._value().entities[2]).toBeUndefined();
    expect(store.ui._value().ids.length).toBe(3);
  });

  it('should support upsertMany', () => {
    store.upsertMany([{ id: 20, title: 'new' }]);
    expect(store.ui._value().entities).toEqual(
      expect.objectContaining({
        '20': { id: 20, isLoading: false, isOpen: true },
      })
    );
  });

  it('should destroy the ui store when destroying the parent store', () => {
    jest.spyOn(store.ui, 'destroy');
    store.destroy();
    expect(store.ui.destroy).toHaveBeenCalledTimes(1);
  });
});

@StoreConfig({ name: 'articles' })
class Articles2Store extends EntityStore<ArticlesState, Article> {
  constructor() {
    super();
    this.createUIStore({}, { name: 'myname' });
  }
}

const store2 = new Articles2Store();

describe('EntityUIState - custom options', () => {
  it('should set the name', () => {
    expect((store2 as any).ui).toBeInstanceOf(EntityStore);
    expect((store2 as any).ui.storeName).toBe('myname');
  });
});

@StoreConfig({ name: 'articles', idKey: 'uid' })
class Articles3Store extends EntityStore<any, any> {
  counter = 0;

  constructor() {
    super();
    this.akitaPreAddEntity = this.akitaPreAddEntity.bind(this);
    this.createUIStore().setInitialEntityState({ isOpen: false });
  }

  akitaPreAddEntity(entity) {
    // eslint-disable-next-line no-plusplus
    return { ...entity, uid: this.counter++ };
  }
}

const store3 = new Articles3Store();

describe('EntityUIState - support a prehook', () => {
  it('should support work', () => {
    store3.set([{ title: '3' }]);
    store3.add([{ title: '1' }, { title: '2' }]);
    expect(store3.ui._value().ids).toEqual([0, 1, 2]);
    expect(store3.ui._value().entities).toEqual({ '0': { uid: 0, isOpen: false }, '1': { uid: 1, isOpen: false }, '2': { uid: 2, isOpen: false } });
  });
});
