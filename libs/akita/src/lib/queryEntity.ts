import { Observable, of } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { distinctUntilArrayItemChanged } from './arrayFind';
import { coerceArray } from './coerceArray';
import { entitiesToArray } from './entitiesToArray';
import { entitiesToMap } from './entitiesToMap';
import { EntityAction, EntityActions } from './entityActions';
import { EntityStore } from './entityStore';
import { findEntityByPredicate, getEntity } from './getEntity';
import { isArray } from './isArray';
import { isDefined } from './isDefined';
import { isFunction } from './isFunction';
import { isNil } from './isNil';
import { mapSkipUndefined } from './mapSkipUndefined';
import { Query } from './query';
import { QueryConfigOptions } from './queryConfig';
import { SelectAllOptionsA, SelectAllOptionsB, SelectAllOptionsC, SelectAllOptionsD, SelectAllOptionsE } from './selectAllOverloads';
import { sortByOptions } from './sortByOptions';
import { toBoolean } from './toBoolean';
import { EntityState, getEntityType, getIDType, HashMap, ItemPredicate, OrArray, SelectOptions } from './types';

/**
 *  The Entity Query is similar to the general Query, with additional functionality tailored for EntityStores.
 *
 * @example
 *  class WidgetsQuery extends QueryEntity<WidgetsState> {
 *     constructor(protected store: WidgetsStore) {
 *       super(store);
 *     }
 *  }
 */
export class QueryEntity<S extends EntityState, EntityType = getEntityType<S>, IDType = getIDType<S>> extends Query<S> {
  ui: EntityUIQuery<any, EntityType>;

  protected store: EntityStore<S>;

  /** @internal */
  __store__;

  constructor(store: EntityStore<S>, private readonly options: QueryConfigOptions = {}) {
    super(store);
    this.__store__ = store;
  }

  /**
   * Select the entire store's entity collection
   *
   * @example
   *
   * this.query.selectAll()
   *
   * this.query.selectAll({
   *   limitTo: 5
   *   filterBy: entity => entity.completed === true
   * })
   *
   * this.query.selectAll({
   *   asObject: true,
   *   limitTo: 3
   * })
   *
   *  this.query.selectAll({
   *   sortBy: 'price',
   *   sortByOrder: Order.DESC
   * })
   */
  selectAll(options: SelectAllOptionsA<EntityType>): Observable<HashMap<EntityType>>;

  selectAll(options: SelectAllOptionsB<EntityType>): Observable<EntityType[]>;

  selectAll(options: SelectAllOptionsC<EntityType>): Observable<HashMap<EntityType>>;

  selectAll(options: SelectAllOptionsD<EntityType>): Observable<EntityType[]>;

  selectAll(options: SelectAllOptionsE<EntityType>): Observable<EntityType[]>;

  selectAll(): Observable<EntityType[]>;

  selectAll(
    options: SelectOptions<EntityType> = {
      asObject: false,
    }
  ): Observable<EntityType[] | HashMap<EntityType>> {
    return this.select((state) => state.entities).pipe(map(() => this.getAll(options)));
  }

  /**
   * Get the entire store's entity collection
   *
   * @example
   *
   * this.query.getAll()
   *
   * this.query.getAll({
   *   limitTo: 5
   *   filterBy: entity => entity.completed === true
   * })
   *
   * this.query.getAll({
   *   asObject: true,
   *   limitTo: 3
   * })
   *
   *  this.query.getAll({
   *   sortBy: 'price',
   *   sortByOrder: Order.DESC
   * })
   */
  getAll(options: SelectAllOptionsA<EntityType>): HashMap<EntityType>;

  getAll(options: SelectAllOptionsB<EntityType>): EntityType[];

  getAll(options: SelectAllOptionsC<EntityType>): HashMap<EntityType>;

  getAll(options: SelectAllOptionsD<EntityType>): EntityType[];

  getAll(options: SelectAllOptionsE<EntityType>): EntityType[];

  getAll(): EntityType[];

  getAll(options: SelectOptions<EntityType> = { asObject: false, filterBy: undefined, limitTo: undefined }): EntityType[] | HashMap<EntityType> {
    if (options.asObject) {
      return entitiesToMap(this.getValue(), options);
    }

    const sortOptions = sortByOptions(options, this.config || this.options);
    return entitiesToArray(this.getValue(), sortOptions);
  }

  /**
   * Select multiple entities from the store
   *
   * @example
   *
   * this.query.selectMany([1,2,3])
   * this.query.selectMany([1,2], entity => entity.title)
   */
  selectMany<R>(ids: IDType[]): Observable<EntityType[]>;

