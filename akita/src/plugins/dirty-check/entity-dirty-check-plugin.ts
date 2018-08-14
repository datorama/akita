import {HashMap, ID, IDS} from '../../api/types';
import { DirtyCheckPlugin, DirtyCheckComparator, dirtyCheckDefaultParams, DirtyCheckResetParams } from './dirty-check-plugin';
import { QueryEntity } from '../../api/query-entity';
import { EntityCollectionPlugin } from '../entity-collection-plugin';
import { skip, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export type DirtyCheckCollectionParams<E> = {
  comparator?: DirtyCheckComparator<E>;
  entityIds?: ID | ID[];
};

export class EntityDirtyCheckPlugin<E, P extends DirtyCheckPlugin<E, any> = DirtyCheckPlugin<E, any>> extends EntityCollectionPlugin<E, P> {

  isSomeDirty$: Observable<boolean> =  this.query.select(state => state.entities)
    .pipe( map(entities => this.checkSomeDirty(entities)));

  constructor(protected query: QueryEntity<any, E>, private readonly params: DirtyCheckCollectionParams<E> = {}) {
    super(query, params.entityIds);
    this.params = { ...dirtyCheckDefaultParams, ...params };
    this.activate();
    this.selectIds()
      .pipe(skip(1))
      .subscribe(ids => this.activate(ids));
  }

  setHead(ids?: IDS) {
    this.forEachId(ids, e => e.setHead());
    return this;
  }

  hasHead(id: ID): boolean {
    if (this.entities.has(id)) {
      const entity = this.getEntity(id);
      return entity.hasHead();
    }

    return false;
  }

  reset(ids?: IDS, params: DirtyCheckResetParams = {}) {
    this.forEachId(ids, e => e.reset(params));
  }

  isDirty(id: ID): Observable<boolean>;
  isDirty(id: ID, asObservable: true): Observable<boolean>;
  isDirty(id: ID, asObservable: false): boolean;
  isDirty(id: ID, asObservable = true): Observable<boolean> | boolean {
    if (this.entities.has(id)) {
      const entity = this.getEntity(id);
      return asObservable ? entity.isDirty$ : entity.isDirty();
    }

    return false;
  }

  isSomeDirty(): boolean {
    const entities = this.query.getAll({asObject: true});
    return this.checkSomeDirty(entities);
  }

  destroy(ids?: IDS) {
    this.forEachId(ids, e => e.destroy());
  }

  protected instantiatePlugin(id: ID): P {
    return new DirtyCheckPlugin(this.query, this.params, id) as P;
  }

  private checkSomeDirty(entities: HashMap<E>): boolean {
    const entitiesIds = this.resolvedIds();
    for (const id of entitiesIds) {
      const dirty = this.params.comparator((this.getEntity(id) as any).getHead(), entities[id]);
      if (dirty) {
        return true;
      }
    }
    return false;
  }
}
