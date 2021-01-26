import { DEFAULT_ID_KEY, getInitialEntitiesState, setEntities } from '..';
import { BooksStore } from './booksStore';
import { createMockEntities, entitiesMapMock } from './mocks';

function preAddEntity(e) {
  return e;
}

describe('setEntities', () => {
  it('should support array of entities', () => {
    const data = createMockEntities();
    const entityState = getInitialEntitiesState();
    const newState = setEntities({ state: entityState, idKey: DEFAULT_ID_KEY, entities: data, preAddEntity });
    expect(newState.ids.length).toBe(2);
    expect(newState.entities).toEqual(entitiesMapMock);
  });

  it('should support ids and entities object', () => {
    const data = {
      entities: entitiesMapMock,
      ids: [1, 2],
    };
    const entityState = getInitialEntitiesState();
    const newState = setEntities({ state: entityState, entities: data, idKey: DEFAULT_ID_KEY, preAddEntity });
    expect(newState.ids.length).toBe(2);
    expect(newState.entities).toEqual(entitiesMapMock);
  });

  it('should support only entities', () => {
    const store = new BooksStore();
    const data = { 1: { id: 1, price: 10, title: 'a' }, 2: { id: 2, price: 10, title: 'b' } };
    store.set(data);
    expect(store._value().ids).toEqual([1, 2]);
    expect(store._value().entities).toEqual(data);
  });

  it('should do nothing if nil', () => {
    const store = new BooksStore();
    jest.spyOn(store, '_setState');
    store.set(null);
    expect(store._setState).not.toHaveBeenCalled();
  });
});

describe('setEntities with Active MoviesState', () => {
  it('should reset the active when not exist', () => {
    const data = createMockEntities();
    const entityState = { ...getInitialEntitiesState(), active: 5 };
    const newState = setEntities({ state: entityState, idKey: DEFAULT_ID_KEY, entities: data, preAddEntity });
    expect(newState.active).toBe(null);
  });

  it('should NOT reset active when exist', () => {
    const data = createMockEntities();
    const entityState = { entities: entitiesMapMock, active: 1 };
    const newState = setEntities({ state: entityState, idKey: DEFAULT_ID_KEY, entities: data, preAddEntity });
    expect(newState.active).toBe(1);
  });
});

describe('setEntities with Active Multi', () => {
  it('should reset the active to empty array when not exist', () => {
    const data = createMockEntities();
    const entityState = { ...getInitialEntitiesState(), active: [3, 4] };
    const newState = setEntities({ state: entityState, idKey: DEFAULT_ID_KEY, entities: data, preAddEntity });
    expect(newState.active).toEqual([]);
  });

  it('should NOT reset active when exist', () => {
    const data = createMockEntities();
    const ids = [1, 2];
    const entityState = { entities: entitiesMapMock, ids, active: ids };
    const newState = setEntities({ state: entityState, idKey: DEFAULT_ID_KEY, entities: data, preAddEntity });
    expect(newState.active).toBe(ids);
  });

  it('should remove active when NOT exist', () => {
    const data = createMockEntities(10, 12);
    const entityState = { entities: entitiesMapMock, ids: [1], active: [1, 2] };
    const newState = setEntities({ state: entityState, idKey: DEFAULT_ID_KEY, entities: data, preAddEntity });
    expect(newState.active).toEqual([]);
  });
});
