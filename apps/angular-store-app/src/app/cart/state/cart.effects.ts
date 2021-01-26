import { Injectable } from '@angular/core';
import { Actions, createEffect, Effect, ofType } from '@datorama/akita-ng-effects';
import { CartActions } from './cart.actions';
import { map, switchMap, tap } from 'rxjs/operators';
import { CartStore } from './cart.store';
import { timer } from 'rxjs';

@Injectable()
export class CartEffects {
  constructor(private actions$: Actions, private cartStore: CartStore) {}

  removeItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.removeItem),
      tap(({ productId }) => this.cartStore.remove(productId)),
      map((_) => CartActions.removeItemSuccess())
    )
  );

  @Effect({ dispatch: false })
  removeItemSuccess = this.actions$.pipe(
    ofType(CartActions.removeItemSuccess),
    tap((_) => this.cartStore.notify(true)),
    switchMap((state) => timer(3000).pipe(tap((_) => this.cartStore.notify(false))))
  );
}
