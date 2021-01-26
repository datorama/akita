import { EntityStore } from './entityStore';
import { AkitaError } from './errors';
import { isNil } from './isNil';
import { Store, __stores__ } from './store';
import { configKey } from './storeConfig';
import { Constructor } from './types';

export enum StoreAction {
  Update = 'UPDATE',
}

const StoreActionMapping = {
  [StoreAction.Update]: 'update',
};

export enum EntityStoreAction {
  Update = 'UPDATE',
  AddEntities = 'ADD_ENTITIES',
  SetEntities = 'SET_ENTITIES',
  UpdateEntities = 'UPDATE_ENTITIES',
  RemoveEntities = 'REMOVE_ENTITIES',
  UpsertEntities = 'UPSERT_ENTITIES',
  UpsertManyEntities = 'UPSERT_MANY_ENTITIES',
}

const EntityStoreActionMapping = {
  [EntityStoreAction.Update]: 'update',
  [EntityStoreAction.AddEntities]: 'add',
  [EntityStoreAction.SetEntities]: 'set',
  [EntityStoreAction.UpdateEntities]: 'update',
  [EntityStoreAction.RemoveEntities]: 'remove',
  [EntityStoreAction.UpsertEntities]: 'upsert',
  [EntityStoreAction.UpsertManyEntities]: 'upsertMany',
};

/**
 * Get a {@link Store} from the global store registry.
 * @param storeClass The {@link Store} class of the instance to be returned.
 */
export function getStore<TStore extends Store<S>, S = TStore extends Store<infer T> ? T : never>(storeClass: Constructor<TStore>): TStore {
  return getStoreByName<TStore, S>(storeClass[configKey]['storeName']);
}

/**
 * Get a {@link Store} from the global store registry.
 * @param storeName The {@link Store} name of the instance to be returned.
 */
export function getStoreByName<TStore extends Store<S>, S = TStore extends Store<infer T> ? T : never>(storeName: string): TStore {
  const store = __stores__[storeName] as TStore;

  if (isNil(store)) {
    throw new AkitaError(`${storeName} doesn't exist`);
  }

  return store;
}

/**
 * Get a {@link EntityStore} from the global store registry.
 * @param storeClass The {@link EntityStore} class of the instance to be returned.
 */
export function getEntityStore<TEntityStore extends EntityStore<S>, S = TEntityStore extends EntityStore<infer T> ? T : never>(storeClass: Constructor<TEntityStore>): TEntityStore {
  return getStore(storeClass as Constructor<Store<S>>) as TEntityStore;
}

/**
 * Get a {@link EntityStore} from the global store registry.
 * @param storeName The {@link EntityStore} name of the instance to be returned.
 */
export function getEntityStoreByName<TEntityStore extends EntityStore<S>, S = TEntityStore extends EntityStore<infer T> ? T : never>(storeName: string): TEntityStore {
  return getStoreByName<TEntityStore, S>(storeName);
}

/**
 * Run {@link StoreAction.Update} action.
 * @param storeClassOrName The {@link Store} class or name in which the action should be executed.
 * @param action The {@link StoreAction.Update} action, see {@link Store.update}.
 * @param operation The operation to execute the {@link StoreAction.Update} action.
 * @example
 *
 *  runStoreAction(BooksStore, StoreAction.Update, update => update({ filter: 'COMPLETE' }));
 *
 */
export function runStoreAction<TStore extends Store<S>, S = TStore extends Store<infer T> ? T : any>(
  storeClassOrName: Constructor<TStore> | string,
  action: StoreAction.Update,
  operation: (operator: TStore['update']) => void
);
export function runStoreAction<TStore extends Store<S>, S = TStore extends Store<infer T> ? T : any>(
  storeClassOrName: Constructor<TStore> | string,
  action: StoreAction,
  // eslint-disable-next-line @typescript-eslint/ban-types
  operation: (operator: TStore[keyof TStore] & Function) => void
) {
  const store = typeof storeClassOrName === 'string' ? getStoreByName<TStore, S>(storeClassOrName) : getStore<TStore, S>(storeClassOrName);
  operation(store[StoreActionMapping[action]].bind(store));
}

/**
 * Run {@link EntityStoreAction.SetEntities} action.
 * @param storeClassOrName The {@link EntityStore} class or name in which the action should be executed.
 * @param action The {@link EntityStoreAction.SetEntities} action, see {@link EntityStore.set}.
 * @param operation The operation to execute the {@link EntityStoreAction.SetEntities} action.
 * @example
 *
 *  runEntityStoreAction(BooksStore, EntityStoreAction.SetEntities, set => set([{ id: 1 }, { id: 2 }]));
 *
 */
