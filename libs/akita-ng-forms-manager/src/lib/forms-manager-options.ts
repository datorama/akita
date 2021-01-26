import { InjectionToken } from '@angular/core';

export type FormsManagerOptions = {
  debounceTime: number;
  updateStoreOnUnsubscribe: boolean;
};

export const FORMS_MANAGER_OPTIONS = new InjectionToken<FormsManagerOptions>('FormsManagerOptions');

export const defaultOptions: FormsManagerOptions = {
  debounceTime: 300,
  updateStoreOnUnsubscribe: false,
};
