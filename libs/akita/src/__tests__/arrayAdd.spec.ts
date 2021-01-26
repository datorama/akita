import { arrayAdd } from '../lib/arrayAdd';
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
    super({ names: [] });
  }
}

const store = new ArticlesStore();

describe('arrayAdd', () => {
  it('should add one', () => {
    const store = new ArticlesStore();
    const article: Article = {
      id: 1,
      title: '',
      comments: [],
    };

    store.add(article);
    const comment = { id: 1, text: 'comment' };
    store.update(1, (state) => {
      return {
        comments: arrayAdd(state.comments, comment),
      };
    });
    expect(store._value().entities[1].comments.length).toBe(1);
    expect(store._value().entities[1].comments[0]).toBe(comment);
  });

  it('should add with empty initial array', () => {
    const store = new ArticlesStore();
    const article: Article = {
      id: 1,
      title: '',
      comments: null,
    };

    store.add(article);
    const comment = { id: 1, text: 'comment' };
    store.update(1, (state) => {
      return {
        comments: arrayAdd(state.comments, comment),
      };
    });
    expect(store._value().entities[1].comments.length).toBe(1);
    expect(store._value().entities[1].comments[0]).toBe(comment);
  });

  it('should add multi', () => {
    const store = new ArticlesStore();
    const article: Article = {
      id: 1,
      title: '',
      comments: [],
    };

    store.add(article);
    const comments = [
      { id: 1, text: 'comment' },
      { id: 2, text: 'comment2' },
    ];
    store.update(1, (state) => {
      return {
        comments: arrayAdd(state.comments, comments),
      };
    });
    expect(store._value().entities[1].comments.length).toBe(2);
    expect(store._value().entities[1].comments[0]).toBe(comments[0]);
    expect(store._value().entities[1].comments[1]).toBe(comments[1]);
  });

  it('should work with non-objects', () => {
    store.update((state) => {
      return {
        names: arrayAdd(state.names, 'Netanel'),
      };
    });
    expect(store._value().names).toEqual(['Netanel']);
    store.update((state) => ({
      names: arrayAdd(state.names, 'newName'),
    }));

    expect(store._value().names).toEqual(['Netanel', 'newName']);
  });
});
