import { Subject } from 'rxjs';
import { logAction, setAction } from './actions';
import { addEntities, AddEntitiesOptions } from './addEntities';
import { coerceArray } from './coerceArray';
import { DEFAULT_ID_KEY } from './defaultIDKey';
import { EntityAction, EntityActions } from './entityActions';
import { isDev } from './env';
import { getActiveEntities, SetActiveOptions } from './getActiveEntities';
import { getInitialEntitiesState } from './getInitialEntitiesState';
import { hasEntity } from './hasEntity';
import { isDefined } from './isDefined';
import { isEmpty } from './isEmpty';
import { isFunction } from './isFunction';
import { isNil } from './isNil';
import { isUndefined } from './isUndefined';
import { removeEntities } from './removeEntities';
import { SetEntities, setEntities } from './setEntities';
import { Store } from './store';
import { StoreConfigOptions } from './storeConfig';
import { transaction } from './transaction';
import {
  Constructor,
  CreateStateCallback,
  EntityState,
  EntityUICreateFn,
  getEntityType,
  getIDType,
  IDS,
  OrArray,
  StateWithActive,
  UpdateEntityPredicate,
  UpdateStateCallback,
  UpsertStateCallback,
} from './types';
import { updateEntities } from './updateEntities';

/**
 *
 * Store for managing a collection of entities
 *
 * @example
 *
 * export interface WidgetsState extends EntityState<Widget> { }
 *
 * @StoreConfig({ name: 'widgets' })
 *  export class WidgetsStore extends EntityStore<WidgetsState> {
 *   constructor() {
 *     super();
 *   }
 * }
 *
 *
 */
export class EntityStore<S extends EntityState = any, EntityType = getEntityType<S>, IDType = getIDType<S>> extends Store<S> {
  ui: EntityUIStore<any, EntityType>;
  private entityActions = new Subject<EntityAction<IDType>>();
  private entityIdChanges = new Subject<{ newId: IDType; oldId: IDType; pending: boolean }>();

  constructor(initialState: Partial<S> = {}, protected options: Partial<StoreConfigOptions> = {}) {
    super({ ...getInitialEntitiesState(), ...initialState }, options);
  }

  // @internal
  get selectEntityAction$() {
    return this.entityActions.asObservable();
  }

  // @internal
  get selectEntityIdChanges$() {
    return this.entityIdChanges.asObservable();
  }

  // @internal
  get idKey() {
    return (this.config as StoreConfigOptions).idKey || this.options.idKey || DEFAULT_ID_KEY;
  }

  /**
   *
   * Replace current collection with provided collection
   *
   * @example
   *
   * this.store.set([Entity, Entity])
   * this.store.set({ids: [], entities: {}})
   * this.store.set({ 1: {}, 2: {}})
   *
   */
  set(entities: SetEntities<EntityType>, options: { activeId?: IDType | null } = {}) {
    if (isNil(entities)) return;

    isDev() && setAction('Set Entity');

    const isNativePreAdd = this.akitaPreAddEntity === EntityStore.prototype.akitaPreAddEntity;
    this.setHasCache(true, { restartTTL: true });

    this._setState((state) => {
      const newState = setEntities({
        state,
        entities,
        idKey: this.idKey,
        preAddEntity: this.akitaPreAddEntity,
        isNativePreAdd,
      });

      if (isUndefined(options.activeId) === false) {
        (newState as any).active = options.activeId;
      }

      return newState;
    });

    if (this.hasInitialUIState()) {
      this.handleUICreation();
    }

    this.entityActions.next({ type: EntityActions.Set, ids: this.ids });
  }

  /**
   * Add entities
   *
   * @example
   *
   * this.store.add([Entity, Entity])
   * this.store.add(Entity)
   * this.store.add(Entity, { prepend: true })
   *
   * this.store.add(Entity, { loading: false })
   */
  add(entities: OrArray<EntityType>, options: AddEntitiesOptions = { loading: false }) {
    const collection = coerceArray(entities);

    if (isEmpty(collection)) return;

    const data = addEntities({
      state: this._value(),
      preAddEntity: this.akitaPreAddEntity,
      entities: collection,
      idKey: this.idKey,
      options,
    });

    if (data) {
      isDev() && setAction('Add Entity');
      data.newState.loading = options.loading;

      this._setState(() => data.newState);

      if (this.hasInitialUIState()) {
        this.handleUICreation(true);
      }

      this.entityActions.next({ type: EntityActions.Add, ids: data.newIds });
    }
  }

