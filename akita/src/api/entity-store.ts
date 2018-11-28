import { _crud } from '../internal/crud';
import { AkitaImmutabilityError, assertActive } from '../internal/error';
import { Action, __globalState } from '../internal/global-state';
import { coerceArray, entityExists, isFunction, isNil, isObject, isUndefined, toBoolean } from '../internal/utils';
import { isDev, Store } from './store';
import { ActiveState, Entities, EntityState, HashMap, ID, Newable, AddOptions, SetActiveOptions } from './types';

/**
 * The Root Store that every sub store needs to inherit and
 * invoke `super` with the initial state.
 */
export class EntityStore<S extends EntityState<E>, E, ActiveEntity = ID> extends Store<S> {
  /**
   *
   * Initiate the store with the state
   */
  constructor( initialState = {}, options: { idKey?: string, storeName?: string } = {} ) {
    super({ ...getInitialEntitiesState(), ...initialState }, options);
  }

  get entities() {
    return this._value().entities;
  }

  /**
   *
   * Replace current collection with provided collection
   *
   * @example
   * this.store.set([Entity, Entity]);
   * this.store.set({1: Entity, 2: Entity});
   * this.store.set([{id: 1}, {id: 2}], { entityClass: Product });
   *
   */
  set(entities: E[] | HashMap<E> | Entities<E>, options: { entityClass?: Newable<E> | undefined } = {}) {
    isDev() && __globalState.setAction({ type: 'Set Entities' });
    this.setState(state => _crud._set(state, isNil(entities) ? [] : entities, options.entityClass, this.idKey));
    this.setDirty();
  }

  /**
   * Create or replace an entity in the store.
   *
   * @example
   * this.store.createOrReplace(3, Entity);
   *
   */
  createOrReplace(id: ID, entity: E) {
    if (!entityExists(id, this._value().entities)) {
      this.addWhenNotExists(id, entity);
    } else {
      isDev() && __globalState.setAction({ type: 'Create or Replace Entity', entityId: [id] });
      this.setState(state => _crud._replaceEntity(state, id, entity));
    }
  }

  /**
   *
   * Insert or Update
   */
  upsert(id: ID, entityOrFn: Partial<E> | ((entity: Readonly<E>) => Partial<E>)) {
    if (!entityExists(id, this._value().entities)) {
      const resolve = isFunction(entityOrFn) ? (entityOrFn as Function)({}) : entityOrFn;
      this.addWhenNotExists(id, resolve);
    } else {
      this.update(id, entityOrFn as any);
    }
  }

  /**
   * Add an entity or entities to the store.
   *
   * @example
   * this.store.add([Entity, Entity]);
   * this.store.add(Entity);
   * this.store.add(Entity, { prepend: true });
   */
  add(entities: E[] | E, options?: AddOptions) {
    const toArray = coerceArray(entities);

    if (toArray.length === 0) return;
    /**  If we pass entities that already exist, we should ignore them */
    const allExists = toArray.every(entity => this._value().ids.indexOf(entity[this.idKey]) > -1);
    if (allExists) return;

    isDev() && __globalState.setAction({ type: 'Add Entity' });
    this.setState(state => _crud._add<S, E>(state, toArray, this.idKey, options));
  }

  /**
   *
   * Update an entity or entities in the store.
   *
   * @example
   * this.store.update(3, {
   *   name: 'New Name'
   * });
   *
   *  this.store.update(3, entity => {
   *    return {
   *      config: {
   *        ...entity.filter,
   *        date
   *      }
   *    }
   *  });
   *
   * this.store.update([1,2,3], {
   *   name: 'New Name'
   * });
   *
   * this.store.update(e => e.name === 'value', {
   *   name: 'New Name'
   * });
   *
   * this.store.update(null, {
   *   name: 'New Name'
   * });
   *
   */
  update(id: ID | ID[] | null, newStateFn: ((entity: Readonly<E>) => Partial<E>));
  update(id: ID | ID[] | null, newState: Partial<E>);
  update(id: ID | ID[] | null, newState: Partial<S>);
  update(newState: (state: Readonly<S>) => Partial<S>);
  update(predicate: ((entity: Readonly<E>) => boolean), newStateFn: ((entity: Readonly<E>) => Partial<E>));
  update(predicate: ((entity: Readonly<E>) => boolean), newState: Partial<E>);
  update(predicate: ((entity: Readonly<E>) => boolean), newState: Partial<S>);
  update(newState: Partial<S>);
  update(
    idsOrFn: ID | ID[] | null | Partial<S> | ((state: Readonly<S>) => Partial<S>) | ((entity: Readonly<E>) => boolean),
    newStateOrFn?: ((entity: Readonly<E>) => Partial<E>) | Partial<E> | Partial<S>
  ) {
    let ids: ID[] = [];
    const storeIds = this._value().ids;

    if (isFunction(idsOrFn)) {
      for (let i = 0, len = storeIds.length; i < len; i++) {
        const id = storeIds[i];
        const entity = this._value().entities[id];
        if (entity && (idsOrFn as Function)(entity)) {
          ids.push(id);
        }
      }
    } else {
      ids = toBoolean(idsOrFn) ? coerceArray(idsOrFn) : storeIds;
    }

    if (ids.length === 0) return;
    isDev() && __globalState.setAction({ type: 'Update Entity', entityId: ids });

    this.setState(state => {
      return _crud._update(state, ids, newStateOrFn, this.idKey);
    });
  }