  selectMany<R>(ids: IDType[], project: (entity: EntityType) => R): Observable<R[]>;

  selectMany<R>(ids: IDType[], project?: (entity: EntityType) => R): Observable<EntityType[] | R[]> {
    if (!ids || !ids.length) return of([]);

    return this.select((state) => state.entities).pipe(
      map((entities) => mapSkipUndefined(ids, (id) => getEntity(id, project)(entities))),
      distinctUntilArrayItemChanged()
    );
  }

  /**
   * Select an entity or a slice of an entity
   *
   * @example
   *
   * this.query.selectEntity(1)
   * this.query.selectEntity(1, entity => entity.config.date)
   * this.query.selectEntity(1, 'comments')
   * this.query.selectEntity(e => e.title === 'title')
   *
   */
  selectEntity<R>(id: IDType): Observable<EntityType | undefined>;
  selectEntity<K extends keyof EntityType>(id: IDType, project?: K): Observable<EntityType[K] | undefined>;
  selectEntity<R>(id: IDType, project: (entity?: EntityType) => R): Observable<R>;
  selectEntity<R>(predicate: ItemPredicate<EntityType>): Observable<EntityType | undefined>;
  selectEntity<R>(idOrPredicate: IDType | ItemPredicate<EntityType>, project?: ((entity: EntityType) => R) | keyof EntityType): Observable<R | EntityType | undefined> {
    const id = isFunction(idOrPredicate)
      ? // For performance reason we expect the entity to be in the store
        findEntityByPredicate(idOrPredicate, this.getValue().entities)
      : idOrPredicate;

    return this.select((state) => state.entities).pipe(map(getEntity(id, project)), distinctUntilChanged());
  }

  /**
   * Get an entity by id
   *
   * @example
   *
   * this.query.getEntity(1);
   */
  getEntity(id: IDType): EntityType | undefined {
    return this.getValue().entities[id as any];
  }

  /**
   * Select the active entity's id
   *
   * @example
   *
   * this.query.selectActiveId()
   */
  selectActiveId(): Observable<S['active'] | undefined> {
    return this.select((state) => (state as S & { active: S['active'] }).active);
  }

  /**
   * Get the active id
   *
   * @example
   *
   * this.query.getActiveId()
   */
  getActiveId(): S['active'] | undefined {
    return this.getValue().active;
  }

  /**
   * Select the active entity
   *
   * @example
   *
   * this.query.selectActive()
   * this.query.selectActive(entity => entity.title)
   */
  selectActive<R>(): S['active'] extends any[] ? Observable<EntityType[]> : Observable<EntityType | undefined>;
  selectActive<R>(project?: (entity: EntityType) => R): S['active'] extends any[] ? Observable<R[]> : Observable<R | undefined>;
  selectActive<R>(project?: (entity: EntityType) => R): Observable<R | EntityType> | Observable<EntityType[] | R[] | undefined> {
    if (isArray(this.getActive())) {
      return this.selectActiveId().pipe(switchMap((ids) => this.selectMany(ids, project)));
    }
    return this.selectActiveId().pipe(switchMap((ids) => this.selectEntity(ids, project)));
  }

  /**
   * Get the active entity
   *
   * @example
   *
   * this.query.getActive()
   */
  getActive(): S['active'] extends any[] ? EntityType[] : EntityType | undefined;
  getActive(): OrArray<EntityType> | undefined {
    const activeId = this.getActiveId();
    if (isArray(activeId)) {
      return activeId.map((id) => this.getValue().entities[id]);
    }
    return toBoolean(activeId) ? this.getEntity(activeId) : undefined;
  }

  /**
   * Select the store's entity collection length
   *
   * @example
   *
   * this.query.selectCount()
   * this.query.selectCount(entity => entity.completed)
   */
  selectCount(predicate?: (entity: EntityType, index: number) => boolean): Observable<number> {
    return this.select((state) => state.entities).pipe(map(() => this.getCount(predicate)));
  }

  /**
   * Get the store's entity collection length
   *
   * @example
   *
   * this.query.getCount()
   * this.query.getCount(entity => entity.completed)
   */
  getCount(predicate?: (entity: EntityType, index: number) => boolean): number {
    if (isFunction(predicate)) {
      return this.getAll().filter(predicate).length;
    }
    return this.getValue().ids.length;
  }

