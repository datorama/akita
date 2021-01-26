import { NgEntityServiceNotifier } from './ng-entity-service-notifier';
import { EntityServiceAction } from './types';

export function successAction(storeName: string, notifier: NgEntityServiceNotifier): (params: Partial<EntityServiceAction>) => void {
  return ({ payload, method, successMsg }): void => {
    notifier.dispatch({
      type: 'success',
      storeName,
      payload,
      method,
      successMsg,
    });
  };
}

export function errorAction(storeName: string, notifier: NgEntityServiceNotifier): (params: Partial<EntityServiceAction>) => void {
  return ({ payload, method, errorMsg }): void => {
    notifier.dispatch({
      type: 'error',
      storeName,
      payload,
      method,
      errorMsg,
    });
  };
}
