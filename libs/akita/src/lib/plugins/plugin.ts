import { Observable } from 'rxjs';
import { getAkitaConfig } from '../config';
import { filterNil } from '../filterNil';
import { getValue } from '../getValueByString';
import { Query } from '../query';
import { QueryEntity } from '../queryEntity';
import { setValue } from '../setValueByString';
import { toBoolean } from '../toBoolean';

export type Queries<State> = Query<State> | QueryEntity<State>;

export abstract class AkitaPlugin<State = any> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  protected constructor(protected query: Queries<State>, config?: { resetFn?: Function }) {
    if (config && config.resetFn) {
      if (getAkitaConfig().resettable) {
        this.onReset(config.resetFn);
      }
    }
  }

  /** This method is responsible for getting access to the query. */
  protected getQuery(): Queries<State> {
    return this.query;
  }

  /** This method is responsible for getting access to the store. */
  protected getStore(): any {
    return this.getQuery().__store__;
  }

  /** This method is responsible for cleaning. */
  public abstract destroy(): void;

  /** This method is responsible tells whether the plugin is entityBased or not.  */
  // eslint-disable-next-line class-methods-use-this
  protected isEntityBased(entityId: any): boolean {
    return toBoolean(entityId);
  }

  /** This method is responsible for selecting the source; it can be the whole store or one entity. */
  protected selectSource(entityId: any, property?: string): Observable<any> {
    if (this.isEntityBased(entityId)) {
      return (this.getQuery() as QueryEntity<State>).selectEntity(entityId).pipe(filterNil);
    }

    if (property) {
      return this.getQuery().select((state) => getValue(state, this.withStoreName(property)));
    }

    return this.getQuery().select();
  }

  protected getSource(entityId: any, property?: string): any {
    if (this.isEntityBased(entityId)) {
      return (this.getQuery() as QueryEntity<State>).getEntity(entityId);
    }

    const state = this.getQuery().getValue();

    if (property) {
      return getValue(state, this.withStoreName(property));
    }

    return state;
  }

  protected withStoreName(prop: string): string {
    return `${this.storeName}.${prop}`;
  }

  protected get storeName(): string {
    return this.getStore().storeName;
  }

  /** This method is responsible for updating the store or one entity; it can be the whole store or one entity. */
  protected updateStore(newState, entityId?, property?: string): void {
    if (this.isEntityBased(entityId)) {
      this.getStore().update(entityId, newState);
    } else {
      if (property) {
        this.getStore()._setState((state) => {
          return setValue(state, this.withStoreName(property), newState);
        });
        return;
      }
      this.getStore()._setState((state) => ({ ...state, ...newState }));
    }
  }

  /**
   * Function to invoke upon reset
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  private onReset(fn: Function): void {
    const original = this.getStore().reset;
    this.getStore().reset = (...params): void => {
      /** It should run after the plugin destroy method */
      setTimeout(() => {
        original.apply(this.getStore(), params);
        fn();
      });
    };
  }
}
