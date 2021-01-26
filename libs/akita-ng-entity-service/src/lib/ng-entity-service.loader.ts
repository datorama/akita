import { Injectable } from '@angular/core';
import { isFunction } from '@datorama/akita';
import { MonoTypeOperatorFunction, Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { HttpMethod } from './types';

type Event = { method: HttpMethod; loading: boolean; storeName: string; entityId?: any };

@Injectable({ providedIn: 'root' })
export class NgEntityServiceLoader {
  private readonly dispatcher = new Subject<Event>();

  loading$ = this.dispatcher.asObservable();

  dispatch(event: Event): void {
    this.dispatcher.next(event);
  }

  loadersFor(
    name?: string
  ): {
    get$: Observable<boolean>;
    add$: Observable<boolean>;
    update$: Observable<boolean>;
    delete$: Observable<boolean>;
    getEntity: (id: any) => Observable<boolean>;
    updateEntity: (id: any) => Observable<boolean>;
    deleteEntity: (id: any) => Observable<boolean>;
  } {
    const filterStore = filter(({ storeName }: Event) => (name ? storeName === name : true));
    const filterMethod = (mthd): MonoTypeOperatorFunction<Event> =>
      filter(({ method }: Event) => {
        return isFunction(mthd) ? mthd(method) : method === mthd;
      });

    const actionBased = (current: ((method) => boolean) | HttpMethod): Observable<boolean> =>
      this.loading$.pipe(
        filterStore,
        filterMethod(current),
        map((action) => action.loading)
      );

    const idBased = (id: any, mthd: ((method) => boolean) | HttpMethod): Observable<boolean> =>
      this.loading$.pipe(
        filterStore,
        filterMethod(mthd),
        filter((action) => action.entityId === id),
        map((action) => action.loading)
      );

    return {
      get$: actionBased(HttpMethod.GET),
      add$: actionBased(HttpMethod.POST),
      update$: actionBased((method) => method === HttpMethod.PUT || method === HttpMethod.PATCH),
      delete$: actionBased(HttpMethod.DELETE),
      getEntity: (id: any): Observable<boolean> => idBased(id, HttpMethod.GET),
      updateEntity: (id: any): Observable<boolean> => idBased(id, (method) => method === HttpMethod.PUT || method === HttpMethod.PATCH),
      deleteEntity: (id: any): Observable<boolean> => idBased(id, HttpMethod.DELETE),
    };
  }
}