  /**
   * An alias to update all.
   */
  updateAll(state: Partial<E>) {
    if (this._value().ids.length === 0) return;
    this.update(null, state);
  }

  /**
   * Update the root state (data which is external to the entities).
   *
   * @example
   * this.store.updateRoot({
   *   metadata: 'new metadata
   * });
   *
   *  this.store.updateRoot(state => {
   *    return {
   *      metadata: {
   *        ...state.metadata,
   *        key: 'new value'
   *      }
   *    }
   *  });
   */
  updateRoot(newStateFn: ((state: Readonly<S>) => Partial<S>) | Partial<S>, action?: Action) {
    const newState = isFunction(newStateFn) ? newStateFn(this._value()) : newStateFn;

    if (newState === this._value()) {
      throw new AkitaImmutabilityError(this.storeName);
    }

    isDev() && __globalState.setAction(action || { type: 'Update Root' });

    this.setState(state => {
      return {
        ...(state as any),
        ...(newState as any)
      };
    });
  }

  /**
   *
   * Remove one or more entities from the store:
   *
   * @example
   * this.store.remove(5);
   * this.store.remove([1,2,3]);
   * this.store.remove(entity => entity.id === 1);
   * this.store.remove();
   */
  remove(id?: ID | ID[]);
  remove(predicate: (entity: Readonly<E>) => boolean);
  remove(idsOrFn?: ID | ID[] | ((entity: Readonly<E>) => boolean)) {
    const storeIds = this._value().ids;

    if (storeIds.length === 0) return;
    const idPassed = toBoolean(idsOrFn);
    if (!idPassed) this.setPristine();

    let ids: ID[] = [];
    if (isFunction(idsOrFn)) {
      for (let i = 0, len = storeIds.length; i < len; i++) {
        const id = storeIds[i];
        const entity = this._value().entities[id];
        if (entity && idsOrFn(entity)) {
          ids.push(id);
        }
      }
    } else {
      ids = idPassed ? coerceArray(idsOrFn) : null;
    }

    if (ids && ids.length === 0) return;
    isDev() && __globalState.setAction({ type: 'Remove Entity', entityId: ids });

    this.setState(state => {
      return _crud._remove(state, ids);
    });
  }

  /**
   *
   * Update the active entity.
   *
   * @example
   * this.store.updateActive(active => {
   *   return {
   *     config: {
   *      ..active.config,
   *      date
   *     }
   *   }
   * })
   */
  updateActive(newStateFn: ((entity: Readonly<E>) => Partial<E>) | Partial<E>) {
    assertActive(this._value());
    isDev() && __globalState.setAction({ type: 'Update Active Entity', entityId: this._value().active });
    this.setState(state => {
      const activeId = state.active as ID;
      const newState = isFunction(newStateFn) ? newStateFn(state.entities[activeId]) : newStateFn;
      if (newState === state) {
        throw new AkitaImmutabilityError(this.storeName);
      }
      return _crud._update(state, [activeId], newState, this.idKey);
    });
  }

  /**
   * Set the given entity as active.
   */
  setActive(idOrOptions: ActiveEntity | SetActiveOptions) {
    let activeId: ActiveEntity;

    if (isObject(idOrOptions)) {
      if (isNil(this._value().active)) return;
      (idOrOptions as SetActiveOptions) = Object.assign({ wrap: true }, idOrOptions);
      const ids = this._value().ids;
      const currentIdIndex = ids.indexOf(this._value().active);
      if ((idOrOptions as SetActiveOptions).prev) {
        const isFirst = currentIdIndex === 0;
        if (isFirst && !(idOrOptions as SetActiveOptions).wrap) return;
        activeId = isFirst ? ids[ids.length - 1] : (ids[currentIdIndex - 1] as any);
      } else if ((idOrOptions as SetActiveOptions).next) {
        const isLast = ids.length === currentIdIndex + 1;
        if (isLast && !(idOrOptions as SetActiveOptions).wrap) return;
        activeId = isLast ? ids[0] : (ids[currentIdIndex + 1] as any);
      }
    } else {
      if (idOrOptions === this._value().active) return;
      activeId = idOrOptions as ActiveEntity;
    }

    isDev() && __globalState.setAction({ type: 'Set Active Entity', entityId: activeId });
    this.setState(state => {
      return {
        ...(state as any),
        active: activeId
      };
    });
  }

  private addWhenNotExists(id: ID, entity: E) {
    if (!entity[this.idKey]) {
      entity[this.idKey] = id;
    }
    this.add(entity);
  }
}

export const getInitialEntitiesState = () =>
  ({
    entities: {},
    ids: [],
    loading: true,
    error: null
  } as EntityState);

export const getInitialActiveState = () =>
  ({
    active: null
  } as ActiveState);
