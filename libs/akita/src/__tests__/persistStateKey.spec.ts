import { EntityStore } from '../lib/entityStore';
import { persistState } from '../lib/persistState';
import { StoreConfig } from '../lib/storeConfig';
import { tick } from './setup';

@StoreConfig({ name: 'todos' })
class TodosStore extends EntityStore<any, any> {
  constructor() {
    super({ ui: { filter: 'SHOW_ALL' } });
  }
}

describe('Persist state - prop', () => {
  localStorage.clear();

  persistState({ include: ['todos.ui'] });

  const todosStore = new TodosStore();

  it('should persist only the ui key', async () => {
    todosStore.update({ ui: { filter: 'SHOW_COMPLETED' } });
    await tick();
    expect(JSON.parse(localStorage.getItem('AkitaStores')).todos).toEqual({ filter: 'SHOW_COMPLETED' });
  });
});

describe('Persist state - initial', () => {
  localStorage.clear();
  localStorage.setItem('AkitaStores', JSON.stringify({ todos: { filter: 'SHOW_COMPLETED' } }));

  persistState({ include: ['todos.ui'] });

  const todosStore = new TodosStore();

  it('should persist only the ui key', async () => {
    await tick();
    expect(todosStore._value().ui).toEqual({ filter: 'SHOW_COMPLETED' });
  });
});

describe('Persist state - nested key', () => {
  localStorage.clear();

  @StoreConfig({ name: 'todos' })
  class TodosStore2 extends EntityStore<any, any> {
    constructor() {
      super({ a: { b: { c: { d: 'test' } } } });
    }
  }

  persistState({ include: ['todos.a.b.c.d'], key: 'TestA' });
  const todosStore = new TodosStore2();

  it('should persist only the nested key', async () => {
    todosStore.update({ a: { b: { c: { d: 'changed' } } } });
    await tick();
    expect(JSON.parse(localStorage.getItem('TestA')).todos).toEqual('changed');
  });
});

describe('Persist state - nested key initial', () => {
  localStorage.clear();
  localStorage.setItem('AkitaStores', JSON.stringify({ todos: 'changed' }));

  @StoreConfig({ name: 'todos' })
  class TodosStore2 extends EntityStore<any, any> {
    constructor() {
      super({ a: { b: { c: { e: 'hello', d: 'test', f: { g: 'Akita' } } } } });
    }
  }

  persistState({ include: ['todos.a.b.c.d'] });

  const todosStore = new TodosStore2();

  it('should persist only the d key', async () => {
    await tick();
    expect(todosStore._value().a.b.c.d).toEqual('changed');
    expect(todosStore._value().a.b.c.e).toEqual('hello');
    expect(todosStore._value().a.b.c.f.g).toEqual('Akita');
  });
});
