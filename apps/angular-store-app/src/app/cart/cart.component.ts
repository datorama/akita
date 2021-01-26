import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../products/state/products.model';
import { CartQuery } from './state/cart.query';
import { CartItem } from './state/cart.model';
import { Actions } from '@datorama/akita-ng-effects';
import { CartActions } from './state/cart.actions';

@Component({
  selector: 'app-cart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart.component.html',
})
export class CartComponent implements OnInit {
  items$: Observable<(CartItem & Product)[]>;
  total$: Observable<number>;
  notify$: Observable<boolean>;

  constructor(private cartQuery: CartQuery, private actions: Actions) {}

  ngOnInit() {
    this.items$ = this.cartQuery.selectItems$;
    this.total$ = this.cartQuery.selectTotal$;
    this.notify$ = this.cartQuery.selectNotification$;
  }

  remove({ productId }: CartItem) {
    this.actions.dispatch(CartActions.removeItem({ productId }));
  }
}
