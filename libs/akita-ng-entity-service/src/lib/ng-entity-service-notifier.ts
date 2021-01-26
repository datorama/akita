import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ActionType, EntityServiceAction, HttpMethod } from './types';

export const ofType = (type: ActionType) => filter((action: EntityServiceAction) => action.type === type);

export const filterMethod = (method: HttpMethod | keyof typeof HttpMethod) => filter((action: EntityServiceAction) => action.method === method);

export const filterStore = (name: string) => filter((action: EntityServiceAction) => action.storeName === name);

@Injectable({ providedIn: 'root' })
export class NgEntityServiceNotifier {
  private readonly dispatcher = new Subject<EntityServiceAction>();
  action$ = this.dispatcher.asObservable();

  dispatch(event: EntityServiceAction) {
    this.dispatcher.next(event);
  }
}
