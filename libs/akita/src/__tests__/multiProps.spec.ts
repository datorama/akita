import { createQuery, createStore } from '..';

type State = { name: string; email: string; age: number };

const store = createStore<State>({ name: '', email: '', age: 21 }, { name: 'test', resettable: true });
const query = createQuery<State>(store);

describe('Multi Selectors', () => {
  it('should work with props', () => {
    const arr = query.select(['name', 'email']);
    const spy = jest.fn();
    const sub = arr.subscribe(spy);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({
      name: '',
      email: '',
    });
    store.update({
      name: 'a',
      email: 'b',
    });

    expect(spy).toHaveBeenCalledWith({
      name: 'a',
      email: 'b',
    });
    expect(spy).toHaveBeenCalledTimes(2);
    store.update({ age: 33 });
    expect(spy).toHaveBeenCalledTimes(2);
    store.update({
      name: 'vv',
    });
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenCalledWith({
      name: 'vv',
      email: 'b',
    });
    store.update({ age: 335 });
    expect(spy).toHaveBeenCalledTimes(3);
    sub.unsubscribe();
    store.reset();
  });

  it('should work with callbacks', () => {
    const spy = jest.fn();
    const arr = query.select([(state) => state.age, (state) => state.name]);

    arr.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith([21, '']);
    store.update({
      age: 22,
      name: 'new',
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith([22, 'new']);

    store.update({
      email: 'new',
    });
    expect(spy).toHaveBeenCalledTimes(2);
    store.update({
      age: 33,
    });
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenCalledWith([33, 'new']);

    store.update({
      name: 'bla',
    });

    expect(spy).toHaveBeenCalledTimes(4);
    expect(spy).toHaveBeenCalledWith([33, 'bla']);
  });
});
