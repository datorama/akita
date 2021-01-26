import { BehaviorSubject, Observable } from 'rxjs';
import { SortByOptions } from './queryConfig';
import { QueryEntity } from './queryEntity';

export interface HashMap<T> {
  [id: string]: T;
}

export interface EntityState<E = any, IDType = any> {
  entities?: HashMap<E>;
  ids?: IDType[];
  loading?: boolean;
  error?: any;
  [key: string]: any;
}

export interface Entities<E> {
  entities: HashMap<E>;
  ids: ID[];
}

export interface ActiveState<T = ID> {
  active: T | null;
}

export interface MultiActiveState<T = ID> {
  active: T[];
}

export interface SelectOptions<E> extends SortByOptions<E> {
  asObject?: boolean;
  filterBy?: ((entity: E, index?: number) => boolean) | ((entity: E, index?: number) => boolean)[] | undefined;
  limitTo?: number;
}

export type StateWithActive<State> = State & (ActiveState | MultiActiveState);
export type UpdateStateCallback<State, NewState extends Partial<State> = Partial<State>> = (state: State) => NewState | void;
export type UpsertStateCallback<State, NewState extends Partial<State> = Partial<State>> = (state: State | Record<string, unknown>) => NewState;
export type CreateStateCallback<State, NewState extends Partial<State>, IDType> = (id: IDType, newState: NewState) => State;
export type UpdateEntityPredicate<E> = (entity: E) => boolean;
export type ID = number | string;
export type IDS = ID | ID[];
export type PreAddEntity<Entity> = (entity: Entity) => Entity;
export type PreUpdateEntity<Entity> = (prevEntity: Entity, nextEntity: Entity) => Entity;

export type StoreCache = {
  active: BehaviorSubject<boolean>;
  ttl: number;
};
export type ArrayProperties<T> = { [K in keyof T]: T[K] extends any[] ? K : never }[keyof T];
export type ItemPredicate<Item = any> = (item: Item, index?: number) => boolean;
export type MaybeAsync<T = any> = Promise<T> | Observable<T> | T;
export type EntityUICreateFn<EntityUI = any, Entity = any> = EntityUI | ((entity: Entity) => EntityUI);
export type Constructor<T = any> = new (...args: any[]) => T;
export type OrArray<Type> = Type | Type[];
export type getEntityType<S> = S extends EntityState<infer I> ? I : never;
export type getIDType<S> = S extends EntityState<any, infer I> ? I : never;
export type getQueryEntityState<T extends QueryEntity<any>> = T extends QueryEntity<infer S> ? S : never;

export type ArrayFuncs = ((...a: any[]) => any)[];
export type ReturnTypes<T extends ArrayFuncs> = { [P in keyof T]: T[P] extends (...a: any[]) => infer R ? R : never };
export type Diff<T, U> = T extends U ? never : T;
