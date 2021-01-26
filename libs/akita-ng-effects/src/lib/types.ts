import { Subject } from 'rxjs';

export interface EffectOptions {
  dispatch?: boolean;
}

export interface Effect extends Subject<Action> {
  isEffect: boolean;
  name: string | null;
  dispatchAction: boolean;
}

export interface Action {
  type: string;
  [key: string]: any;
}