export function runEntityStoreAction<TEntityStore extends EntityStore<S>, S = TEntityStore extends EntityStore<infer T> ? T : any>(
  storeClassOrName: Constructor<TEntityStore> | string,
  action: EntityStoreAction.SetEntities,
  operation: (operator: TEntityStore['set']) => void
);
/**
 * Run {@link EntityStoreAction.AddEntities} action.
 * @param storeClassOrName The {@link EntityStore} class or name in which the action should be executed.
 * @param action The {@link EntityStoreAction.AddEntities} action, see {@link EntityStore.add}.
 * @param operation The operation to execute the {@link EntityStoreAction.AddEntities} action.
 * @example
 *
 *  runEntityStoreAction(BooksStore, EntityStoreAction.AddEntities, add => add({ id: 1 }));
 *
 */
export function runEntityStoreAction<TEntityStore extends EntityStore<S>, S = TEntityStore extends EntityStore<infer T> ? T : any>(
  storeClassOrName: Constructor<TEntityStore> | string,
  action: EntityStoreAction.AddEntities,
  operation: (operator: TEntityStore['add']) => void
);
/**
 * Run {@link EntityStoreAction.UpdateEntities} action.
 * @param storeClassOrName The {@link EntityStore} class or name in which the action should be executed.
 * @param action The {@link EntityStoreAction.UpdateEntities} action, see {@link EntityStore.update}.
 * @param operation The operation to execute the {@link EntityStoreAction.UpdateEntities} action.
 * @example
 *
 *  runEntityStoreAction(BooksStore, EntityStoreAction.UpdateEntities, update => update(2, { title: 'New title' }));
 *
 */
export function runEntityStoreAction<TEntityStore extends EntityStore<S>, S = TEntityStore extends EntityStore<infer T> ? T : any>(
  storeClassOrName: Constructor<TEntityStore> | string,
  action: EntityStoreAction.UpdateEntities,
  operation: (operator: TEntityStore['update']) => void
);
/**
 * Run {@link EntityStoreAction.RemoveEntities} action.
 * @param storeClassOrName The {@link EntityStore} class or name in which the action should be executed.
 * @param action The {@link EntityStoreAction.RemoveEntities} action, see {@link EntityStore.remove}.
 * @param operation The operation to execute the {@link EntityStoreAction.RemoveEntities} action.
 * @example
 *
 *  runEntityStoreAction(BooksStore, EntityStoreAction.RemoveEntities, remove => remove(2));
 *
 */
export function runEntityStoreAction<TEntityStore extends EntityStore<S>, S = TEntityStore extends EntityStore<infer T> ? T : any>(
  storeClassOrName: Constructor<TEntityStore> | string,
  action: EntityStoreAction.RemoveEntities,
  operation: (operator: TEntityStore['remove']) => void
);
/**
 * Run {@link EntityStoreAction.UpsertEntities} action.
 * @param storeClassOrName The {@link EntityStore} class or name in which the action should be executed.
 * @param action The {@link EntityStoreAction.UpsertEntities} action, see {@link EntityStore.upsert}.
 * @param operation The operation to execute the {@link EntityStoreAction.UpsertEntities} action.
 * @example
 *
 *  runEntityStoreAction(BooksStore, EntityStoreAction.UpsertEntities, upsert => upsert([2, 3], { title: 'New Title' }, (id, newState) => ({ id, ...newState, price: 0 })));
 *
 */
export function runEntityStoreAction<TEntityStore extends EntityStore<S>, S = TEntityStore extends EntityStore<infer T> ? T : any>(
  storeClassOrName: Constructor<TEntityStore> | string,
  action: EntityStoreAction.UpsertEntities,
  operation: (operator: TEntityStore['upsert']) => void
);
/**
 * Run {@link EntityStoreAction.UpsertManyEntities} action.
 * @param storeClassOrName The {@link EntityStore} class or name in which the action should be executed.
 * @param action The {@link EntityStoreAction.UpsertManyEntities} action, see {@link EntityStore.upsertMany}.
 * @param operation The operation to execute the {@link EntityStoreAction.UpsertManyEntities} action.
 * @example
 *
 *  runEntityStoreAction(BooksStore, EntityStoreAction.UpsertManyEntities, upsertMany => upsertMany([
 *    { id: 2, title: 'New title', price: 0 },
 *    { id: 4, title: 'Another title', price: 0 },
 *  ));
 */
export function runEntityStoreAction<TEntityStore extends EntityStore<S>, S = TEntityStore extends EntityStore<infer T> ? T : any>(
  storeClassOrName: Constructor<TEntityStore> | string,
  action: EntityStoreAction.UpsertManyEntities,
  operation: (operator: TEntityStore['upsertMany']) => void
);
export function runEntityStoreAction<TEntityStore extends EntityStore<S>, S = TEntityStore extends EntityStore<infer T> ? T : any>(
  storeClassOrName: Constructor<TEntityStore> | string,
  action: EntityStoreAction,
  // eslint-disable-next-line @typescript-eslint/ban-types
  operation: (operator: TEntityStore[keyof TEntityStore] & Function) => void
) {
  const store = typeof storeClassOrName === 'string' ? getEntityStoreByName<TEntityStore, S>(storeClassOrName) : getEntityStore<TEntityStore, S>(storeClassOrName);
  operation(store[EntityStoreActionMapping[action]].bind(store));
}
