import { skip } from 'rxjs/operators';
import { QueryEntity } from '../../queryEntity';
import { toBoolean } from '../../toBoolean';
import { EntityState, getIDType, OrArray } from '../../types';
import { EntityCollectionPlugin } from '../entityCollectionPlugin';
import { StateHistoryParams, StateHistoryPlugin } from './stateHistoryPlugin';

export interface StateHistoryEntityParams<IDType> extends StateHistoryParams {
  entityIds?: OrArray<IDType>;
}

export class EntityStateHistoryPlugin<State extends EntityState = any, P extends StateHistoryPlugin<State> = StateHistoryPlugin<State>> extends EntityCollectionPlugin<State, P> {
  constructor(protected query: QueryEntity<State>, protected readonly params: StateHistoryEntityParams<getIDType<State>> = {}) {
    super(query, params.entityIds);
    this.params.maxAge = toBoolean(params.maxAge) ? params.maxAge : 10;
    this.activate();
    this.selectIds()
      .pipe(skip(1))
      .subscribe((ids) => this.activate(ids));
  }

  redo(ids?: OrArray<getIDType<State>>): void {
    this.forEachId(ids, (e) => e.redo());
  }

  undo(ids?: OrArray<getIDType<State>>): void {
    this.forEachId(ids, (e) => e.undo());
  }

  hasPast(id: getIDType<State>): boolean {
    if (this.hasEntity(id)) {
      return this.getEntity(id).hasPast;
    }

    return false;
  }

  hasFuture(id: getIDType<State>): boolean {
    if (this.hasEntity(id)) {
      return this.getEntity(id).hasFuture;
    }

    return false;
  }

  jumpToFuture(ids: OrArray<getIDType<State>>, index: number): void {
    this.forEachId(ids, (e) => e.jumpToFuture(index));
  }

  jumpToPast(ids: OrArray<getIDType<State>>, index: number): void {
    this.forEachId(ids, (e) => e.jumpToPast(index));
  }

  clear(ids?: OrArray<getIDType<State>>): void {
    this.forEachId(ids, (e) => e.clear());
  }

  destroy(ids?: OrArray<getIDType<State>>, clearHistory = false): void {
    this.forEachId(ids, (e) => e.destroy(clearHistory));
  }

  ignoreNext(ids?: OrArray<getIDType<State>>): void {
    this.forEachId(ids, (e) => e.ignoreNext());
  }

  protected instantiatePlugin(id: getIDType<State>): P {
    // TODO fix cast, see https://stackoverflow.com/questions/56505560/could-be-instantiated-with-a-different-subtype-of-constraint-object
    return new StateHistoryPlugin<State>(this.query, this.params, id) as P;
  }
}
