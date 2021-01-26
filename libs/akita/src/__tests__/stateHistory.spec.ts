import { arrayAdd } from '@datorama/akita';
import { Observable } from 'rxjs';
import { StateHistoryPlugin } from '../lib/plugins/stateHistory/stateHistoryPlugin';
import { Query } from '../lib/query';
import { Store } from '../lib/store';
import { StoreConfig } from '../lib/storeConfig';

interface State {
  counter: number;
}

@StoreConfig({ name: 'count' })
class CounterStore extends Store<State> {
  constructor() {
    super({ counter: 0 });
  }
}

class CounterQuery extends Query<State> {
  constructor(protected store) {
    super(store);
  }
}

describe('StateHistory', () => {
  const store = new CounterStore();
  const query = new CounterQuery(store);
  const stateHistory = new StateHistoryPlugin(query);

  it('should set the current state', () => {
    expect(stateHistory.history).toEqual({
      past: [],
      present: { counter: 0 },
      future: [],
    });
  });

  it('should work', () => {
    expect(stateHistory.hasPast).toBeFalsy();
    expect(stateHistory.hasFuture).toBeFalsy();

    store._setState((state) => {
      return {
        counter: state.counter + 1,
      };
    });

    expect(stateHistory.history).toEqual({
      past: [{ counter: 0 }],
      present: { counter: 1 },
      future: [],
    });

    expect(stateHistory.hasPast).toBeTruthy();
    expect(stateHistory.hasFuture).toBeFalsy();

    store._setState((state) => {
      return {
        counter: state.counter + 1,
      };
    });

    expect(stateHistory.history).toEqual({
      past: [{ counter: 0 }, { counter: 1 }],
      present: { counter: 2 },
      future: [],
    });

    expect(stateHistory.hasPast).toBeTruthy();
    expect(stateHistory.hasFuture).toBeFalsy();

    stateHistory.undo();

    expect(stateHistory.history).toEqual({
      past: [{ counter: 0 }],
      present: { counter: 1 },
      future: [{ counter: 2 }],
    });

    expect(stateHistory.hasPast).toBeTruthy();
    expect(stateHistory.hasFuture).toBeTruthy();

    stateHistory.undo();

    expect(stateHistory.history).toEqual({
      past: [],
      present: { counter: 0 },
      future: [{ counter: 1 }, { counter: 2 }],
    });

    expect(stateHistory.hasPast).toBeFalsy();
    expect(stateHistory.hasFuture).toBeTruthy();

    stateHistory.redo();

    expect(stateHistory.history).toEqual({
      past: [{ counter: 0 }],
      present: { counter: 1 },
      future: [{ counter: 2 }],
    });

    expect(stateHistory.hasPast).toBeTruthy();
    expect(stateHistory.hasFuture).toBeTruthy();

    stateHistory.redo();

    expect(stateHistory.history).toEqual({
      past: [{ counter: 0 }, { counter: 1 }],
      present: { counter: 2 },
      future: [],
    });

    expect(stateHistory.hasPast).toBeTruthy();
    expect(stateHistory.hasFuture).toBeFalsy();

    store._setState((state) => {
      return {
        counter: state.counter + 1,
      };
    });

    store._setState((state) => {
      return {
        counter: state.counter + 1,
      };
    });

    store._setState((state) => {
      return {
        counter: state.counter + 1,
      };
    });

    expect(stateHistory.history).toEqual({
      past: [{ counter: 0 }, { counter: 1 }, { counter: 2 }, { counter: 3 }, { counter: 4 }],
      present: { counter: 5 },
      future: [],
    });

    stateHistory.jumpToPast(1);

    expect(stateHistory.history).toEqual({
      past: [{ counter: 0 }],
      present: { counter: 1 },
      future: [{ counter: 2 }, { counter: 3 }, { counter: 4 }, { counter: 5 }],
    });

    stateHistory.jumpToFuture(1);

    expect(stateHistory.history).toEqual({
      past: [{ counter: 0 }, { counter: 1 }, { counter: 2 }],
      present: { counter: 3 },
      future: [{ counter: 4 }, { counter: 5 }],
    });

    stateHistory.ignoreNext();

    store._setState((state) => {
      return {
        counter: state.counter + 1,
      };
    });

    expect(stateHistory.history).toEqual({
      past: [{ counter: 0 }, { counter: 1 }, { counter: 2 }],
      present: { counter: 3 },
      future: [{ counter: 4 }, { counter: 5 }],
    });

    store._setState((state) => {
      return {
        counter: state.counter + 1,
      };
    });

    expect(stateHistory.history).toEqual({
      past: [{ counter: 0 }, { counter: 1 }, { counter: 2 }, { counter: 4 }],
      present: { counter: 5 },
      future: [{ counter: 4 }, { counter: 5 }],
    });

    stateHistory.ignoreNext();

    expect(stateHistory.history).toEqual({
      past: [{ counter: 0 }, { counter: 1 }, { counter: 2 }, { counter: 4 }],
      present: { counter: 5 },
      future: [{ counter: 4 }, { counter: 5 }],
    });

    stateHistory.clear((history) => {
      return {
        past: history.past,
        present: history.present,
        future: [],
      };
    });

    expect(stateHistory.history).toEqual({
      past: [{ counter: 0 }, { counter: 1 }, { counter: 2 }, { counter: 4 }],
      present: { counter: 5 },
      future: [],
    });

    stateHistory.clear((history) => {
      return {
        past: [],
        present: history.present,
        future: history.future,
      };
    });

    expect(stateHistory.history).toEqual({
      past: [],
      present: { counter: 5 },
      future: [],
    });
  });
});

