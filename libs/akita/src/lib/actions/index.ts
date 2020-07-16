import { Observable, OperatorFunction } from 'rxjs';
import { filter } from 'rxjs/operators';
import { coerceArray } from '../coerceArray';
import { EntityStore } from '../entityStore';
import { Store } from '../store';

type StateOf<TStore extends Store> = TStore['__STATE__'];
type EntityOf<TStore extends EntityStore> = TStore['__ENTITY__'];
type EntityIdOf<TStore extends EntityStore> = TStore['__ENTITY_ID_TYPE__'];

const store = <TStore extends Store>() => (undefined as unknown) as TStore;
const action = <TActionType extends string, TActionArgs extends any[]>(type: TActionType, ...args: TActionArgs) => ({ type, args });

// export const typeOf = (...factory: CommitFactory[]) => {
//   return (source: Observable<{ action: Action, state: any }>) => source.pipe(filter(({ action: { type } }) => factory.some(fac => fac.type === type)));
// }

type ResultType<T> = T extends (...args: any[]) => infer R ? R : never;

export const typeOf = <TStore extends Store, TFactory extends CommitFactory<string, TStore>>(
  factory: TFactory
): OperatorFunction<Committed<TStore>, Committed<TStore, ResultType<TFactory>['action']>> => {
  return ((source: Observable<Committed<TStore>>) => source.pipe(filter(({ action: { type } }) => factory.type === type))) as any; //{ action: ResultType<TFactory>['action'], state: TStore['__STATE__']}>;
};

export interface Action<TActionType extends string = string, TActionArgs extends any[] = any[]> {
  type: TActionType;
  args: TActionArgs;
}

export interface Commit<TStore extends Store, TAction extends Action = Action, TReduce extends Reduce<TStore, TAction> = Reduce<TStore, TAction>> {
  __STORE__: TStore;
  action: TAction;
  reduce?: TReduce;
}

export interface Committed<TStore extends Store, TAction extends Action = Action> {
  __STORE__: TStore;
  action: TAction;
  state: TStore['__STATE__'];
}

export interface CommitFactory<TActionType extends string = string, TStore extends Store = Store> {
  (...args: any[]): Commit<TStore>;
  type: TActionType;
}

export interface Reduce<TStore extends Store, TAction extends Action> {
  (action: TAction, state: StateOf<TStore>, store: TStore): StateOf<TStore>;
}

function createCommit<TStore extends Store, TAction extends Action, TReduce extends Reduce<TStore, TAction>>(__STORE__: TStore, action: TAction, reduce?: TReduce): Commit<TStore, TAction, TReduce> {
  return { action, reduce, __STORE__ };
}

function createCommitFactory<TActionType extends string, TFactory extends Function & ((...args: any[]) => Commit<any>)>(type: TActionType, init: (type: TActionType) => TFactory) {
  const factory = init(type);
  factory['type'] = type;
  return factory as typeof factory & { type: TActionType };
}

/**
 *
 * @param state
 */
export const update = createCommitFactory('update', (type) => <TStore extends Store>(state: Partial<StateOf<TStore>>) =>
  createCommit(store<TStore>(), action(type, state), ({ type, args: [newState] }, oldState: StateOf<TStore>, store) => {
    return { ...oldState, ...newState };
  })
);

/**
 *
 * @param entity
 */
export const insertOne = createCommitFactory('insertOne', (type) => <TStore extends EntityStore>(entity: EntityOf<TStore>) =>
  createCommit(store<TStore>(), action(type, entity), ({ type, args: [entity] }, oldState: StateOf<TStore>, store) => {
    const entityId = entity[store.idKey] as EntityIdOf<TStore>;
    const entityIds = coerceArray(oldState.ids);

    if (entityIds.includes(entityId)) {
      return oldState;
    }

    return {
      ...oldState,
      ids: [...entityIds, entityId],
      entities: {
        ...oldState.entities,
        [entityId]: entity,
      },
    };
  })
);