  /**
   *
   * Update entities
   *
   * @example
   *
   * store.update(1, entity => ...)
   * store.update([1, 2, 3], entity => ...)
   * store.update(null, entity => ...)
   */
  update(id: OrArray<IDType> | null, newStateFn: UpdateStateCallback<EntityType>);
  /**
   * store.update(1, { name: newName })
   */
  update(id: OrArray<IDType> | null, newState: Partial<EntityType>);
  /**
   * store.update(entity => entity.price > 3, entity => ({ name: newName }))
   */
  update(predicate: UpdateEntityPredicate<EntityType>, newStateFn: UpdateStateCallback<EntityType>);
  /**
   * store.update(entity => entity.price > 3, { name: newName })
   */
  update(predicate: UpdateEntityPredicate<EntityType>, newState: Partial<EntityType>);
  /** Support non-entity updates */
  update(newState: UpdateStateCallback<S>);
  update(newState: Partial<S>);
  update(
    idsOrFnOrState: OrArray<IDType> | null | Partial<S> | UpdateStateCallback<S> | UpdateEntityPredicate<EntityType>,
    newStateOrFn?: UpdateStateCallback<EntityType> | Partial<EntityType> | Partial<S>
  ) {
    if (isUndefined(newStateOrFn)) {
      super.update(idsOrFnOrState as Partial<S>);
      return;
    }
    let ids: IDType[] = [];

    if (isFunction(idsOrFnOrState)) {
      // We need to filter according the predicate function
      ids = this.ids.filter((id) => (idsOrFnOrState as UpdateEntityPredicate<EntityType>)(this.entities[id]));
    } else {
      // If it's nil we want all of them
      ids = isNil(idsOrFnOrState) ? this.ids : coerceArray(idsOrFnOrState as OrArray<IDType>);
    }

    if (isEmpty(ids)) return;

    isDev() && setAction('Update Entity', ids);

    let entityIdChanged:
      | undefined
      | {
          newId: IDType;
          oldId: IDType;
        };

    this._setState((state) =>
      updateEntities({
        idKey: this.idKey,
        ids,
        preUpdateEntity: this.akitaPreUpdateEntity,
        state,
        newStateOrFn,
        producerFn: this._producerFn,
        onEntityIdChanges: (oldId: IDType, newId: IDType) => {
          entityIdChanged = { oldId, newId };
          this.entityIdChanges.next({ ...entityIdChanged, pending: true });
        },
      })
    );

    if (entityIdChanged) {
      this.entityIdChanges.next({ ...entityIdChanged, pending: false });
    }

    this.entityActions.next({ type: EntityActions.Update, ids });
  }

