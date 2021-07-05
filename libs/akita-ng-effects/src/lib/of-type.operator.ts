/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/ts-action
 */

import { Observable, pipe } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Action, ActionCreator, ActionType } from 'ts-action';

export function ofType<C extends ActionCreator[]>(...creators: C): (source: Observable<Action>) => Observable<Omit<ActionType<C[number]>, 'type'>>;
export function ofType(...creators: ActionCreator[]): (source: Observable<Action>) => Observable<Omit<Action, 'type'>> {
  return pipe(
    filter<Action>(({ type }) => creators.some((creator) => creator.type === type)),
    map((action) => {
      const { type, ...data } = action;
      return data;
    })
  );
}
