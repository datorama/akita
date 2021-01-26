import { BehaviorSubject, from, isObservable, Observable, Subscription } from 'rxjs';
import { delay, map, switchMap, take } from 'rxjs/operators';
import { action, logAction } from '../../actions';
import { isNil } from '../../isNil';
import { isUndefined } from '../../isUndefined';
import { QueryEntity } from '../../queryEntity';
import { applyTransaction } from '../../transaction';
import { EntityState, getEntityType, ID } from '../../types';
import { AkitaPlugin } from '../plugin';

export interface PaginationResponse<E> {
  currentPage: number;
  perPage: number;
  lastPage: number;
  data: E[];
  total?: number;
  from?: number;
  to?: number;
  pageControls?: number[];
}

export interface PaginatorConfig {
  pagesControls?: boolean;
  range?: boolean;
  startWith?: number;
  cacheTimeout?: Observable<number>;
  clearStoreWithCache?: boolean;
}

const paginatorDefaults: PaginatorConfig = {
  pagesControls: false,
  range: false,
  startWith: 1,
  cacheTimeout: undefined,
  clearStoreWithCache: true,
};

/**
 * Generate an array so we can ngFor them to navigate between pages
 */
function generatePages(total: number, perPage: number): any[] {
  const len = Math.ceil(total / perPage);
  const arr = [];
  for (let i = 0; i < len; i++) {
    arr.push(i + 1);
  }
  return arr;
}

export class PaginatorPlugin<State extends EntityState> extends AkitaPlugin<State> {
  /** Save current filters, sorting, etc. in cache */
  metadata = new Map();

  private readonly page: BehaviorSubject<number>;

  private pages = new Map<number, { ids: ID[] }>();

  private readonly clearCacheSubscription: Subscription;

  private pagination: PaginationResponse<getEntityType<State>> = {
    currentPage: 1,
    perPage: 0,
    total: 0,
    lastPage: 0,
    data: [],
  };

  /**
   * When the user navigates to a different page and return
   * we don't want to call `clearCache` on first time.
   */
  private initial = true;

  constructor(protected query: QueryEntity<State>, public config: PaginatorConfig = {}) {
    super(query, {
      resetFn: () => {
        this.initial = false;
        this.destroy({ clearCache: true, currentPage: 1 });
      },
    });
    this.config = { ...paginatorDefaults, ...config };
    const { startWith, cacheTimeout } = this.config;
    this.page = new BehaviorSubject(startWith);
    if (isObservable(cacheTimeout)) {
      this.clearCacheSubscription = cacheTimeout.subscribe(() => this.clearCache());
    }
  }

  /**
   * Proxy to the query loading
   */
  isLoading$ = this.query.selectLoading().pipe(delay(0));

  /**
   * Listen to page changes
   */
  get pageChanges(): Observable<number> {
    return this.page.asObservable();
  }

  /**
   * Get the current page number
   */
  get currentPage(): number {
    return this.pagination.currentPage;
  }

  /**
   * Check if current page is the first one
   */
  get isFirst(): boolean {
    return this.currentPage === 1;
  }

  /**
   * Check if current page is the last one
   */
  get isLast(): boolean {
    return this.currentPage === this.pagination.lastPage;
  }

  /**
   * Whether to generate an array of pages for *ngFor
   * [1, 2, 3, 4]
   */
  withControls(): this {
    this.config.pagesControls = true;
    return this;
  }

  /**
   * Whether to generate the `from` and `to` keys
   * [1, 2, 3, 4]
   */
  withRange(): this {
    this.config.range = true;
    return this;
  }

  /**
   * Set the loading state
   */
  setLoading(value = true): void {
    this.getStore().setLoading(value);
  }

  /**
   * Update the pagination object and add the page
   */
  @action('@Pagination - New Page')
  update(response: PaginationResponse<getEntityType<State>>): void {
    this.pagination = response;
    this.addPage(response.data);
  }

  /**
   *
   * Set the ids and add the page to store
   */
  addPage(data: getEntityType<State>[]) {
    this.pages.set(this.currentPage, { ids: data.map((entity) => entity[this.getStore().idKey]) });
    this.getStore().upsertMany(data);
  }