  /**
   *
   * Create or update.
   *
   * Warning: By omitting the initializing callback parameter onCreate(), the type safety of entities cannot be guaranteed.
   *
   * @example
   *
   * store.upsert(1, { active: true });
   * store.upsert([2, 3], { active: true });
   * store.upsert([2, 3], entity => ({ isOpen: !(entity?.isOpen ?? true) }))
   *
   */
  upsert<NewEntityType extends Partial<EntityType>>(ids: OrArray<IDType>, newState: UpsertStateCallback<EntityType, NewEntityType> | NewEntityType, options?: { baseClass?: Constructor }): void;
  /**
   *
   * Create or update
   *
   * @example
   *
   * store.upsert(1, { active: true }, (id, newState) => ({ id, ...newState, enabled: true }));
   * store.upsert([2, 3], { active: true }, (id, newState) => ({ id, ...newState, enabled: true }));
   * store.upsert([2, 3], entity => ({ isOpen: !(entity?.isOpen ?? true) }), (id, newState) => ({ id, ...newState, enabled: true }));
   *
   */
  upsert<NewEntityType extends Partial<EntityType>>(
    ids: OrArray<IDType>,
    newState: UpsertStateCallback<EntityType, NewEntityType> | NewEntityType,
    onCreate: CreateStateCallback<EntityType, NewEntityType, IDType>,
    options?: { baseClass?: Constructor; prepend?: boolean }
  ): void;
  @transaction()
  upsert<NewEntityType extends Partial<EntityType>>(
    ids: OrArray<IDType>,
    newState: UpsertStateCallback<EntityType, NewEntityType> | NewEntityType,
    onCreate?: CreateStateCallback<EntityType, NewEntityType, IDType> | { baseClass?: Constructor },
    options: { baseClass?: Constructor; prepend?: boolean } = {}
  ) {
    const toArray = coerceArray(ids);
    const predicate = (isUpdate) => (id) => hasEntity(this.entities, id) === isUpdate;
    const baseClass = isFunction(onCreate) ? options.baseClass : onCreate ? onCreate.baseClass : undefined;
    const isClassBased = isFunction(baseClass);

    const updateIds = toArray.filter(predicate(true));
    const newEntities = toArray.filter(predicate(false)).map((id) => {
      const newStateObj = typeof newState === 'function' ? newState({}) : newState;
      const entity = isFunction(onCreate) ? onCreate(id, newStateObj) : newStateObj;
      const withId = { ...entity, [this.idKey]: id };
      if (isClassBased) {
        return new baseClass(withId);
      }
      return withId;
    });

    if (options.prepend && updateIds.length) {
      let arr = this.ids;
      arr = arr.filter((elem) => elem !== ids);
      arr = [ids, ...arr];
      this._setState((state) => ({
        ...state,
        ids: arr,
      }));

      // let entityIdChanged:
      //   | undefined
      //   | {
      //   newId: IDType;
      //   oldId: IDType;
      // };
      // this._setState((state) =>
      //   updateEntities({
      //     idKey: this.idKey,
      //     // this.ids,
      //     preUpdateEntity: this.akitaPreUpdateEntity,
      //     state,
      //     producerFn: this._producerFn,
      //     onEntityIdChanges: (oldId: IDType, newId: IDType) => {
      //       entityIdChanged = { oldId, newId };
      //       this.entityIdChanges.next({ ...entityIdChanged, pending: true });
      //     },
      //   })
      // );
    } else {
      this.update(updateIds, newState as UpdateStateCallback<EntityType, NewEntityType>);
      this.add(newEntities, { prepend: options.prepend });
    }

    // it can be any of the three types
    isDev() && logAction('Upsert Entity');
  }

  /**
   *
   * Upsert entity collection (idKey must be present)
   *
   * @example
   *
   * store.upsertMany([ { id: 1 }, { id: 2 }]);
   *
   * store.upsertMany([ { id: 1 }, { id: 2 }], { loading: true  });
   * store.upsertMany([ { id: 1 }, { id: 2 }], { baseClass: Todo  });
   *
   */
  upsertMany(entities: EntityType[], options: { baseClass?: Constructor; loading?: boolean; prepend?: boolean } = {}) {
    const addedIds = [];
    const updatedIds = [];
    const updatedEntities = {};

    // Update the state directly to optimize performance
    for (const entity of entities) {
      const withPreCheckHook = this.akitaPreCheckEntity(entity);
      const id = withPreCheckHook[this.idKey];
      if (hasEntity(this.entities, id)) {
        const prev = this._value().entities[id];
        const merged = { ...this._value().entities[id], ...withPreCheckHook };
        const next = options.baseClass ? new options.baseClass(merged) : merged;
        const withHook = this.akitaPreUpdateEntity(prev, next);
        const nextId = withHook[this.idKey];
        updatedEntities[nextId] = withHook;
        updatedIds.push(nextId);
      } else {
        const newEntity = options.baseClass ? new options.baseClass(withPreCheckHook) : withPreCheckHook;
        const withHook = this.akitaPreAddEntity(newEntity);
        const nextId = withHook[this.idKey];
        addedIds.push(nextId);
        updatedEntities[nextId] = withHook;
      }
    }

    isDev() && logAction('Upsert Many');

    this._setState((state) => ({
      ...state,
      ids: options.prepend ? (addedIds.length ? [...addedIds, ...state.ids] : state.ids) : addedIds.length ? [...state.ids, ...addedIds] : state.ids,
      entities: options.prepend
        ? {
            ...updatedEntities,
            ...state.entities,
          }
        : {
            ...state.entities,
            ...updatedEntities,
          },
      loading: !!options.loading,
    }));

    updatedIds.length && this.entityActions.next({ type: EntityActions.Update, ids: updatedIds });
    addedIds.length && this.entityActions.next({ type: EntityActions.Add, ids: addedIds });
    if (addedIds.length && this.hasUIStore()) {
      this.handleUICreation(true);
    }
  }

