import { arrayFind } from '../lib/arrayFind';
import { EntityStore } from '../lib/entityStore';
import { QueryEntity } from '../lib/queryEntity';
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

type ArticlesState = EntityState<Article>;

@StoreConfig({ name: 'articles' })
class ArticlesStore extends EntityStore<ArticlesState> {}

class ArticlesQuery extends QueryEntity<ArticlesState> {}

const store = new ArticlesStore();
const query = new ArticlesQuery(store);

describe('arrayFind.spec.ts', () => {
  it('should find one', () => {
    const spy = jest.fn();
    const article: Article = {
      id: 1,
      title: '',
      comments: [
        { id: 1, text: '1' },
        { id: 2, text: '2' },
        { id: 3, text: '3' },
      ],
    };

    const article2: Article = {
      id: 2,
      title: '',
      comments: [
        { id: 1, text: '1' },
        { id: 2, text: '2' },
        { id: 3, text: '3' },
      ],
    };
    store.add([article, article2]);
    let result: Comment;

    query
      .selectEntity(1, 'comments')
      .pipe(arrayFind(1))
      .subscribe((v) => {
        result = v;
        spy();
      });

    expect(result).toBe(article.comments[0]);
    expect(spy).toHaveBeenCalledTimes(1);

    store.update(1, (entity) => {
      return {
        comments: entity.comments.map((comment) => {
          if (comment.id === 1) {
            return {
              ...comment,
              text: 'update',
            };
          }
          return comment;
        }),
      };
    });

    expect(spy).toHaveBeenCalledTimes(2);
    // it should not fire when updating a different comment
    store.update(1, (entity) => {
      return {
        comments: entity.comments.map((comment) => {
          if (comment.id === 2) {
            return {
              ...comment,
              text: 'update',
            };
          }
          return comment;
        }),
      };
    });

    // it should not fire when deleting a different comment
    store.remove(2);
    expect(spy).toHaveBeenCalledTimes(2);

    // it should fire when deleteing the sub entity
    store.update(1, (entity) => {
      return {
        comments: entity.comments.filter((comment) => comment.id !== 1),
      };
    });
    expect(spy).toHaveBeenCalledTimes(3);
    // we delete the item so the result should be undefined
    expect(result).toBe(undefined);
  });

  it('should find one by id of type string', () => {
    store.remove();
    const spy = jest.fn();
    const article: Article = {
      id: 1,
      title: '',
      comments: [
        { id: 'one', text: '1' },
        { id: 'two', text: '2' },
        { id: 'three', text: '3' },
      ],
    };

    const article2: Article = {
      id: 2,
      title: '',
      comments: [
        { id: 'one', text: '1' },
        { id: 'two', text: '2' },
        { id: 'three', text: '3' },
      ],
    };
    store.add([article, article2]);
    let result: Comment;

    query
      .selectEntity(1, 'comments')
      .pipe(arrayFind('one'))
      .subscribe((v) => {
        result = v;
        spy();
      });

    expect(result).toBe(article.comments[0]);
    expect(spy).toHaveBeenCalledTimes(1);

    store.update(1, (entity) => {
      return {
        comments: entity.comments.map((comment) => {
          if (comment.id === 'one') {
            return {
              ...comment,
              text: 'update',
            };
          }
          return comment;
        }),
      };
    });

    expect(spy).toHaveBeenCalledTimes(2);
    // it should not fire when updating a different comment
    store.update(1, (entity) => {
      return {
        comments: entity.comments.map((comment) => {
          if (comment.id === 'two') {
            return {
              ...comment,
              text: 'update',
            };
          }
          return comment;
        }),
      };
    });

    // it should not fire when deleting a different comment
    store.remove(2);
    expect(spy).toHaveBeenCalledTimes(2);

    // it should fire when deleteing the sub entity
    store.update(1, (entity) => {
      return {
        comments: entity.comments.filter((comment) => comment.id !== 'one'),
      };
    });
    expect(spy).toHaveBeenCalledTimes(3);
    // we delete the item so the result should be undefined
    expect(result).toBe(undefined);
  });

  it('should return undefined if the collection doesnt exist', () => {
    const spy = jest.fn();
    let result: Comment;

    query
      .selectEntity(1, 'comments')
      .pipe(arrayFind(1))
      .subscribe((v) => {
        result = v;
        spy();
      });

    expect(result).toBeUndefined();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should return undefined if the collection doesnt exist - array', () => {
    store.remove();
    const spy = jest.fn();
    let result: Comment[];

    query
      .selectEntity(1, 'comments')
      .pipe(arrayFind([1, 2]))
      .subscribe((v) => {
        result = v;
        spy();
      });

    expect(result).toBeUndefined();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should find multi', () => {
    store.remove();
    const spy = jest.fn();
    const article: Article = {
      id: 1,
      title: '',
      comments: [
        { id: 1, text: '1' },
        { id: 2, text: '2' },
        { id: 3, text: '3' },
      ],
    };
    const article2: Article = {
      id: 2,
      title: '',
      comments: [
        { id: 1, text: '1' },
        { id: 2, text: '2' },
        { id: 3, text: '3' },
      ],
    };
    store.add([article, article2]);

    let result: Comment[];

    query
      .selectEntity(1, 'comments')
      .pipe(arrayFind([1, 3]))
      .subscribe((v) => {
        result = v;
        spy();
      });

    expect(result.length).toBe(2);
    expect(result[0]).toBe(article.comments[0]);
    expect(result[1]).toBe(article.comments[2]);
    expect(spy).toHaveBeenCalledTimes(1);

    // it should fire when updating one of the ids
    store.update(1, (entity) => {
      return {
        comments: entity.comments.map((comment) => {
          if (comment.id === 1) {
            return {
              ...comment,
              text: 'update',
            };
          }
          return comment;
        }),
      };
    });

    expect(spy).toHaveBeenCalledTimes(2);
    // it should not fire when updating a different comment
    store.update(1, (entity) => {
      return {
        comments: entity.comments.map((comment) => {
          if (comment.id === 2) {
            return {
              ...comment,
              text: 'update',
            };
          }
          return comment;
        }),
      };
    });
    expect(spy).toHaveBeenCalledTimes(2);

    // it should fire when deleting one of the ids
    store.update(1, (entity) => {
      return {
        comments: entity.comments.filter((comment) => comment.id !== 1),
      };
    });

    expect(spy).toHaveBeenCalledTimes(3);
    expect(result.length).toBe(1);
    expect(result).toEqual([article.comments[2]]);

    // it should fire when deleting one of the ids (the last in this case)
    store.update(1, (entity) => {
      return {
        comments: entity.comments.filter((comment) => comment.id !== 3),
      };
    });
    expect(spy).toHaveBeenCalledTimes(4);
    expect(result.length).toBe(0);
    expect(result).toEqual([]);

    // it should fire when deleting the entity
    store.remove(1);
    expect(spy).toHaveBeenCalledTimes(5);
    expect(result).toEqual(undefined);
  });

  it('should find by predicate', () => {
    store.remove();
    const spy = jest.fn();
    const article: Article = {
      id: 1,
      title: '',
      comments: [
        { id: 1, text: '1' },
        { id: 2, text: '2' },
        { id: 3, text: '3' },
      ],
    };
    store.add(article);
    let result: Comment[];

    query
      .selectEntity(1, 'comments')
      .pipe(arrayFind((comment) => comment.text === '1'))
      .subscribe((v) => {
        result = v;
        spy();
      });

    expect(result.length).toBe(1);
    expect(result[0]).toBe(article.comments[0]);
    expect(spy).toHaveBeenCalledTimes(1);
    store.update(1, (entity) => {
      return {
        comments: entity.comments.map((comment) => {
          if (comment.id === 1) {
            return {
              ...comment,
              text: 'update',
            };
          }
          return comment;
        }),
      };
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(result.length).toBe(0);
    store.update(1, (entity) => {
      return {
        comments: [...entity.comments, { id: 4, text: '1' }],
      };
    });
    expect(spy).toHaveBeenCalledTimes(3);
    expect(result.length).toBe(1);
  });
});
