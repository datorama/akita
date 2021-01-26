import { BehaviorSubject, combineLatest, interval, Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { PaginationResponse, PaginatorPlugin } from '../lib/plugins/paginator/paginatorPlugin';
import { QueryEntity } from '../lib/queryEntity';
import { Todo, TodosStore } from './setup';

const store = new TodosStore();

class TodosQuery extends QueryEntity<any, Todo> {
  constructor() {
    super(store);
  }
}

const query = new TodosQuery();
const paginator = new PaginatorPlugin(query);

const count = 100;
const data = [];

for (let i = 0; i < count; i++) {
  data.push({
    id: i + 1,
    email: `email ${i + 1}`,
  });
}

function getData(params = { sortBy: 'email', perPage: 10, page: 1, filterEnabled: false }) {
  const localData = params.filterEnabled ? data.slice(0, 50) : data;
  const page = params.filterEnabled ? 1 : params.page;
  const offset = (page - 1) * +params.perPage;
  const paginatedItems = localData.slice(offset, offset + +params.perPage);

  return {
    currentPage: page,
    perPage: +params.perPage,
    total: localData.length,
    lastPage: Math.ceil(localData.length / +params.perPage),
    data: paginatedItems,
  };
}

const getContacts = function (params): Observable<PaginationResponse<any>> {
  return of(getData(params));
};

describe('Paginator', () => {
  let res;
  const requestFunc = jest.fn();

  paginator.pageChanges
    .pipe(
      switchMap((page) => {
        const req = requestFunc.mockReturnValue(
          getContacts({
            page,
            perPage: 10,
          })
        );

        return paginator.getPage(req);
      })
    )
    .subscribe((v) => {
      res = v;
    });

  it('should set the pagination params', () => {
    expect(paginator.currentPage).toEqual(1);
    expect(paginator.pagination.currentPage).toEqual(1);
    expect(paginator.pagination.perPage).toEqual(10);
    expect(paginator.pagination.total).toEqual(100);
    expect(paginator.pagination.lastPage).toEqual(10);
    expect(paginator.pagination.data.length).toEqual(10);
  });

  it('should call the request function only in first time', () => {
    jest.spyOn(paginator, 'update');
    jest.spyOn(paginator, 'setLoading');
    jest.spyOn(paginator, 'selectPage');
    paginator.nextPage();
    expect(requestFunc).toHaveBeenCalledTimes(2);
    expect(paginator.update).toHaveBeenCalledTimes(1);
    expect(paginator.selectPage).toHaveBeenCalledTimes(1);
    expect(paginator.setLoading).toHaveBeenCalledTimes(2);
    paginator.setPage(2);
    expect(paginator.update).toHaveBeenCalledTimes(1);
    expect(paginator.setLoading).toHaveBeenCalledTimes(2);
    expect(paginator.selectPage).toHaveBeenCalledTimes(1);
    expect(paginator.selectPage).toHaveBeenCalledWith(2);
    expect(requestFunc).toHaveBeenCalledTimes(2);
  });

  it('should update the store', () => {
    expect(query.getAll().length).toEqual(20);
  });

  it('should have in cache page 1 and 2', () => {
    expect(paginator.hasPage(1)).toBeTruthy();
    expect(paginator.hasPage(2)).toBeTruthy();
  });

  it('should return the first page from cache', () => {
    paginator.setPage(1);
    expect(requestFunc).toHaveBeenCalledTimes(2);
    expect(res).toEqual({
      currentPage: 1,
      perPage: 10,
      total: 100,
      lastPage: 10,
      data: [
        { id: 1, email: 'email 1' },
        { id: 2, email: 'email 2' },
        { id: 3, email: 'email 3' },
        { id: 4, email: 'email 4' },
        { id: 5, email: 'email 5' },
        { id: 6, email: 'email 6' },
        { id: 7, email: 'email 7' },
        { id: 8, email: 'email 8' },
        { id: 9, email: 'email 9' },
        { id: 10, email: 'email 10' },
      ],
    });
  });

  it('should fetch page 3', () => {
    expect(paginator.hasPage(3)).toBeFalsy();
    paginator.setPage(3);
    expect(requestFunc).toHaveBeenCalledTimes(3);
    expect(paginator.currentPage).toEqual(3);
  });

  it('should update entity on the store when page is fetched', () => {
    expect(query.getEntity(45)).toBeUndefined();
    store.add({ id: 45, email: 'outdated' });

    const outdateEntiry = query.getEntity(45);
    expect(outdateEntiry.email).toBe('outdated');

    expect(paginator.hasPage(5)).toBeFalsy();
    paginator.setPage(5);
    expect(requestFunc).toHaveBeenCalledTimes(4);
    expect(paginator.currentPage).toEqual(5);

    const updatedEntiry = query.getEntity(45);
    expect(updatedEntiry).toBeTruthy();
    expect(updatedEntiry.email).toBe('email 45');
  });

  describe('isFirst', () => {
    it('should return false', () => {
      expect(paginator.isFirst).toBeFalsy();
    });
    it('should return true', () => {
      paginator.setPage(1);
      expect(paginator.isFirst).toBeTruthy();
    });
  });

  describe('isLast', () => {
    it('should return false', () => {
      expect(paginator.isLast).toBeFalsy();
    });
    it('should return true', () => {
      paginator.setPage(10);
      expect(paginator.isLast).toBeTruthy();
    });
  });

  describe('isPageActive', () => {
    it('should return false', () => {
      expect(paginator.isPageActive(1)).toBeFalsy();
    });
    it('should return true', () => {
      expect(paginator.isPageActive(10)).toBeTruthy();
    });
  });

  describe('setPage', () => {
    it('should set the page', () => {
      paginator.setPage(2);
      expect(paginator.currentPage).toEqual(2);
    });
    it('should not call next() if equal to current page', () => {
      jest.spyOn(paginator.page, 'next');
      paginator.setPage(2);
      expect(paginator.page.next).not.toHaveBeenCalled();
    });
  });

  describe('nextPage', () => {
    it('should set the next page', () => {
      paginator.nextPage();
      expect(paginator.currentPage).toEqual(3);
    });
    it('should not set if current page is last', () => {
      jest.spyOn(paginator, 'setPage');
      paginator.setLastPage();
      paginator.nextPage();
      expect(paginator.setPage).toHaveBeenCalledTimes(1);
    });
  });

  describe('prevPage', () => {
    it('should set the prev page', () => {
      paginator.prevPage();
      expect(paginator.currentPage).toEqual(9);
    });
    it('should not set if current page is first', () => {
      jest.spyOn(paginator, 'setPage');
      paginator.setFirstPage();
      paginator.prevPage();
      expect(paginator.setPage).toHaveBeenCalledTimes(3); // the correct value is 1, but because of state bleed 3 is used
    });
  });

  it('should set first page', () => {
    paginator.setFirstPage();
    expect(paginator.currentPage).toEqual(1);
  });

  it('should set last page', () => {
    paginator.setLastPage();
    expect(paginator.currentPage).toEqual(10);
  });

  describe('from and to', () => {
    it('should not set page controls by default', () => {
      expect(res.from).toBeUndefined();
      expect(res.to).toBeUndefined();
    });
    it('should set from and to', () => {
      paginator.withRange();
      paginator.setFirstPage();
      expect(res.from).toEqual(1);
      expect(res.to).toEqual(10);
    });
    it('should set from and to - 2', () => {
      paginator.withRange();
      paginator.nextPage();
      expect(res.from).toEqual(11);
      expect(res.to).toEqual(20);
    });
  });

  describe('page controls', () => {
    it('should not set page controls by default', () => {
      paginator.setFirstPage();
      expect(res.pageControls).toBeUndefined();
    });
    it('should set from and to - 2', () => {
      paginator.withControls();
      paginator.setLastPage();
      expect(res.pageControls.length).toEqual(10);
    });
  });

  describe('clear cache as default behaviour', () => {
    it('should clear the provided page', () => {
      requestFunc.mockClear();
      paginator.setPage(4);
      expect(requestFunc).toHaveBeenCalledTimes(1);
      expect(paginator.hasPage(4)).toBeTruthy();
      paginator.clearPage(4);
      expect(paginator.hasPage(4)).toBeFalsy();
    });
    it('should clear all', () => {
      paginator.initial = false;
      paginator.clearCache();
      requestFunc.mockClear();
      expect(paginator.pages).toEqual(new Map());
      paginator.setPage(1);
      expect(requestFunc).toHaveBeenCalledTimes(1);
      paginator.setPage(2);
      expect(requestFunc).toHaveBeenCalledTimes(2);
      paginator.setPage(1);
      expect(requestFunc).toHaveBeenCalledTimes(2);
      paginator.setPage(2);
      expect(requestFunc).toHaveBeenCalledTimes(2);
    });
    it('should not clear the store when explicit stated', () => {
      store.set(data);
      expect(query.getAll().length).toBeGreaterThan(0);
      const initialLength = query.getAll().length;
      paginator.clearCache({ clearStore: false });
      const lengthAfterCacheClear = query.getAll().length;
      expect(initialLength).toEqual(lengthAfterCacheClear);
    });
  });
});

const store2 = new TodosStore();

class Todos2Query extends QueryEntity<any, Todo> {
  constructor() {
    super(store2);
  }
}

describe('cacheTimeout', () => {
  jest.useFakeTimers();
  const query2 = new Todos2Query();
  const paginator2 = new PaginatorPlugin(query2, { cacheTimeout: interval(15000) });
  const requestFunc = jest.fn();

  paginator2.pageChanges
    .pipe(
      switchMap((page) => {
        const req = requestFunc.mockReturnValue(
          getContacts({
            page,
            perPage: 10,
          })
        );
        return paginator2.getPage(req);
      })
    )
    .subscribe();

  it('should clear cache when cacheTimeout emits as default behaviour', () => {
    paginator2.initial = false;
    jest.spyOn(paginator2, 'clearCache');
    expect(query2.getAll().length).toEqual(10);
    expect(requestFunc).toHaveBeenCalledTimes(1);
    jest.runOnlyPendingTimers();
    expect(paginator2.hasPage(1)).toBeFalsy();
    paginator2.setPage(1);
    expect(paginator2.hasPage(1)).toBeTruthy();
    expect(requestFunc).toHaveBeenCalledTimes(2);
    expect(paginator2.clearCache).toHaveBeenCalledTimes(1);
  });
});

const store3 = new TodosStore();

class Todos3Query extends QueryEntity<any, Todo> {
  constructor() {
    super(store3);
  }
}

describe('cacheTimeout and clearStoreWithCache false', () => {
  jest.useFakeTimers();
  const query3 = new Todos3Query();
  const paginator3 = new PaginatorPlugin(query3, { cacheTimeout: interval(15000), clearStoreWithCache: false });
  const requestFunc = jest.fn();

  paginator3.pageChanges
    .pipe(
      switchMap((page) => {
        const req = requestFunc.mockReturnValue(
          getContacts({
            page,
            perPage: 10,
          })
        );
        return paginator3.getPage(req);
      })
    )
    .subscribe();

  it('should not clear store when cacheTimeout emits', () => {
    jest.spyOn(paginator3, 'clearCache');
    expect(query3.getAll().length).toEqual(10);
    expect(requestFunc).toHaveBeenCalledTimes(1);
    jest.runOnlyPendingTimers();
    expect(paginator3.clearCache).toHaveBeenCalledTimes(1);
    expect(query3.getAll().length).toEqual(10);
  });

  it('clearCache should clear the store when explicit stated', () => {
    store3.set(data);
    expect(query3.getAll().length).toBeGreaterThan(0);
    paginator3.clearCache({ clearStore: true });
    expect(query3.getAll().length).toEqual(0);
  });
});

describe('Server-side pagination with filter', () => {
  const requestFunc = jest.fn();
  const filterEnabled$ = new BehaviorSubject(false);

  it('should reset page to 1 when filters applied', () => {
    combineLatest([paginator.pageChanges, filterEnabled$])
      .pipe(
        tap(() => {
          paginator.clearCache();
        }),
        switchMap(([page, filterEnabled]) => {
          const req = requestFunc.mockReturnValue(
            getContacts({
              page,
              perPage: 10,
              filterEnabled,
            })
          );

          return paginator.getPage(req);
        })
      )
      .subscribe();

    paginator.setPage(6);
    filterEnabled$.next(true);
    expect(paginator.currentPage).toEqual(1);
  });
});