describe('StateHistory - Limit', () => {
  const store = new CounterStore();
  const query = new CounterQuery(store);
  const stateHistory2 = new StateHistoryPlugin(query, { maxAge: 1 });

  store._setState((state) => {
    return {
      counter: state.counter + 1,
    };
  });

  store._setState((state) => {
    return {
      counter: state.counter + 1,
    };
  });

  store._setState((state) => {
    return {
      counter: state.counter + 1,
    };
  });

  store._setState((state) => {
    return {
      counter: state.counter + 1,
    };
  });

  store._setState((state) => {
    return {
      counter: state.counter + 1,
    };
  });

  store._setState((state) => {
    return {
      counter: state.counter + 1,
    };
  });

  store._setState((state) => {
    return {
      counter: state.counter + 1,
    };
  });

  it('should match', () => {
    expect(stateHistory2.history).toEqual({ past: [{ counter: 6 }], present: { counter: 7 }, future: [] });
  });
});

describe('StateHistory - watchProperty', () => {
  type MyState = {
    yeap: { a?: number; b?: number };
    nope: Record<string, unknown>;
  };

  it('should watch only this property', () => {
    const store = new Store<MyState>({ yeap: {}, nope: {} }, { name: 'watchProperty' });
    const query = new Query<MyState>(store);
    const history = new StateHistoryPlugin(query, { watchProperty: 'yeap' });

    store.update({ nope: {} });
    expect(history.history).toEqual({ future: [], past: [], present: {} });
    store.update({ yeap: { a: 1, b: 1 } });
    expect(history.history).toEqual({ future: [], past: [{}], present: { a: 1, b: 1 } });
    store.update({ yeap: { a: 1, b: 2 }, nope: { what: 1 } });
    expect(history.history).toEqual({ future: [], past: [{}, { a: 1, b: 1 }], present: { a: 1, b: 2 } });
    history.undo();
    expect(history.history).toEqual({ future: [{ a: 1, b: 2 }], past: [{}], present: { a: 1, b: 1 } });
    history.redo();
    expect(history.history).toEqual({ future: [], past: [{}, { a: 1, b: 1 }], present: { a: 1, b: 2 } });
  });

  describe('should support nested props', () => {
    const store = new Store({ yeap: { a: 0, b: 1 }, nope: {} }, { name: 'watchProperty' });
    const query = new Query(store);
    const history = new StateHistoryPlugin(query, { watchProperty: 'yeap.a' });
    it('should watch only this property', () => {
      store.update({ nope: {} });
      expect(history.history).toEqual({ future: [], past: [], present: 0 });
      store.update({ yeap: { a: 1, b: 2 } });
      expect(history.history).toEqual({ future: [], past: [0], present: 1 });
      store.update({ yeap: { a: 2, b: 233 } });
      expect(history.history).toEqual({ future: [], past: [0, 1], present: 2 });
      history.undo();
      expect(history.history).toEqual({ future: [2], past: [0], present: 1 });
      history.redo();
      expect(history.history).toEqual({ future: [], past: [0, 1], present: 2 });
      history.clear();
      expect(history.history).toEqual({ future: [], past: [], present: null });
    });
  });
});

