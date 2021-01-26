import { Injectable } from '@angular/core';
import { CartItem } from './cart.model';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Product } from '../../products/state/products.model';

export interface CartState extends EntityState<CartItem> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'cart',
  idKey: 'productId',
})
export class CartStore extends EntityStore<CartState> {
  constructor() {
    super();
  }

  updateQuantity(productId: Product['id'], operand = 1) {
    this.update(productId, (entity) => {
      const newQuantity = entity.quantity + operand;
      return {
        ...entity,
        quantity: newQuantity,
      };
    });
  }

  notify(notify: boolean) {
    this.update((state) => ({ ...state, notify }));
  }
}
