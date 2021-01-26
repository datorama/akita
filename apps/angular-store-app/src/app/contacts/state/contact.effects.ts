import { Injectable } from '@angular/core';
import { Actions } from '@datorama/akita-ng-effects';

@Injectable()
export class ContactEffects {
  constructor(readonly actions$: Actions) {}
}