  /**
   * Clear the cache.
   */
  clearCache(options: { clearStore?: boolean } = {}): void {
    if (!this.initial) {
      logAction('@Pagination - Clear Cache');

      if (options.clearStore !== false && (this.config.clearStoreWithCache || options.clearStore)) {
        this.getStore().remove();
      }

      this.pages = new Map();
      this.metadata = new Map();
    }
    this.initial = false;
  }

  clearPage(page: number): void {
    this.pages.delete(page);
  }

  /**
   * Clear the cache timeout and optionally the pages
   */
  destroy({ clearCache, currentPage }: { clearCache?: boolean; currentPage?: number } = {}): void {
    if (this.clearCacheSubscription) {
      this.clearCacheSubscription.unsubscribe();
    }
    if (clearCache) {
      this.clearCache();
    }
    if (!isUndefined(currentPage)) {
      this.setPage(currentPage);
    }
    this.initial = true;
  }

  /**
   * Whether the provided page is active
   */
  isPageActive(page: number): boolean {
    return this.currentPage === page;
  }

  /**
   * Set the current page
   */
  setPage(page: number): void {
    if (page !== this.currentPage || !this.hasPage(page)) {
      this.page.next((this.pagination.currentPage = page));
    }
  }

  /**
   * Increment current page
   */
  nextPage(): void {
    if (this.currentPage !== this.pagination.lastPage) {
      this.setPage(this.pagination.currentPage + 1);
    }
  }

  /**
   * Decrement current page
   */
  prevPage(): void {
    if (this.pagination.currentPage > 1) {
      this.setPage(this.pagination.currentPage - 1);
    }
  }

  /**
   * Set current page to last
   */
  setLastPage(): void {
    this.setPage(this.pagination.lastPage);
  }

  /**
   * Set current page to first
   */
  setFirstPage(): void {
    this.setPage(1);
  }

  /**
   * Check if page exists in cache
   */
  hasPage(page: number): boolean {
    return this.pages.has(page);
  }

  /**
   * Get the current page if it's in cache, otherwise invoke the request
   */
  getPage(req: () => Observable<PaginationResponse<getEntityType<State>>>): Observable<PaginationResponse<getEntityType<State>>> {
    let page = this.pagination.currentPage;
    if (this.hasPage(page)) {
      return this.selectPage(page);
    }
    this.setLoading(true);
    return from(req()).pipe(
      switchMap((config: PaginationResponse<getEntityType<State>>) => {
        page = config.currentPage;
        applyTransaction(() => {
          this.setLoading(false);
          this.update(config);
        });
        return this.selectPage(page);
      })
    );
  }

  getQuery(): QueryEntity<State> {
    return this.query;
  }

  refreshCurrentPage(): void {
    if (isNil(this.currentPage) === false) {
      this.clearPage(this.currentPage);
      this.setPage(this.currentPage);
    }
  }

  private getFrom(): number {
    if (this.isFirst) {
      return 1;
    }
    return (this.currentPage - 1) * this.pagination.perPage + 1;
  }

  private getTo(): number {
    if (this.isLast) {
      return this.pagination.total;
    }
    return this.currentPage * this.pagination.perPage;
  }

  /**
   * Select the page
   */
  private selectPage(page: number): Observable<PaginationResponse<getEntityType<State>>> {
    return this.query.selectAll({ asObject: true }).pipe(
      take(1),
      map((entities) => {
        const response: PaginationResponse<getEntityType<State>> = {
          ...this.pagination,
          data: this.pages.get(page).ids.map((id) => entities[id]),
        };

        const { range, pagesControls } = this.config;

        /** If no total - calc it */
        if (Number.isNaN(this.pagination.total)) {
          if (response.lastPage === 1) {
            response.total = response.data ? response.data.length : 0;
          } else {
            response.total = response.perPage * response.lastPage;
          }
          this.pagination.total = response.total;
        }

        if (range) {
          response.from = this.getFrom();
          response.to = this.getTo();
        }

        if (pagesControls) {
          response.pageControls = generatePages(this.pagination.total, this.pagination.perPage);
        }

        return response;
      })
    );
  }
}

/** backward compatibility */
export const Paginator = PaginatorPlugin; // TODO deprecate?
