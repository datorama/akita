import { EntityStore } from './entityStore';
import { Query } from './query';
import { QueryConfigOptions } from './queryConfig';
import { QueryEntity } from './queryEntity';
import { Store } from './store';
import { StoreConfigOptions } from './storeConfig';
import { EntityState, getEntityType, getIDType } from './types';

export function createStore<State>(initialState: Partial<State>, options: Partial<StoreConfigOptions>): Store<State> {
  return new Store<State>(initialState, options);
}

export function createQuery<State>(store: Store<State>): Query<State> {
  return new Query<State>(store);
}

export function createEntityStore<State extends EntityState>(initialState: Partial<State>, options: Partial<StoreConfigOptions>): EntityStore<State, getEntityType<State>, getIDType<State>> {
  return new EntityStore<State>(initialState, options);
}

export function createEntityQuery<State extends EntityState>(store: EntityStore<State>, options: QueryConfigOptions = {}): QueryEntity<State> {
  return new QueryEntity<State>(store, options);
}