  /**
   *
   * Select the last entity from the store
   *
   * @example
   *
   * this.query.selectLast()
   * this.query.selectLast(todo => todo.title)
   */
  selectLast<R>(): Observable<EntityType | undefined>;
  selectLast<R>(project: (entity?: EntityType) => R): Observable<R>;
  selectLast<R>(project?: (entity?: EntityType) => R): Observable<R | EntityType | undefined> {
    return this.selectAt((ids) => ids[ids.length - 1], project);
  }

  /**
   *
   * Select the first entity from the store
   *
   * @example
   *
   * this.query.selectFirst()
   * this.query.selectFirst(todo => todo.title)
   */
  selectFirst<R>(): Observable<EntityType | undefined>;
  selectFirst<R>(project: (entity?: EntityType) => R): Observable<R>;
  selectFirst<R>(project?: (entity?: EntityType) => R): Observable<R | EntityType | undefined> {
    return this.selectAt((ids) => ids[0], project);
  }

  /**
   *
   * Listen for entity actions
   *
   *  @example
   *  this.query.selectEntityAction(EntityActions.Add);
   *  this.query.selectEntityAction(EntityActions.Update);
   *  this.query.selectEntityAction(EntityActions.Remove);
   *
   *  this.query.selectEntityAction([EntityActions.Add, EntityActions.Update, EntityActions.Remove])
   *
   *  this.query.selectEntityAction();
   */
  selectEntityAction(action: EntityActions): Observable<IDType[]>;
  selectEntityAction(actions: EntityActions[]): Observable<EntityAction<IDType>>;
  selectEntityAction(): Observable<EntityAction<IDType>>;
  selectEntityAction(actionOrActions?: EntityActions | EntityActions[]): Observable<IDType[] | EntityAction<IDType>> {
    if (isNil(actionOrActions)) {
      return this.store.selectEntityAction$;
    }

    const project = isArray(actionOrActions) ? (action: EntityAction<IDType>) => action : ({ ids }: EntityAction<IDType>) => ids;
    const actions = coerceArray(actionOrActions);

    return this.store.selectEntityAction$.pipe(
      filter(({ type }: EntityAction<IDType>) => actions.includes(type)),
      map((action) => project(action))
    );
  }

  /**
   * Returns whether entity exists
   *
   * @example
   *
   * this.query.hasEntity(2)
   * this.query.hasEntity(entity => entity.completed)
   * this.query.hasEntity([1, 2, 33])
   *
   */
  hasEntity(id: IDType): boolean;

  hasEntity(id: IDType[]): boolean;

  hasEntity(project: (entity: EntityType) => boolean): boolean;

  hasEntity(): boolean;

  hasEntity(projectOrIds?: IDType | IDType[] | ((entity: EntityType) => boolean)): boolean {
    if (isNil(projectOrIds)) {
      return this.getValue().ids.length > 0;
    }

    if (isFunction(projectOrIds)) {
      return this.getAll().some(projectOrIds);
    }

    if (isArray(projectOrIds)) {
      return projectOrIds.every((id) => (id as any) in this.getValue().entities);
    }

    return (projectOrIds as any) in this.getValue().entities;
  }

  /**
   * Returns whether entity store has an active entity
   *
   * @example
   *
   * this.query.hasActive()
   * this.query.hasActive(3)
   *
   */
  hasActive(id?: IDType): boolean {
    const { active } = this.getValue();
    const isIdProvided = isDefined(id);
    if (Array.isArray(active)) {
      if (isIdProvided) {
        return active.includes(id);
      }
      return active.length > 0;
    }
    return isIdProvided ? active === id : isDefined(active);
  }

  /**
   *
   * Create sub UI query for querying Entity's UI state
   *
   * @example
   *
   *
   * export class ProductsQuery extends QueryEntity<ProductsState> {
   *   ui: EntityUIQuery<ProductsUIState>;
   *
   *   constructor(protected store: ProductsStore) {
   *     super(store);
   *     this.createUIQuery();
   *   }
   *
   * }
   */
  createUIQuery(): void {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    this.ui = new EntityUIQuery(this.__store__.ui);
  }

  private selectAt<R>(mapFn: (ids: IDType[]) => IDType, project?: (entity?: EntityType) => R): Observable<R> {
    return this.select((state) => state.ids).pipe(
      map(mapFn),
      distinctUntilChanged(),
      switchMap((id: IDType) => this.selectEntity(id, project))
    );
  }
}

/** @internal */
export class EntityUIQuery<UIState, DEPRECATED = any> extends QueryEntity<UIState> {}
