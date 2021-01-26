import { EntityStore, ID, StoreConfig } from '..';

class Todo {
  id;

  title;

  completed;

  constructor(params: { id: ID; title: string; completed: boolean }) {
    this.completed = params.completed || false;
    this.title = params.title;
    this.id = params.id;
  }
}

@StoreConfig({ name: 'todos' })
class TodosStore extends EntityStore<any, Todo> {}

const store = new TodosStore();

describe('Class Based', () => {
  it('should instantiate new Todo if not exists', function () {
    store.upsert(1, { title: 'new title' }, (id, newState) => ({ id, ...newState, completed: false }), { baseClass: Todo });
    expect(store._value().entities[1]).toBeInstanceOf(Todo);
    expect(store._value().entities[1].title).toBe('new title');
    expect(store._value().entities[1].completed).toBe(false);
    expect(store._value().entities[1].id).toBe(1);
    store.upsert(1, { title: 'new title2' }, (id, newState) => ({ id, ...newState, completed: false }), { baseClass: Todo });
    expect(store._value().entities[1]).toBeInstanceOf(Todo);
    expect(store._value().entities[1].title).toBe('new title2');
    expect(store._value().entities[1].completed).toBe(false);
    expect(store._value().entities[1].id).toBe(1);
  });
});