  /**
   *
   * Replace one or more entities (except the id property)
   *
   *
   * @example
   *
   * this.store.replace(5, newEntity)
   * this.store.replace([1,2,3], newEntity)
   */
  replace(ids: IDS, newState: Partial<EntityType>) {
    const toArray = coerceArray(ids);
    if (isEmpty(toArray)) return;
    const replaced = {};
    for (const id of toArray) {
      replaced[id] = { ...newState, [this.idKey]: id };
    }
    isDev() && setAction('Replace Entity', ids);
    this._setState((state) => ({
      ...state,
      entities: {
        ...state.entities,
        ...replaced,
      },
    }));
  }

  /**
   *
   * Move entity inside the collection
   *
   *
   * @example
   *
   * this.store.move(fromIndex, toIndex)
   */
  move(from: number, to: number) {
    const ids = this.ids.slice();
    ids.splice(to < 0 ? ids.length + to : to, 0, ids.splice(from, 1)[0]);

    isDev() && setAction('Move Entity');
    this._setState((state) => ({
      ...state,
      // Change the entities reference so that selectAll emit
      entities: {
        ...state.entities,
      },
      ids,
    }));
  }

  /**
   *
   * Remove one or more entities
   *
   * @example
   *
   * this.store.remove(5)
   * this.store.remove([1,2,3])
   * this.store.remove()
   */
  remove(id?: OrArray<IDType>);
  /**
   * this.store.remove(entity => entity.id === 1)
   */
  remove(predicate: (entity: Readonly<EntityType>) => boolean);
  remove(idsOrFn?: OrArray<IDType> | ((entity: Readonly<EntityType>) => boolean)) {
    if (isEmpty(this.ids)) return;

    const idPassed = isDefined(idsOrFn);

    // null means remove all
    let ids: IDType[] | null = [];

    if (isFunction(idsOrFn)) {
      ids = this.ids.filter((entityId) => idsOrFn(this.entities[entityId]));
    } else {
      ids = idPassed ? coerceArray(idsOrFn) : this.ids;
    }

    if (isEmpty(ids)) return;

    isDev() && setAction('Remove Entity', ids);
    this._setState((state: StateWithActive<S>) => removeEntities({ state, ids }));

    if (!idPassed) {
      this.setHasCache(false);
    }

    this.handleUIRemove(ids);
    this.entityActions.next({ type: EntityActions.Remove, ids });
  }

  /**
   *
   * Update the active entity
   *
   * @example
   *
   * this.store.updateActive({ completed: true })
   * this.store.updateActive(active => {
   *   return {
   *     config: {
   *      ..active.config,
   *      date
   *     }
   *   }
   * })
   */
  updateActive(newStateOrCallback: UpdateStateCallback<EntityType> | Partial<EntityType>) {
    const ids = coerceArray(this.active);
    isDev() && setAction('Update Active', ids);
    this.update(ids, newStateOrCallback as Partial<EntityType>);
  }

  /**
   * Set the given entity as active
   *
   * @example
   *
   * store.setActive(1)
   * store.setActive([1, 2, 3])
   */
  setActive(idOrOptions: S['active'] extends any[] ? S['active'] : SetActiveOptions | S['active']);
  setActive(idOrOptions: IDType | SetActiveOptions | null) {
    const active = getActiveEntities(idOrOptions, this.ids, this.active);

    if (active === undefined) {
      return;
    }

    isDev() && setAction('Set Active', active);
    this._setActive(active);
  }

  /**
   * Add active entities
   *
   * @example
   *
   * store.addActive(2);
   * store.addActive([3, 4, 5]);
   */
  addActive<T = OrArray<IDType>>(ids: T) {
    const toArray = coerceArray(ids);
    if (isEmpty(toArray)) return;
    const everyExist = toArray.every((id) => this.active.indexOf(id) > -1);
    if (everyExist) return;

    isDev() && setAction('Add Active', ids);
    this._setState((state) => {
      /** Protect against case that one of the items in the array exist */
      const uniques = Array.from(new Set([...(state.active as IDType[]), ...toArray]));
      return {
        ...state,
        active: uniques,
      };
    });
  }

  /**
   * Remove active entities
   *
   * @example
   *
   * store.removeActive(2)
   * store.removeActive([3, 4, 5])
   */
  removeActive<T = OrArray<IDType>>(ids: T) {
    const toArray = coerceArray(ids);
    if (isEmpty(toArray)) return;
    const someExist = toArray.some((id) => this.active.indexOf(id) > -1);
    if (!someExist) return;

    isDev() && setAction('Remove Active', ids);
    this._setState((state) => {
      return {
        ...state,
        active: Array.isArray(state.active) ? state.active.filter((currentId) => toArray.indexOf(currentId) === -1) : null,
      };
    });
  }

