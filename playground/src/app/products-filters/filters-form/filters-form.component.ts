import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { Filter } from '../../../../../akita/src/plugins/filters/filters-store';
import { ProductPlant, ProductsFiltersService } from '../state';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { searchFilter } from '../../../../../akita/src/plugins/filters/filters-utils';

@Component({
  selector: 'app-filters-form',
  templateUrl: './filters-form.component.html'
})
export class FiltersFormComponent implements OnInit, OnDestroy {
  filterForm = new FormGroup({
    search: new FormControl(),
    sortControl: new FormControl('title'),
    categoryControl: new FormControl(),
    size: new FormControl(),
    fastDeliveryControl: new FormControl()
  });

  category: string;
  filterFastDelivery: boolean = false;
  private filters$: Observable<Filter<ProductPlant>[]>;

  constructor( private productsService: ProductsFiltersService ) {
  }

  ngOnInit() {
    this.setInitialFilters();

    this.filterForm.controls.search.valueChanges.pipe(untilDestroyed(this)).subscribe(( search: string ) => {
      if( search ) {
        this.productsService.setFilter({
          id: 'search',
          value: search,
          order: 20,
          name: `" ${search} "`,
          predicate: entity => searchFilter(search, entity)
        });
      } else {
        this.productsService.removeFilter('search');
      }
    });

    this.filterForm.controls.categoryControl.valueChanges.pipe(untilDestroyed(this)).subscribe(category => {
      this.productsService.setFilter({
        id: 'category',
        value: category,
        predicate: entity => entity.category === category
      });
    });

    this.filterForm.controls.sortControl.valueChanges.pipe(untilDestroyed(this)).subscribe(( sortBy: string ) => {
      this.productsService.setOrderBy(sortBy.slice(1), sortBy.slice(0, 1));
    });
    this.filterForm.controls.sortControl.setValue(this.productsService.getSortValue());

    this.filterFastDelivery = this.productsService.getFilterValue('fastDelivery');

    this.filters$ = this.productsService.selectFilters();
  }

  private setInitialFilters() {
    this.filterForm.setValue({
      search: this.productsService.getFilterValue('search'),
      sortControl: this.productsService.getSortValue(),
      categoryControl: this.productsService.getFilterValue('category'),
      size: this.productsService.getFilterValue('size'),
      fastDeliveryControl: this.productsService.getFilterValue('fastDelivery')
    }, { emitEvent: false });
  }

  filterSize( size: string ) {
    this.productsService.setFilter({
      id: 'size',
      name: size + ' size',
      value: size,
      predicate: entity => entity.size === size
    });
  }

  changeFastDelivery() {
    this.filterFastDelivery = !this.filterFastDelivery;
    if( this.filterFastDelivery ) {
      this.productsService.setFilter({
        id: 'fastDelivery',
        name: 'Only fast Delivery',
        value: this.filterFastDelivery,
        order: 1,
        predicate: entity => entity.rapidDelivery
      });
    } else {
      this.removeFilter('fastDelivery');
    }
  }

  removeFilter( id: any ) {
    this.productsService.removeFilter(id);
    this.setInitialFilters();
  }

  removeFilterAll() {
    this.productsService.removeAllFilter();
    this.setInitialFilters();
  }

  ngOnDestroy() {
  }
}
