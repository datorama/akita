import { Injectable } from '@angular/core';
import { ProductPlantState, ProductsFiltersStore } from './products-filters.store';
import { ProductsFiltersDataService } from './products-filters-data.service';
import { ProductPlant } from './products-filters.model';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ProductsFiltersQuery } from './products-filters.query';
import { ID, noop, Order } from '../../../../../akita/src';
import { FiltersPlugin } from '../../../../../akita/src/plugins/filters/filters-plugin';
import { Filter } from '../../../../../akita/src/plugins/filters/filters-store';

@Injectable({
  providedIn: 'root'
})
export class ProductsFiltersService {
  private filtersProduct: FiltersPlugin<ProductPlantState, ProductPlant>;

  constructor(private productsStore: ProductsFiltersStore, private productsQuery: ProductsFiltersQuery, private productsDataService: ProductsFiltersDataService) {
    this.filtersProduct = new FiltersPlugin<ProductPlantState, ProductPlant>(this.productsQuery);
  }

  /**
   *
   * @returns {Observable<ProductPlant[]>}
   */
  get(): Observable<ProductPlant[]> {
    const request = this.productsDataService.get().pipe(
      tap(response => {
        this.productsStore.set(response);
        // applyAction(
        //   () => {
        //     this.productsStore.set(response);
        //   },
        //   { type: '[Products Service] Fetch All' }
        // );
      })
    );

    return this.productsQuery.isPristine ? request : noop();
  }

  setFilter(filter: Filter) {
    this.filtersProduct.setFilter(filter);
  }

  setOrderBy(by: any, order: string | '+' | '-') {
    this.filtersProduct.setSortBy({ sortBy: by, sortByOrder: order === '+' ? Order.ASC : Order.DESC });
  }

  removeFilter(id: string) {
    this.filtersProduct.removeFilter(id);
  }

  getFilterValue(id: string): any | null {
    return this.filtersProduct.getFilterValue(id);
  }

  getSortValue(): string | null {
    const sortValue = this.filtersProduct.getSortValue();
    if (!sortValue) return '+title';
    const order = sortValue.sortByOrder === Order.ASC ? '+' : '-';
    return sortValue.sortBy ? order + sortValue.sortBy : '+title';
  }

  selectFilters(): Observable<Filter[]> {
    return this.filtersProduct.selectFilters();
  }

  selectAll(): Observable<ProductPlant[]> {
    return this.filtersProduct.selectAllByFilter();
  }

  /**
   *
   * @param {ID} id
   */
  getProduct(id: ID) {
    this.productsDataService.getProduct(id).subscribe(product => {
      this.productsStore.add(product);
    });
  }
}