describe('StateHistory - Observability', () => {
  // Convenience for creating new store and history for each test
  function getStateHistory() {
    const store = new CounterStore();
    const query = new CounterQuery(store);
    const history = new StateHistoryPlugin(query);

    // Simple mutator function for convenience
    const makeChange = () => {
      store._setState((state) => {
        return {
          counter: state.counter + 1,
        };
      });
    };

    return {
      history,
      makeChange,
    };
  }

  // Just a convenience wraper for handling assertions on the observable stream
  function expectHistoryStatusEqual(status$: Observable<boolean>, expectedValues: boolean[], done: () => void) {
    const values: boolean[] = [];
    status$.subscribe((val) => {
      values.push(val);
      if (values.length === expectedValues.length) {
        expect(values).toEqual(expectedValues);
        done();
      }
    });
  }

  describe('hasPast$', () => {
    it('should initially be false', () => {
      return new Promise<void>((done) => {
        const { history } = getStateHistory();

        history.hasPast$.subscribe((val) => {
          expect(val).toEqual(false);
          done();
        });
      });
    });

    it('should update observable on update', () => {
      expect.assertions(1);

      return new Promise<void>((done) => {
        const { history, makeChange } = getStateHistory();

        const expectedValues: boolean[] = [
          false, // Initial
          true, // makeChange
          false, // undo
          true, // redo
        ];

        expectHistoryStatusEqual(history.hasPast$, expectedValues, done);

        makeChange();
        history.undo();
        history.redo();
      });
    });

    it('should only update on change', () => {
      expect.assertions(1);

      return new Promise<void>((done) => {
        const { history, makeChange } = getStateHistory();

        const expectedValues: boolean[] = [
          false, // initial
          true, // after first change
          false, // after both undo's
        ];

        expectHistoryStatusEqual(history.hasPast$, expectedValues, done);

        makeChange();
        makeChange();

        history.undo();
        history.undo();
      });
    });

    it('should work with ignoreNext', () => {
      expect.assertions(1);

      return new Promise<void>((done) => {
        const { history, makeChange } = getStateHistory();

        const expectedValues: boolean[] = [
          false, // initial
          true, // after first change
          false, // after undo
        ];

        expectHistoryStatusEqual(history.hasPast$, expectedValues, done);

        makeChange();
        history.undo();
        history.ignoreNext();
        makeChange();
      });
    });

    it('should work with clear', () => {
      expect.assertions(1);

      return new Promise<void>((done) => {
        const { history, makeChange } = getStateHistory();

        const expectedValues: boolean[] = [
          false, // initial
          true, // after first change
          false, // after clear
        ];

        expectHistoryStatusEqual(history.hasPast$, expectedValues, done);

        makeChange();
        history.clear();
      });
    });
  });

  describe('hasFuture$', () => {
    it('should initially be false', () => {
      return new Promise<void>((done) => {
        const { history } = getStateHistory();

        history.hasFuture$.subscribe((val) => {
          expect(val).toEqual(false);
          done();
        });
      });
    });

    it('should update observable on update', () => {
      expect.assertions(1);

      return new Promise<void>((done) => {
        const { history, makeChange } = getStateHistory();

        const expectedValues: boolean[] = [
          false, // Initial
          true, // undo
          false, // redo
        ];

        expectHistoryStatusEqual(history.hasFuture$, expectedValues, done);

        makeChange();
        history.undo();
        history.redo();
      });
    });

    it('should only update on change', () => {
      expect.assertions(1);

      return new Promise<void>((done) => {
        const { history, makeChange } = getStateHistory();

        const expectedValues: boolean[] = [
          false, // initial
          true, // after undo
        ];
        expectHistoryStatusEqual(history.hasFuture$, expectedValues, done);

        makeChange();
        makeChange();

        history.undo();
        history.undo();
      });
    });

    it('should work with ignoreNext', () => {
      expect.assertions(1);

      return new Promise<void>((done) => {
        const { history, makeChange } = getStateHistory();

        const expectedValues: boolean[] = [
          false, // initial
          true, // after undo
        ];

        expectHistoryStatusEqual(history.hasFuture$, expectedValues, done);

        makeChange();
        history.undo();
        history.ignoreNext();
        makeChange();
      });
    });

    it('should work with clear', () => {
      expect.assertions(1);

      return new Promise<void>((done) => {
        const { history, makeChange } = getStateHistory();

        const expectedValues: boolean[] = [
          false, // initial
          true, // after undo
          false, // after clear
        ];

        expectHistoryStatusEqual(history.hasFuture$, expectedValues, done);

        makeChange();
        history.undo();
        history.clear();
      });
    });
  });
});

type CollectionState = {
  collection: number[];
};

describe('StateHistory - array-like property', () => {
  const collectionStore = new Store<CollectionState>({ collection: [] });
  const collectionQuery = new Query<CollectionState>(collectionStore);
  const collectionHistory = new StateHistoryPlugin(collectionQuery, { watchProperty: 'collection' });

  it('should get the initial state', () => {
    expect(collectionHistory.history).toEqual({
      past: [],
      present: [],
      future: [],
    });

    expect(collectionHistory.hasPast).toBeFalsy();
    expect(collectionHistory.hasFuture).toBeFalsy();
  });

  it('should work properly with array-like property', () => {
    let expectedCollection = [1];

    collectionStore.update((state) => ({ collection: arrayAdd(state.collection, 1) }));

    expect(collectionHistory.history).toEqual({
      past: [[]],
      present: expectedCollection,
      future: [],
    });
    expect(collectionStore.getValue()).toEqual({ collection: expectedCollection });

    expectedCollection = [1, 2];
    collectionStore.update((state) => ({ collection: arrayAdd(state.collection, 2) }));

    expect(collectionHistory.history).toEqual({
      past: [[], [1]],
      present: expectedCollection,
      future: [],
    });
    expect(collectionStore.getValue()).toEqual({ collection: expectedCollection });

    expectedCollection = [1];
    collectionHistory.undo();

    expect(collectionHistory.history).toEqual({
      past: [[]],
      present: expectedCollection,
      future: [[1, 2]],
    });
    expect(collectionQuery.getValue()).toEqual({ collection: expectedCollection });

    expectedCollection = [1, 2];
    collectionHistory.redo();

    expect(collectionHistory.history).toEqual({
      past: [[], [1]],
      present: expectedCollection,
      future: [],
    });
    expect(collectionQuery.getValue()).toEqual({ collection: expectedCollection });
  });
});
