import { arrayUpsert } from '../lib/arrayUpsert';
import { EntityStore } from '../lib/entityStore';
import { StoreConfig } from '../lib/storeConfig';
import { EntityState, ID } from '../lib/types';

interface Comment {
  id: ID;
  text: string;
}

interface Article {
  id: ID;
  comments: Comment[];
  title: string;
}

interface ArticlesState extends EntityState<Article> {
  names: string[];
}

@StoreConfig({ name: 'articles' })
class ArticlesStore extends EntityStore<ArticlesState, Article> {
  constructor() {
    super({ names: ['a', 'b', 'c'] });
  }
}

const store = new ArticlesStore();

describe('arrayUpsert', () => {
  it('should update when the id is present', () => {
    const article: Article = {
      id: 1,
      title: 'title',
      comments: [
        { id: 1, text: 'comment' },
        { id: 2, text: 'comment2' },
      ],
    };

    store.add(article);

    store.update(1, (entity) => ({
      comments: arrayUpsert(entity.comments, 1, { text: 'updated' }),
    }));
    expect(store._value().entities[1].comments[0].text).toBe('updated');
    expect(store._value().entities[1].comments.length).toBe(2);
    store.remove();
  });

  it('should add when the id is not present', () => {
    const article: Article = {
      id: 1,
      title: 'title',
      comments: [
        { id: 1, text: 'comment' },
        { id: 2, text: 'comment2' },
      ],
    };

    store.add(article);

    store.update(1, (entity) => ({
      comments: arrayUpsert(entity.comments, 3, { text: 'NEW' }),
    }));
    expect(store._value().entities[1].comments[2].text).toBe('NEW');
    expect(store._value().entities[1].comments[2].id).toBe(3);
    expect(store._value().entities[1].comments.length).toBe(3);
    store.remove();
  });

  it('should work with non-objects', () => {
    store.update((state) => ({
      names: arrayUpsert(state.names, 'b', 'updatedName'),
    }));
    expect(store._value().names).toEqual(['a', 'updatedName', 'c']);
    store.update((state) => ({
      names: arrayUpsert(state.names, 'd', 'NEW'),
    }));
    expect(store._value().names).toEqual(['a', 'updatedName', 'c', 'NEW']);
  });
});