  /**
   * Toggle active entities
   *
   * @example
   *
   * store.toggle(2)
   * store.toggle([3, 4, 5])
   */
  @transaction()
  toggleActive<T = OrArray<IDType>>(ids: T) {
    const toArray = coerceArray(ids);
    const filterExists = (remove) => (id) => this.active.includes(id) === remove;
    const remove = toArray.filter(filterExists(true));
    const add = toArray.filter(filterExists(false));
    this.removeActive(remove);
    this.addActive(add);
    isDev() && logAction('Toggle Active');
  }

  /**
   *
   * Create sub UI store for managing Entity's UI state
   *
   * @example
   *
   * export type ProductUI = {
   *   isLoading: boolean;
   *   isOpen: boolean
   * }
   *
   * interface ProductsUIState extends EntityState<ProductUI> {}
   *
   * export class ProductsStore EntityStore<ProductsState, Product> {
   *   ui: EntityUIStore<ProductsUIState, ProductUI>;
   *
   *   constructor() {
   *     super();
   *     this.createUIStore();
   *   }
   *
   * }
   */
  createUIStore(initialState = {}, storeConfig: Partial<StoreConfigOptions> = {}) {
    const defaults: Partial<StoreConfigOptions> = { name: `UI/${this.storeName}`, idKey: this.idKey };
    this.ui = new EntityUIStore(initialState, { ...defaults, ...storeConfig });
    return this.ui;
  }

  // @internal
  destroy() {
    super.destroy();
    if (this.ui instanceof EntityStore) {
      this.ui.destroy();
    }
    this.entityActions.complete();
  }

  // @internal
  akitaPreUpdateEntity(_: Readonly<EntityType>, nextEntity: any): EntityType {
    return nextEntity as EntityType;
  }

  // @internal
  akitaPreAddEntity(newEntity: any): EntityType {
    return newEntity as EntityType;
  }

  // @internal
  akitaPreCheckEntity(newEntity: Readonly<EntityType>): EntityType {
    return newEntity;
  }

  private get ids() {
    return this._value().ids;
  }

  private get entities() {
    return this._value().entities;
  }

  private get active() {
    return this._value().active;
  }

  private _setActive(ids: OrArray<IDType>) {
    this._setState((state) => {
      return {
        ...state,
        active: ids,
      };
    });
  }

  private handleUICreation(add = false) {
    const ids = this.ids;
    const isFunc = isFunction(this.ui._akitaCreateEntityFn);
    let uiEntities;
    const createFn = (id) => {
      const current = this.entities[id];
      const ui = isFunc ? this.ui._akitaCreateEntityFn(current) : this.ui._akitaCreateEntityFn;
      return {
        [this.idKey]: current[this.idKey],
        ...ui,
      };
    };

    if (add) {
      uiEntities = this.ids.filter((id) => isUndefined(this.ui.entities[id])).map(createFn);
    } else {
      uiEntities = ids.map(createFn);
    }

    add ? this.ui.add(uiEntities) : this.ui.set(uiEntities);
  }

  private hasInitialUIState() {
    return this.hasUIStore() && isUndefined(this.ui._akitaCreateEntityFn) === false;
  }

  private handleUIRemove(ids: IDType[]) {
    if (this.hasUIStore()) {
      this.ui.remove(ids);
    }
  }

  private hasUIStore() {
    return this.ui instanceof EntityUIStore;
  }
}

// @internal
export class EntityUIStore<UIState, DEPRECATED = any> extends EntityStore<UIState> {
  _akitaCreateEntityFn: EntityUICreateFn;

  constructor(initialState = {}, storeConfig: Partial<StoreConfigOptions> = {}) {
    super(initialState, storeConfig);
  }

  /**
   *
   * Set the initial UI entity state. This function will determine the entity's
   * initial state when we call `set()` or `add()`.
   *
   * @example
   *
   * constructor() {
   *   super();
   *   this.createUIStore().setInitialEntityState(entity => ({ isLoading: false, isOpen: true }));
   *   this.createUIStore().setInitialEntityState({ isLoading: false, isOpen: true });
   * }
   *
   */
  setInitialEntityState<EntityUI = any, Entity = any>(createFn: EntityUICreateFn<EntityUI, Entity>) {
    this._akitaCreateEntityFn = createFn;
  }
}
