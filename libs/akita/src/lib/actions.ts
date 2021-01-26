import { IDS } from './types';

export interface StoreSnapshotAction {
  type: string | null;
  entityIds: IDS[] | null;
  skip: boolean;
  payload: any;
}

export const currentAction: StoreSnapshotAction = {
  type: null,
  entityIds: null,
  skip: false,
  payload: null,
};

let customActionActive = false;

export function resetCustomAction(): void {
  customActionActive = false;
}

// public API for custom actions. Custom action always wins
export function logAction(type: string, entityIds?, payload?: any) {
  setAction(type, entityIds, payload);
  customActionActive = true;
}

export function setAction(type: string, entityIds?, payload?: any) {
  if (customActionActive === false) {
    currentAction.type = type;
    currentAction.entityIds = entityIds;
    currentAction.payload = payload;
  }
}

export function setSkipAction(skip = true): void {
  currentAction.skip = skip;
}

export function action(action: string, entityIds?) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args) {
      logAction(action, entityIds);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
