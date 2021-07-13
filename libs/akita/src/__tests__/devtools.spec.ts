import { logAction } from '../lib/actions';
import { capitalize } from '../lib/capitalize';
import { akitaDevtools } from '../lib/devtools';
import { Store } from '../lib/store';
import { applyTransaction } from '../lib/transaction';
import { TodosStore, DisabledTrackingConfigStore } from './setup';

function buildActionTypeString(store: Store<any>, type: string) {
  return `[${capitalize(store.storeName)}] - ${type}`;
}

describe('DevTools', () => {
  let store: TodosStore;
  let connectMock: {
    subscribe: jest.Mock;
    init: jest.Mock;
    send: jest.Mock<void, [string | { type: string }, any]>;
  };

  beforeAll(() => {
    // Mock Redux DevTools
    (window as any).__REDUX_DEVTOOLS_EXTENSION__ = {
      connect: jest.fn().mockReturnValueOnce(
        (connectMock = {
          subscribe: jest.fn(),
          init: jest.fn(),
          send: jest.fn(),
        })
      ),
    };

    // Enable DevTools
    akitaDevtools();
  });

  beforeEach(() => {
    store = new TodosStore();
  });

  it(`should log action: Store initialized`, () => {
    expect(connectMock.send.mock.calls.length).toBe(1);
    expect(connectMock.send.mock.calls[0][0]['type']).toBe(buildActionTypeString(store, `@@INIT`));
  });

  it(`should log action: Update store state`, () => {
    connectMock.send.mockReset();
    store.update({ metadata: { name: 'foo' } });

    expect(connectMock.send.mock.calls.length).toBe(1);
    expect(connectMock.send.mock.calls[0][0]['type']).toBe(buildActionTypeString(store, `Update`));
  });

  it(`should log action: Set Entities`, () => {
    connectMock.send.mockReset();
    store.set([{ id: 1 }, { id: 2 }]);

    expect(connectMock.send.mock.calls.length).toBe(1);
    expect(connectMock.send.mock.calls[0][0]['type']).toBe(buildActionTypeString(store, `Set Entity`));
  });

  it(`should log action: Add Entities`, () => {
    connectMock.send.mockReset();
    store.add([{ id: 1 }, { id: 2 }]);

    expect(connectMock.send.mock.calls[0][0]['type']).toBe(buildActionTypeString(store, `Add Entity`));
    expect(connectMock.send.mock.calls[0][1]['todos']['entities']).toEqual(
      expect.objectContaining({
        1: { id: 1 },
        2: { id: 2 },
      })
    );
  });

  it(`should log action: Remove Entities`, () => {
    store.add([{ id: 1 }, { id: 2 }]);
    connectMock.send.mockReset();
    store.remove([1, 2]);

    expect(connectMock.send.mock.calls.length).toBe(1);
    expect(connectMock.send.mock.calls[0][0]['type']).toEqual(expect.stringContaining(buildActionTypeString(store, `Remove Entity`)));
    expect(connectMock.send.mock.calls[0][1]['todos']['entities']).toEqual(
      expect.not.objectContaining({
        1: { id: 1 },
        2: { id: 2 },
      })
    );
  });

  it(`should log action: Update Entities`, () => {
    store.add([{ id: 1 }, { id: 2 }]);
    connectMock.send.mockReset();
    store.update(1, { title: 'title' });

    expect(connectMock.send.mock.calls.length).toBe(1);
    expect(connectMock.send.mock.calls[0][0]['type']).toEqual(expect.stringContaining(buildActionTypeString(store, `Update Entity`)));
    expect(connectMock.send.mock.calls[0][1]['todos']['entities']).toEqual(
      expect.objectContaining({
        1: { id: 1, title: 'title' },
        2: { id: 2 },
      })
    );
  });

  it(`should log action: Upsert Entities`, () => {
    connectMock.send.mockReset();
    store.upsert(1, { title: 'title' });

    expect(connectMock.send.mock.calls.length).toBe(1);
    expect(connectMock.send.mock.calls[0][0]['type']).toEqual(expect.stringContaining(buildActionTypeString(store, `Upsert Entity`)));
    expect(connectMock.send.mock.calls[0][1]['todos']['entities']).toEqual(
      expect.objectContaining({
        1: { id: 1, title: 'title' },
      })
    );
  });

  it(`should log action: Upsert Many Entities`, () => {
    store.add([{ id: 1 }]);
    connectMock.send.mockReset();
    store.upsertMany([
      { id: 1, title: 'title' },
      { id: 2, title: 'title' },
    ]);

    expect(connectMock.send.mock.calls.length).toBe(1);
    expect(connectMock.send.mock.calls[0][0]['type']).toEqual(expect.stringContaining(buildActionTypeString(store, `Upsert Many`)));
    expect(connectMock.send.mock.calls[0][1]['todos']['entities']).toEqual(
      expect.objectContaining({
        1: { id: 1, title: 'title' },
        2: { id: 2, title: 'title' },
      })
    );
  });

  it(`should log action in correct order`, () => {
    store.add([{ id: 1 }, { id: 2 }]);
    connectMock.send.mockReset();
    store.update(1, { title: 'title' });
    store.remove(2);

    expect(connectMock.send.mock.calls.length).toBe(2);

    expect(connectMock.send.mock.calls[0][0]['type']).toEqual(expect.stringContaining(buildActionTypeString(store, `Update Entity`)));
    expect(connectMock.send.mock.calls[0][1]['todos']['entities']).toEqual(
      expect.objectContaining({
        1: { id: 1, title: 'title' },
      })
    );

    expect(connectMock.send.mock.calls[1][0]['type']).toEqual(expect.stringContaining(buildActionTypeString(store, `Remove Entity`)));
    expect(connectMock.send.mock.calls[1][1]['todos']['entities']).toEqual(
      expect.not.objectContaining({
        1: { id: 2 },
      })
    );
  });

  it(`should only log action of a transaction`, () => {
    store.add([{ id: 1 }, { id: 2 }]);
    connectMock.send.mockReset();

    applyTransaction(() => {
      store.update(1, { title: 'title' });
      store.remove(2);
    });

    expect(connectMock.send.mock.calls.length).toBe(1);
    expect(connectMock.send.mock.calls[0][0]['type']).toEqual(expect.stringContaining(buildActionTypeString(store, `@Transaction`)));
  });

  it(`should only log custom action of a transaction`, () => {
    store.add([{ id: 1 }, { id: 2 }]);
    connectMock.send.mockReset();

    logAction('Custom Action');
    applyTransaction(() => {
      store.update(1, { title: 'title' });
      store.remove(2);
    });

    expect(connectMock.send.mock.calls.length).toBe(1);
    expect(connectMock.send.mock.calls[0][0]['type']).toEqual(expect.stringContaining(buildActionTypeString(store, `Custom Action`)));
  });

  it(`should only log outmost custom action of nested transactions`, () => {
    store.add([{ id: 1 }, { id: 2 }]);
    connectMock.send.mockReset();

    logAction('Custom Action');
    applyTransaction(() => {
      store.update(1, { title: 'title' });
      logAction('Custom Action 2');
      applyTransaction(() => {
        store.update(1, { title: 'title 2' });
        store.remove(2);
      });
      store.remove(1);
    });

    expect(connectMock.send.mock.calls.length).toBe(1);
    expect(connectMock.send.mock.calls[0][0]['type']).toEqual(expect.stringContaining(buildActionTypeString(store, `Custom Action`)));
  });

  it('should log only if disableTracking is not true', function () {
    connectMock.send.mockReset();
    const noTrackingStoreConfig = new DisabledTrackingConfigStore();
    const noTrackingStoreOptions = new Store({}, { disableTracking: true });

    noTrackingStoreConfig.setLoading();
    noTrackingStoreOptions.setLoading();

    expect(connectMock.send.mock.calls.length).toBe(0);
  });

  afterEach(() => {
    store.destroy();
    connectMock.send.mockReset();
  });
});
