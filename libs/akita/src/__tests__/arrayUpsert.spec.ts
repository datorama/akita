import { EntityState, ID } from '../lib/types';
import { StoreConfig } from '../lib/storeConfig';
import { EntityStore } from '../lib/entityStore';
import { arrayUpsert } from '../lib/arrayUpsert';

type Modify<T, R> = Omit<T, keyof R> & R;

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

  it('should add to a non-existent collection', () => {
    const article = {
      id: 1,
      title: 'title',
      comments: [{ _id: 1, text: 'comment' } as any, { _id: 2, text: 'comment2' } as any],
    };

    store.add(article);

    store.update(1, (entity) => ({
      comments: arrayUpsert(
        entity.comments,
        [
          { _id: 1, text: 'NEW1' },
          { _id: 2, text: 'NEW2' },
        ],
        '_id'
      ),
    }));
    expect(store._value().entities[1].comments[0].text).toBe('NEW1');
    expect(store._value().entities[1]['comments' as any][0]._id).toBe(1);
    expect(store._value().entities[1].comments[1].text).toBe('NEW2');
    expect(store._value().entities[1]['comments' as any][1]._id).toBe(2);
    expect(store._value().entities[1].comments.length).toBe(2);
    store.remove();
  });

  it('should add many when the id is not present', () => {
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
      comments: arrayUpsert(entity.comments, [
        { id: 3, text: 'NEW3' },
        { id: 4, text: 'NEW4' },
      ]),
    }));
    expect(store._value().entities[1].comments[2].text).toBe('NEW3');
    expect(store._value().entities[1].comments[2].id).toBe(3);
    expect(store._value().entities[1].comments[3].text).toBe('NEW4');
    expect(store._value().entities[1].comments[3].id).toBe(4);
    expect(store._value().entities[1].comments.length).toBe(4);
    store.remove();
  });

  it('should update many when the id is present', () => {
    const article: Article = {
      id: 1,
      title: 'title',
      comments: [
        { id: 1, text: 'comment' },
        { id: 2, text: 'comment2' },
        { id: 3, text: 'comment3' },
      ],
    };

    store.add(article);

    store.update(1, (entity) => ({
      comments: arrayUpsert(entity.comments, [
        { id: 1, text: 'UPDATED1' },
        { id: 3, text: 'UPDATED3' },
      ]),
    }));
    expect(store._value().entities[1].comments[0].text).toBe('UPDATED1');
    expect(store._value().entities[1].comments[0].id).toBe(1);
    expect(store._value().entities[1].comments[2].text).toBe('UPDATED3');
    expect(store._value().entities[1].comments[2].id).toBe(3);
    expect(store._value().entities[1].comments.length).toBe(3);
    store.remove();
  });

  it('should add and update many dependant on id being present', () => {
    const article: Article = {
      id: 1,
      title: 'title',
      comments: [{ _id: 1, text: 'comment' } as any, { _id: 2, text: 'comment2' } as any, { _id: 3, text: 'comment3' } as any],
    };

    store.add(article);

    store.update(1, (entity) => ({
      comments: arrayUpsert(
        entity.comments,
        [
          { _id: 1, text: 'UPDATED1' },
          { _id: 3, text: 'UPDATED3' },
          { _id: 4, text: 'NEW4' },
        ],
        '_id'
      ),
    }));
    expect(store._value().entities[1].comments[0].text).toBe('UPDATED1');
    expect(store._value().entities[1]['comments' as any][0]._id).toBe(1);
    expect(store._value().entities[1].comments[2].text).toBe('UPDATED3');
    expect(store._value().entities[1]['comments' as any][2]._id).toBe(3);
    expect(store._value().entities[1].comments[3].text).toBe('NEW4');
    expect(store._value().entities[1]['comments' as any][3]._id).toBe(4);
    expect(store._value().entities[1].comments.length).toBe(4);
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
