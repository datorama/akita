import { EntityStore, StoreConfig } from '..';

interface Todo {
  id?: string;
  title: string;
  group: string;
  completed: boolean;
}

@StoreConfig({
  name: 'todos',
})
class TodosStore extends EntityStore<any, Todo> {
  akitaPreAddEntity(todo: Readonly<Todo>): Todo {
    return {
      id: `${todo.group}${todo.title}`,
      ...todo,
    };
  }
}

const store = new TodosStore();

describe('Custom id', () => {
  it('should set the custom id', () => {
    store.set([{ title: 'titleOne', completed: false, group: 'GroupA' }]);
    expect(store._value().entities.GroupAtitleOne.title).toBe('titleOne');
    expect(store._value().ids).toEqual([`GroupAtitleOne`]);
  });

  it('should add the custom id', () => {
    store.add([{ title: 'titleTwo', completed: false, group: 'GroupA' }]);
    expect(store._value().entities.GroupAtitleTwo.title).toBe('titleTwo');
    expect(store._value().ids).toEqual([`GroupAtitleOne`, `GroupAtitleTwo`]);
  });
});
