/* eslint-disable jest/valid-title */
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { NgEntityServiceNotifier } from './ng-entity-service-notifier';
import { defaultConfig, NgEntityServiceGlobalConfig, NG_ENTITY_SERVICE_CONFIG } from './ng-entity-service.config';
import { NgEntityServiceLoader } from './ng-entity-service.loader';
import {
  storeName,
  TestEntity,
  TestService,
  TestServiceWithDecoratorAndInlineConfig,
  TestServiceWithDecoratorConfig,
  TestServiceWithInlineConfig,
  TestServiceWithMixedConfig,
  TestStore,
} from './setup';
import { HttpMethod } from './types';

describe('NgEntityService', () => {
  describe('should merge config in order...', () => {
    describe(undefined, () => {
      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            TestStore,
            TestService,
            {
              provide: NG_ENTITY_SERVICE_CONFIG,
              useValue: {} as NgEntityServiceGlobalConfig,
            },
          ],
          imports: [HttpClientTestingModule],
        });
      });

      it('should have default config when no config given', inject([TestService], (service: TestService) => {
        const config = service.getConfig();
        expect(config).toEqual(defaultConfig);
      }));
    });

    describe(undefined, () => {
      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            TestStore,
            TestService,
            {
              provide: NG_ENTITY_SERVICE_CONFIG,
              useValue: {
                baseUrl: 'base-url',
                httpMethods: {
                  PUT: HttpMethod.PATCH,
                },
              } as NgEntityServiceGlobalConfig,
            },
          ],
          imports: [HttpClientTestingModule],
        });
      });

      it('default --> global', inject([TestService], (service: TestService) => {
        const config = service.getConfig();
        expect(config).toEqual({
          baseUrl: 'base-url',
          httpMethods: {
            GET: HttpMethod.GET,
            POST: HttpMethod.POST,
            PATCH: HttpMethod.PATCH,
            PUT: HttpMethod.PATCH,
            DELETE: HttpMethod.DELETE,
          },
        });
      }));
    });

    describe(undefined, () => {
      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            TestStore,
            TestServiceWithDecoratorConfig,
            {
              provide: NG_ENTITY_SERVICE_CONFIG,
              useValue: {
                baseUrl: 'base-url',
                httpMethods: {
                  PUT: HttpMethod.PATCH,
                },
              } as NgEntityServiceGlobalConfig,
            },
          ],
          imports: [HttpClientTestingModule],
        });
      });

      it('default --> global --> decorator', inject([TestServiceWithDecoratorConfig], (service: TestServiceWithDecoratorConfig) => {
        const config = service.getConfig();
        expect(config).toEqual({
          baseUrl: 'decorator-url',
          httpMethods: {
            GET: HttpMethod.GET,
            POST: HttpMethod.POST,
            PATCH: HttpMethod.PATCH,
            PUT: HttpMethod.PATCH,
            DELETE: HttpMethod.DELETE,
          },
          resourceName: 'decorator-res',
        });
      }));
    });

    describe(undefined, () => {
      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            TestStore,
            TestServiceWithDecoratorAndInlineConfig,
            {
              provide: NG_ENTITY_SERVICE_CONFIG,
              useValue: {
                baseUrl: 'base-url',
                httpMethods: {
                  PUT: HttpMethod.PATCH,
                },
              } as NgEntityServiceGlobalConfig,
            },
          ],
          imports: [HttpClientTestingModule],
        });
      });

      it('default --> global --> decorator --> inline', inject([TestServiceWithDecoratorAndInlineConfig], (service: TestServiceWithDecoratorAndInlineConfig) => {
        const config = service.getConfig();
        expect(config).toEqual({
          baseUrl: 'inline-url',
          httpMethods: {
            GET: HttpMethod.GET,
            POST: HttpMethod.POST,
            PATCH: HttpMethod.PATCH,
            PUT: HttpMethod.PATCH,
            DELETE: HttpMethod.DELETE,
          },
          resourceName: 'inline-res',
        });
      }));
    });

    describe(undefined, () => {
      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            TestStore,
            TestServiceWithInlineConfig,
            {
              provide: NG_ENTITY_SERVICE_CONFIG,
              useValue: {
                baseUrl: 'base-url',
              } as NgEntityServiceGlobalConfig,
            },
          ],
          imports: [HttpClientTestingModule],
        });
      });

      it('default --> global --> undefined --> inline', inject([TestServiceWithInlineConfig], (service: TestServiceWithInlineConfig) => {
        const config = service.getConfig();
        expect(config).toEqual({
          baseUrl: 'inline-url',
          httpMethods: {
            GET: HttpMethod.GET,
            POST: HttpMethod.POST,
            PATCH: HttpMethod.PATCH,
            PUT: HttpMethod.PUT,
            DELETE: HttpMethod.DELETE,
          },
          resourceName: 'inline-res',
        });
      }));
    });

    describe(undefined, () => {
      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            TestStore,
            TestServiceWithMixedConfig,
            {
              provide: NG_ENTITY_SERVICE_CONFIG,
              useValue: {
                baseUrl: 'base-url',
                httpMethods: {
                  GET: HttpMethod.POST,
                },
              } as NgEntityServiceGlobalConfig,
            },
          ],
          imports: [HttpClientTestingModule],
        });
      });

      it('default --> global --> decorator:baseUrl --> inline:resourceName', inject([TestServiceWithMixedConfig], (service: TestServiceWithMixedConfig) => {
        const config = service.getConfig();
        expect(config).toEqual({
          baseUrl: 'decorator-url',
          httpMethods: {
            GET: HttpMethod.POST,
            POST: HttpMethod.POST,
            PATCH: HttpMethod.PATCH,
            PUT: HttpMethod.PUT,
            DELETE: HttpMethod.DELETE,
          },
          resourceName: 'inline-res',
        });
      }));
    });
  });

  describe('resourceName', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          TestStore,
          TestService,
          TestServiceWithDecoratorConfig,
          {
            provide: NG_ENTITY_SERVICE_CONFIG,
            useValue: { baseUrl: 'base-url' } as NgEntityServiceGlobalConfig,
          },
        ],
        imports: [HttpClientTestingModule],
      });
    });

    it("should be the store name when resourceName isn't configured", inject([TestService], (service: TestService) => {
      expect(service.resourceName).toEqual(storeName);
    }));

    it('should be the configured resourceName', inject([TestServiceWithDecoratorConfig], (service: TestServiceWithDecoratorConfig) => {
      expect(service.resourceName).toEqual('decorator-res');
    }));
  });

  describe('api', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          TestStore,
          TestService,
          TestServiceWithDecoratorConfig,
          {
            provide: NG_ENTITY_SERVICE_CONFIG,
            useValue: { baseUrl: 'base-url' } as NgEntityServiceGlobalConfig,
          },
        ],
        imports: [HttpClientTestingModule],
      });
    });

    it("should be the configured baseUrl/storeName when resourceName isn't configured", inject([TestService], (service: TestService) => {
      expect(service.api).toEqual('base-url/test-store');
    }));

    it('should be the configured baseUrl/resourceName', inject([TestServiceWithDecoratorConfig], (service: TestServiceWithDecoratorConfig) => {
      expect(service.api).toEqual('decorator-url/decorator-res');
    }));

    it('should throw when no baseUrl is configured', inject([TestService], (service: TestService) => {
      // eslint-disable-next-line no-param-reassign
      service.baseUrl = undefined;
      expect(() => service.api).toThrowError();
    }));
  });

  describe('get', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          TestStore,
          TestServiceWithInlineConfig,
          {
            provide: NG_ENTITY_SERVICE_CONFIG,
            useValue: {} as NgEntityServiceGlobalConfig,
          },
        ],
        imports: [HttpClientTestingModule],
      });
    });

    it('should dispatch loader event when called', inject([TestServiceWithInlineConfig, NgEntityServiceLoader], (service: TestServiceWithInlineConfig, loader: NgEntityServiceLoader) => {
      jest.spyOn(loader, 'dispatch');
      service.get();
      expect(loader.dispatch).toHaveBeenCalled();
    }));

    it('should dispatch loading event when called', inject([TestServiceWithInlineConfig, NgEntityServiceLoader], (service: TestServiceWithInlineConfig, loader: NgEntityServiceLoader) => {
      jest.spyOn(loader, 'dispatch');
      service.get();
      expect(loader.dispatch).toHaveBeenCalledWith({
        method: HttpMethod.GET,
        loading: true,
        entityId: undefined,
        storeName: storeName,
      });
    }));

    it('should dispatch loading event with entity id when called with id', inject(
      [TestServiceWithInlineConfig, NgEntityServiceLoader],
      (service: TestServiceWithInlineConfig, loader: NgEntityServiceLoader) => {
        jest.spyOn(loader, 'dispatch');
        const entityId = 123;
        service.get(entityId);
        expect(loader.dispatch).toHaveBeenCalledWith({
          method: HttpMethod.GET,
          loading: true,
          entityId,
          storeName: storeName,
        });
      }
    ));

    it('should update/create entity in store when called with id', inject(
      [TestServiceWithInlineConfig, TestStore, HttpTestingController],
      (service: TestServiceWithInlineConfig, store: TestStore, httpMock: HttpTestingController) => {
        jest.spyOn(store, 'upsert');
        const entityId = 123;
        const dummyData = {
          id: entityId,
          foo: 'bar',
        };
        service.get(entityId).subscribe(() => {
          expect(store.upsert).toHaveBeenCalledWith(entityId, dummyData);
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush(dummyData);
      }
    ));

    it('should not write to the store when called with id and skipWrite config', inject(
      [TestServiceWithInlineConfig, TestStore, HttpTestingController],
      (service: TestServiceWithInlineConfig, store: TestStore, httpMock: HttpTestingController) => {
        jest.spyOn(store, 'upsert');
        jest.spyOn(store, 'upsertMany');
        jest.spyOn(store, 'add');
        jest.spyOn(store, 'set');
        jest.spyOn(store, 'replace');
        const entityId = 123;
        const dummyData = { id: entityId, foo: 'bar' };
        service.get(entityId, { skipWrite: true }).subscribe(() => {
          expect(store.upsert).toHaveBeenCalledTimes(0);
          expect(store.upsertMany).toHaveBeenCalledTimes(0);
          expect(store.add).toHaveBeenCalledTimes(0);
          expect(store.set).toHaveBeenCalledTimes(0);
          expect(store.replace).toHaveBeenCalledTimes(0);
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush(dummyData);
      }
    ));

    it('should set entities in store when called', inject(
      [TestServiceWithInlineConfig, TestStore, HttpTestingController],
      (service: TestServiceWithInlineConfig, store: TestStore, httpMock: HttpTestingController) => {
        jest.spyOn(store, 'set');
        const dummyData = [
          { id: 1, foo: 'bar' },
          { id: 2, foo: 'baz' },
        ];
        service.get().subscribe(() => {
          expect(store.set).toHaveBeenCalledWith(dummyData);
        });

        const req = httpMock.expectOne(service.api);
        req.flush(dummyData);
      }
    ));

    it('should add entities in store when called with append config', inject(
      [TestServiceWithInlineConfig, TestStore, HttpTestingController],
      (service: TestServiceWithInlineConfig, store: TestStore, httpMock: HttpTestingController) => {
        jest.spyOn(store, 'add');
        const dummyData = [
          { id: 1, foo: 'bar' },
          { id: 2, foo: 'baz' },
        ];
        service.get({ append: true }).subscribe(() => {
          expect(store.add).toHaveBeenCalledWith(dummyData);
        });

        const req = httpMock.expectOne(service.api);
        req.flush(dummyData);
      }
    ));

    it('should upsertMany entities in store when called with upsert config', inject(
      [TestServiceWithInlineConfig, TestStore, HttpTestingController],
      (service: TestServiceWithInlineConfig, store: TestStore, httpMock: HttpTestingController) => {
        jest.spyOn(store, 'upsertMany');
        const dummyData = [
          { id: 1, foo: 'bar' },
          { id: 2, foo: 'baz' },
        ];
        service.get({ upsert: true }).subscribe(() => {
          expect(store.upsertMany).toHaveBeenCalledWith(dummyData);
        });

        const req = httpMock.expectOne(service.api);
        req.flush(dummyData);
      }
    ));

    it('should not write to the store when called with skipWrite config', inject(
      [TestServiceWithInlineConfig, TestStore, HttpTestingController],
      (service: TestServiceWithInlineConfig, store: TestStore, httpMock: HttpTestingController) => {
        jest.spyOn(store, 'upsert');
        jest.spyOn(store, 'upsertMany');
        jest.spyOn(store, 'add');
        jest.spyOn(store, 'set');
        jest.spyOn(store, 'replace');
        const dummyData = [
          { id: 1, foo: 'bar' },
          { id: 2, foo: 'baz' },
        ];
        service.get({ skipWrite: true }).subscribe(() => {
          expect(store.upsert).toHaveBeenCalledTimes(0);
          expect(store.upsertMany).toHaveBeenCalledTimes(0);
          expect(store.add).toHaveBeenCalledTimes(0);
          expect(store.set).toHaveBeenCalledTimes(0);
          expect(store.replace).toHaveBeenCalledTimes(0);
        });

        const req = httpMock.expectOne(service.api);
        req.flush(dummyData);
      }
    ));

    it('should return result from request', inject([TestServiceWithInlineConfig, HttpTestingController], (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
      const dummyData = [
        { id: 1, foo: 'bar' },
        { id: 2, foo: 'baz' },
      ];
      service.get().subscribe((result) => {
        expect(result).toEqual(dummyData);
      });

      const req = httpMock.expectOne(service.api);
      req.flush(dummyData);
    }));

    it('should transform returned result from request when called with mapResponseFn config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const dummyData = [
          { id: 1, foo: 'bar' },
          { id: 2, foo: 'baz' },
        ];
        service.get({ mapResponseFn: (res) => res.map((x) => ({ entityId: x.id, test: x.foo })) }).subscribe((result) => {
          expect(result).toEqual([
            { entityId: 1, test: 'bar' },
            { entityId: 2, test: 'baz' },
          ]);
        });

        const req = httpMock.expectOne(service.api);
        req.flush(dummyData);
      }
    ));

    it('should override request URL when called with url config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const dummyUrl = 'test-url';
        service.get({ url: dummyUrl }).subscribe();

        const req = httpMock.expectOne(dummyUrl);
        req.flush([]);

        expect(() => {
          httpMock.verify();
        }).not.toThrow();
      }
    ));

    it('should override request URL when called with id and url config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const dummyUrl = 'test-url';
        service.get(123, { url: dummyUrl }).subscribe();

        const req = httpMock.expectOne(dummyUrl);
        req.flush([]);

        expect(() => {
          httpMock.verify();
        }).not.toThrow();
      }
    ));

    it('should add headers to request when called with header config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        service.get({ headers: { 'x-foo': 'foo', 'x-bar': 'bar' } }).subscribe();

        const req = httpMock.expectOne(service.api);
        expect(req.request.headers.get('x-foo')).toEqual('foo');
        expect(req.request.headers.get('x-bar')).toEqual('bar');
        req.flush([]);
      }
    ));

    it('should add headers to request when called with id and header config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const entityId = 123;
        service.get(entityId, { headers: { 'x-foo': 'foo', 'x-bar': 'bar' } }).subscribe();

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        expect(req.request.headers.get('x-foo')).toEqual('foo');
        expect(req.request.headers.get('x-bar')).toEqual('bar');
        req.flush([]);
      }
    ));

    it('should add URL parameters to request when called with params config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        service.get({ params: { foo: 'foo', bar: 'bar' } }).subscribe();

        const req = httpMock.expectOne((x) => x.url === service.api);
        expect(req.request.params.get('foo')).toEqual('foo');
        expect(req.request.params.get('bar')).toEqual('bar');
        req.flush([]);
      }
    ));

    it('should add URL parameters to request when called with id and params config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const entityId = 123;
        service.get(entityId, { params: { foo: 'foo', bar: 'bar' } }).subscribe();

        const req = httpMock.expectOne((x) => x.url === `${service.api}/${entityId}`);
        expect(req.request.params.get('foo')).toEqual('foo');
        expect(req.request.params.get('bar')).toEqual('bar');
        req.flush([]);
      }
    ));

    it('should add URL postfix to request URL when called with urlPostfix config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const urlPostfix = 'foo/3/bar/3';
        const expectedUrl = `${service.api}/${urlPostfix}`;
        service.get({ urlPostfix }).subscribe();
        const req = httpMock.expectOne((x) => x.url === expectedUrl);
        expect(req.request.url).toBe(expectedUrl);
        req.flush([]);
      }
    ));

    it('should add URL postfix to request URL when called with id and urlPostfix config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const entityId = 1;
        const urlPostfix = 'foo/3/bar/3';
        const expectedUrl = `${service.api}/${entityId}/${urlPostfix}`;
        service.get(entityId, { urlPostfix }).subscribe();
        const req = httpMock.expectOne((x) => x.url === expectedUrl);
        expect(req.request.url).toBe(expectedUrl);
        req.flush([]);
      }
    ));

    it('should dispatch success notice when request is successfully recieved', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        const dummyData = [
          { id: 1, foo: 'bar' },
          { id: 2, foo: 'baz' },
        ];
        service.get().subscribe(() => {
          expect(notifier.dispatch).toHaveBeenCalledWith({
            storeName,
            type: 'success',
            payload: dummyData,
            method: HttpMethod.GET,
            successMsg: undefined,
          });
        });

        const req = httpMock.expectOne(service.api);
        req.flush(dummyData);
      }
    ));

    it('should dispatch success notice with configured success message when successMsg is configured and request is successfully recieved', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        const dummyData = [
          { id: 1, foo: 'bar' },
          { id: 2, foo: 'baz' },
        ];
        const successMsg = 'Success test message...';
        service.get({ successMsg }).subscribe(() => {
          expect(notifier.dispatch).toHaveBeenCalledWith({
            storeName,
            type: 'success',
            payload: dummyData,
            method: HttpMethod.GET,
            successMsg,
          });
        });

        const req = httpMock.expectOne(service.api);
        req.flush(dummyData);
      }
    ));

    it('should dispatch error notice when request gives an error', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        service.get().subscribe({
          error: () =>
            expect(notifier.dispatch).toHaveBeenCalledWith(
              expect.objectContaining({
                storeName,
                type: 'error',
                method: HttpMethod.GET,
                errorMsg: undefined,
              })
            ),
        });

        const req = httpMock.expectOne(service.api);
        req.flush([], { status: 500, statusText: '🧨😨💥' });
      }
    ));

    it('should dispatch error notice with configured error message when errorMsg is configured and request gives an error', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        const errorMsg = 'Error test message...';
        service.get({ errorMsg }).subscribe({
          error: () =>
            expect(notifier.dispatch).toHaveBeenCalledWith(
              expect.objectContaining({
                storeName,
                type: 'error',
                method: HttpMethod.GET,
                errorMsg,
              })
            ),
        });

        const req = httpMock.expectOne(service.api);
        req.flush([], { status: 500, statusText: '🧨😨💥' });
      }
    ));

    it('should dispatch stop loading event when request is complete', fakeAsync(
      inject([TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceLoader], (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, loader: NgEntityServiceLoader) => {
        const spy = jest.spyOn(loader, 'dispatch');
        service.get().subscribe();

        const req = httpMock.expectOne(service.api);
        req.flush([]);
        tick(); // needed for the finalize pipe operator to run
        expect(spy.mock.calls[spy.mock.calls.length - 1]).toEqual([
          {
            storeName,
            loading: false,
            entityId: undefined,
            method: HttpMethod.GET,
          },
        ]);
      })
    ));

    it('should dispatch stop loading event with entity id when called with id', fakeAsync(
      inject([TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceLoader], (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, loader: NgEntityServiceLoader) => {
        const spy = jest.spyOn(loader, 'dispatch');
        const entityId = 123;
        service.get(entityId).subscribe();

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush([]);
        tick(); // needed for the finalize pipe operator to run
        expect(spy.mock.calls[spy.mock.calls.length - 1]).toEqual([
          {
            storeName,
            loading: false,
            entityId,
            method: HttpMethod.GET,
          },
        ]);
      })
    ));
  });

  describe('add', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          TestStore,
          TestServiceWithInlineConfig,
          {
            provide: NG_ENTITY_SERVICE_CONFIG,
            useValue: {} as NgEntityServiceGlobalConfig,
          },
        ],
        imports: [HttpClientTestingModule],
      });
    });

    it('should dispatch loader event when called', inject([TestServiceWithInlineConfig, NgEntityServiceLoader], (service: TestServiceWithInlineConfig, loader: NgEntityServiceLoader) => {
      jest.spyOn(loader, 'dispatch');
      const dummyEntity: TestEntity = { id: 1, foo: 'foo', bar: 123 };
      service.add(dummyEntity);
      expect(loader.dispatch).toHaveBeenCalled();
    }));

    it('should dispatch loading event when called', inject([TestServiceWithInlineConfig, NgEntityServiceLoader], (service: TestServiceWithInlineConfig, loader: NgEntityServiceLoader) => {
      jest.spyOn(loader, 'dispatch');
      const dummyEntity: TestEntity = { id: 1, foo: 'foo', bar: 123 };
      service.add(dummyEntity);
      expect(loader.dispatch).toHaveBeenCalledWith({
        method: HttpMethod.POST,
        loading: true,
        storeName: storeName,
      });
    }));

    it('should not write to the store when called with skipWrite config', inject(
      [TestServiceWithInlineConfig, TestStore, HttpTestingController],
      (service: TestServiceWithInlineConfig, store: TestStore, httpMock: HttpTestingController) => {
        jest.spyOn(store, 'upsert');
        jest.spyOn(store, 'upsertMany');
        jest.spyOn(store, 'add');
        jest.spyOn(store, 'set');
        jest.spyOn(store, 'replace');
        const dummyEntity: TestEntity = { id: 1, foo: 'foo', bar: 123 };
        service.add(dummyEntity, { skipWrite: true }).subscribe(() => {
          expect(store.upsert).toHaveBeenCalledTimes(0);
          expect(store.upsertMany).toHaveBeenCalledTimes(0);
          expect(store.add).toHaveBeenCalledTimes(0);
          expect(store.set).toHaveBeenCalledTimes(0);
          expect(store.replace).toHaveBeenCalledTimes(0);
        });

        const req = httpMock.expectOne(service.api);
        req.flush(dummyEntity);
      }
    ));

    it('should add response entity in store when called', inject(
      [TestServiceWithInlineConfig, TestStore, HttpTestingController],
      (service: TestServiceWithInlineConfig, store: TestStore, httpMock: HttpTestingController) => {
        jest.spyOn(store, 'add');
        const dummyEntity: TestEntity = { id: 1, foo: 'foo', bar: 123 };
        service.add(dummyEntity).subscribe(() => {
          expect(store.add).toHaveBeenCalledWith(dummyEntity, undefined);
        });

        const req = httpMock.expectOne(service.api);
        req.flush(dummyEntity);
      }
    ));

    it('should return result from request', inject([TestServiceWithInlineConfig, HttpTestingController], (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
      const dummyEntity: TestEntity = { id: 1, foo: 'foo', bar: 123 };
      service.add(dummyEntity).subscribe((result) => {
        expect(result).toEqual(dummyEntity);
      });

      const req = httpMock.expectOne(service.api);
      req.flush(dummyEntity);
    }));

    it('should transform returned result from request when called with mapResponseFn config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const dummyEntity: TestEntity = { id: 1, foo: 'foo', bar: 123 };
        service.add(dummyEntity, { mapResponseFn: (x) => ({ entityId: x.id, test: x.foo }) }).subscribe((result) => {
          expect(result).toEqual({ entityId: 1, test: 'foo' });
        });

        const req = httpMock.expectOne(service.api);
        req.flush(dummyEntity);
      }
    ));

    it('should override request URL when called with url config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const dummyUrl = 'test-url';
        const dummyEntity: TestEntity = { id: 1, foo: 'foo', bar: 123 };
        service.add(dummyEntity, { url: dummyUrl }).subscribe();

        const req = httpMock.expectOne(dummyUrl);
        req.flush([]);

        expect(() => {
          httpMock.verify();
        }).not.toThrow();
      }
    ));

    it('should add headers to request when called with header config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const dummyEntity: TestEntity = { id: 1, foo: 'foo', bar: 123 };
        service.add(dummyEntity, { headers: { 'x-foo': 'foo', 'x-bar': 'bar' } }).subscribe();

        const req = httpMock.expectOne(service.api);
        expect(req.request.headers.get('x-foo')).toEqual('foo');
        expect(req.request.headers.get('x-bar')).toEqual('bar');
        req.flush([]);
      }
    ));

    it('should add URL parameters to request when called with params config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const dummyEntity: TestEntity = { id: 1, foo: 'foo', bar: 123 };
        service.add(dummyEntity, { params: { foo: 'foo', bar: 'bar' } }).subscribe();

        const req = httpMock.expectOne((x) => x.url === service.api);
        expect(req.request.params.get('foo')).toEqual('foo');
        expect(req.request.params.get('bar')).toEqual('bar');
        req.flush([]);
      }
    ));

    it('should add URL postfix to request URL when called with urlPostfix config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const dummyEntity: TestEntity = { id: 1, foo: 'foo', bar: 123 };
        const urlPostfix = 'foo/3/bar/3';
        const expectedUrl = `${service.api}/${urlPostfix}`;
        service.add(dummyEntity, { urlPostfix }).subscribe();
        const req = httpMock.expectOne((x) => x.url === expectedUrl);
        expect(req.request.url).toBe(expectedUrl);
        req.flush([]);
      }
    ));

    it('should dispatch success notice when request is successful', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        const dummyEntity: TestEntity = { id: 1, foo: 'foo', bar: 123 };
        service.add(dummyEntity).subscribe(() => {
          expect(notifier.dispatch).toHaveBeenCalledWith({
            storeName,
            type: 'success',
            payload: dummyEntity,
            method: HttpMethod.POST,
            successMsg: undefined,
          });
        });

        const req = httpMock.expectOne(service.api);
        req.flush(dummyEntity);
      }
    ));

    it('should dispatch success notice with configured success message when successMsg is configured and request is successful', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        const successMsg = 'Success test message...';
        const dummyEntity: TestEntity = { id: 1, foo: 'foo', bar: 123 };
        service.add(dummyEntity, { successMsg }).subscribe(() => {
          expect(notifier.dispatch).toHaveBeenCalledWith({
            storeName,
            type: 'success',
            payload: dummyEntity,
            method: HttpMethod.POST,
            successMsg,
          });
        });

        const req = httpMock.expectOne(service.api);
        req.flush(dummyEntity);
      }
    ));

    it('should dispatch error notice when request gives an error', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        const dummyEntity: TestEntity = { id: 1, foo: 'foo', bar: 123 };
        service.add(dummyEntity).subscribe({
          error: () =>
            expect(notifier.dispatch).toHaveBeenCalledWith(
              expect.objectContaining({
                storeName,
                type: 'error',
                method: HttpMethod.POST,
                errorMsg: undefined,
              })
            ),
        });

        const req = httpMock.expectOne(service.api);
        req.flush([], { status: 500, statusText: '🧨😨💥' });
      }
    ));

    it('should dispatch error notice with configured error message when errorMsg is configured and request gives an error', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        const errorMsg = 'Error test message...';
        const dummyEntity: TestEntity = { id: 1, foo: 'foo', bar: 123 };
        service.add(dummyEntity, { errorMsg }).subscribe({
          error: () =>
            expect(notifier.dispatch).toHaveBeenCalledWith(
              expect.objectContaining({
                storeName,
                type: 'error',
                method: HttpMethod.POST,
                errorMsg,
              })
            ),
        });

        const req = httpMock.expectOne(service.api);
        req.flush([], { status: 500, statusText: '🧨😨💥' });
      }
    ));

    it('should dispatch stop loading event when request is complete', fakeAsync(
      inject([TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceLoader], (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, loader: NgEntityServiceLoader) => {
        const spy = jest.spyOn(loader, 'dispatch');
        const dummyEntity: TestEntity = { id: 1, foo: 'foo', bar: 123 };
        service.add(dummyEntity).subscribe();

        const req = httpMock.expectOne(service.api);
        req.flush([]);
        tick(); // needed for the finalize pipe operator to run
        expect(spy.mock.calls[spy.mock.calls.length - 1]).toEqual([
          {
            storeName,
            loading: false,
            method: HttpMethod.POST,
          },
        ]);
      })
    ));
  });

  describe('update', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          TestStore,
          TestServiceWithInlineConfig,
          {
            provide: NG_ENTITY_SERVICE_CONFIG,
            useValue: {} as NgEntityServiceGlobalConfig,
          },
        ],
        imports: [HttpClientTestingModule],
      });
    });

    it('should dispatch loader event when called', inject([TestServiceWithInlineConfig, NgEntityServiceLoader], (service: TestServiceWithInlineConfig, loader: NgEntityServiceLoader) => {
      jest.spyOn(loader, 'dispatch');
      const entityId = 1;
      const dummyEntity: Partial<TestEntity> = { foo: 'foo', bar: 123 };
      service.update(entityId, dummyEntity);
      expect(loader.dispatch).toHaveBeenCalled();
    }));

    it('should dispatch loading event when called', inject([TestServiceWithInlineConfig, NgEntityServiceLoader], (service: TestServiceWithInlineConfig, loader: NgEntityServiceLoader) => {
      jest.spyOn(loader, 'dispatch');
      const entityId = 1;
      const dummyEntity: Partial<TestEntity> = { foo: 'foo', bar: 123 };
      service.update(entityId, dummyEntity);
      expect(loader.dispatch).toHaveBeenCalledWith({
        method: HttpMethod.PUT,
        loading: true,
        entityId,
        storeName: storeName,
      });
    }));

    it('should not write to the store when called with skipWrite config', inject(
      [TestServiceWithInlineConfig, TestStore, HttpTestingController],
      (service: TestServiceWithInlineConfig, store: TestStore, httpMock: HttpTestingController) => {
        jest.spyOn(store, 'update');
        jest.spyOn(store, 'replace');
        const entityId = 1;
        const dummyEntity: Partial<TestEntity> = { foo: 'foo', bar: 123 };
        service.update(entityId, dummyEntity, { skipWrite: true }).subscribe(() => {
          expect(store.update).toHaveBeenCalledTimes(0);
          expect(store.replace).toHaveBeenCalledTimes(0);
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush(dummyEntity);
      }
    ));

    it('should update entity in store when called', inject(
      [TestServiceWithInlineConfig, TestStore, HttpTestingController],
      (service: TestServiceWithInlineConfig, store: TestStore, httpMock: HttpTestingController) => {
        jest.spyOn(store, 'update');
        const entityId = 1;
        const dummyEntity: Partial<TestEntity> = { foo: 'foo', bar: 123 };
        service.update(entityId, dummyEntity).subscribe(() => {
          expect(store.update).toHaveBeenCalledWith(entityId, dummyEntity);
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush(dummyEntity);
      }
    ));

    it('should return result from request', inject([TestServiceWithInlineConfig, HttpTestingController], (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
      const entityId = 1;
      const dummyEntity: Partial<TestEntity> = { foo: 'foo', bar: 123 };
      service.update(entityId, dummyEntity).subscribe((result) => {
        expect(result).toEqual(dummyEntity);
      });

      const req = httpMock.expectOne(`${service.api}/${entityId}`);
      req.flush(dummyEntity);
    }));

    it('should transform returned result from request when called with mapResponseFn config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const entityId = 1;
        const dummyEntity: Partial<TestEntity> = { foo: 'foo', bar: 123 };
        service.update(entityId, dummyEntity, { mapResponseFn: (x) => ({ test: x.foo, test2: x.bar }) }).subscribe((result) => {
          expect(result).toEqual({ test: 'foo', test2: 123 });
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush(dummyEntity);
      }
    ));

    it('should override request URL when called with url config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const dummyUrl = 'test-url';
        const entityId = 1;
        const dummyEntity: Partial<TestEntity> = { foo: 'foo', bar: 123 };
        service.update(entityId, dummyEntity, { url: dummyUrl }).subscribe();

        const req = httpMock.expectOne(dummyUrl);
        req.flush([]);

        expect(() => {
          httpMock.verify();
        }).not.toThrow();
      }
    ));

    it('should add headers to request when called with header config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const entityId = 1;
        const dummyEntity: Partial<TestEntity> = { foo: 'foo', bar: 123 };
        service.update(entityId, dummyEntity, { headers: { 'x-foo': 'foo', 'x-bar': 'bar' } }).subscribe();

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        expect(req.request.headers.get('x-foo')).toEqual('foo');
        expect(req.request.headers.get('x-bar')).toEqual('bar');
        req.flush([]);
      }
    ));

    it('should add URL parameters to request when called with params config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const entityId = 1;
        const dummyEntity: Partial<TestEntity> = { foo: 'foo', bar: 123 };
        service.update(entityId, dummyEntity, { params: { foo: 'foo', bar: 'bar' } }).subscribe();

        const req = httpMock.expectOne((x) => x.url === `${service.api}/${entityId}`);
        expect(req.request.params.get('foo')).toEqual('foo');
        expect(req.request.params.get('bar')).toEqual('bar');
        req.flush([]);
      }
    ));

    it('should add URL postfix to request URL when called with urlPostfix config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const entityId = 1;
        const dummyEntity: Partial<TestEntity> = { foo: 'foo', bar: 123 };
        const urlPostfix = 'foo/3/bar/3';
        const expectedUrl = `${service.api}/${entityId}/${urlPostfix}`;
        service.update(entityId, dummyEntity, { urlPostfix }).subscribe();
        const req = httpMock.expectOne((x) => x.url === expectedUrl);
        expect(req.request.url).toBe(expectedUrl);
        req.flush([]);
      }
    ));

    it('should dispatch success notice when request is successful', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        const entityId = 1;
        const dummyEntity: Partial<TestEntity> = { foo: 'foo', bar: 123 };
        service.update(entityId, dummyEntity).subscribe(() => {
          expect(notifier.dispatch).toHaveBeenCalledWith({
            storeName,
            type: 'success',
            payload: dummyEntity,
            method: HttpMethod.PUT,
            successMsg: undefined,
          });
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush(dummyEntity);
      }
    ));

    it('should dispatch success notice with configured success message when successMsg is configured and request is successful', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        const successMsg = 'Success test message...';
        const entityId = 1;
        const dummyEntity: Partial<TestEntity> = { foo: 'foo', bar: 123 };
        service.update(entityId, dummyEntity, { successMsg }).subscribe(() => {
          expect(notifier.dispatch).toHaveBeenCalledWith({
            storeName,
            type: 'success',
            payload: dummyEntity,
            method: HttpMethod.PUT,
            successMsg,
          });
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush(dummyEntity);
      }
    ));

    it('should dispatch error notice when request gives an error', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        const entityId = 1;
        const dummyEntity: Partial<TestEntity> = { foo: 'foo', bar: 123 };
        service.update(entityId, dummyEntity).subscribe({
          error: () =>
            expect(notifier.dispatch).toHaveBeenCalledWith(
              expect.objectContaining({
                storeName,
                type: 'error',
                method: HttpMethod.PUT,
                errorMsg: undefined,
              })
            ),
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush([], { status: 500, statusText: '🧨😨💥' });
      }
    ));

    it('should dispatch error notice with configured error message when errorMsg is configured and request gives an error', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        const errorMsg = 'Error test message...';
        const entityId = 1;
        const dummyEntity: Partial<TestEntity> = { foo: 'foo', bar: 123 };
        service.update(entityId, dummyEntity, { errorMsg }).subscribe({
          error: () =>
            expect(notifier.dispatch).toHaveBeenCalledWith(
              expect.objectContaining({
                storeName,
                type: 'error',
                method: HttpMethod.PUT,
                errorMsg,
              })
            ),
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush([], { status: 500, statusText: '🧨😨💥' });
      }
    ));

    it('should dispatch stop loading event when request is complete', fakeAsync(
      inject([TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceLoader], (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, loader: NgEntityServiceLoader) => {
        const spy = jest.spyOn(loader, 'dispatch');
        const entityId = 1;
        const dummyEntity: Partial<TestEntity> = { foo: 'foo', bar: 123 };
        service.update(entityId, dummyEntity).subscribe();

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush([]);
        tick(); // needed for the finalize pipe operator to run
        expect(spy.mock.calls[spy.mock.calls.length - 1]).toEqual([
          {
            storeName,
            loading: false,
            entityId, // !WARN this is inconsistant with the stop loading event in both get & add, as they don't include entityId
            method: HttpMethod.PUT,
          },
        ]);
      })
    ));
  });

  describe('delete', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          TestStore,
          TestServiceWithInlineConfig,
          {
            provide: NG_ENTITY_SERVICE_CONFIG,
            useValue: {} as NgEntityServiceGlobalConfig,
          },
        ],
        imports: [HttpClientTestingModule],
      });
    });

    it('should dispatch loader event when called', inject([TestServiceWithInlineConfig, NgEntityServiceLoader], (service: TestServiceWithInlineConfig, loader: NgEntityServiceLoader) => {
      jest.spyOn(loader, 'dispatch');
      const entityId = 1;
      service.delete(entityId);
      expect(loader.dispatch).toHaveBeenCalled();
    }));

    it('should dispatch loading event when called', inject([TestServiceWithInlineConfig, NgEntityServiceLoader], (service: TestServiceWithInlineConfig, loader: NgEntityServiceLoader) => {
      jest.spyOn(loader, 'dispatch');
      const entityId = 1;
      service.delete(entityId);
      expect(loader.dispatch).toHaveBeenCalledWith({
        method: HttpMethod.DELETE,
        loading: true,
        entityId,
        storeName: storeName,
      });
    }));

    it('should not write to the store when called with skipWrite config', inject(
      [TestServiceWithInlineConfig, TestStore, HttpTestingController],
      (service: TestServiceWithInlineConfig, store: TestStore, httpMock: HttpTestingController) => {
        jest.spyOn(store, 'remove');
        const entityId = 1;
        service.delete(entityId, { skipWrite: true }).subscribe(() => {
          expect(store.remove).toHaveBeenCalledTimes(0);
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush([]);
      }
    ));

    it('should update entity in store when called', inject(
      [TestServiceWithInlineConfig, TestStore, HttpTestingController],
      (service: TestServiceWithInlineConfig, store: TestStore, httpMock: HttpTestingController) => {
        jest.spyOn(store, 'remove');
        const entityId = 1;
        service.delete(entityId).subscribe(() => {
          expect(store.remove).toHaveBeenCalledWith(entityId);
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush([]);
      }
    ));

    it('should return result from request', inject([TestServiceWithInlineConfig, HttpTestingController], (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
      const entityId = 1;
      const deleteResponse = { id: entityId, message: 'deleted' };
      service.delete(entityId).subscribe((result) => {
        expect(result).toEqual(deleteResponse);
      });

      const req = httpMock.expectOne(`${service.api}/${entityId}`);
      req.flush(deleteResponse);
    }));

    it('should transform returned result from request when called with mapResponseFn config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const entityId = 1;
        const deleteResponse = { id: entityId, message: 'deleted' };
        service.delete(entityId, { mapResponseFn: (x) => ({ test: x.id, test2: x.message }) }).subscribe((result) => {
          expect(result).toEqual({ test: entityId, test2: 'deleted' });
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush(deleteResponse);
      }
    ));

    it('should override request URL when called with url config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const dummyUrl = 'test-url';
        const entityId = 1;
        service.delete(entityId, { url: dummyUrl }).subscribe();

        const req = httpMock.expectOne(dummyUrl);
        req.flush([]);

        expect(() => {
          httpMock.verify();
        }).not.toThrow();
      }
    ));

    it('should add headers to request when called with header config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const entityId = 1;
        service.delete(entityId, { headers: { 'x-foo': 'foo', 'x-bar': 'bar' } }).subscribe();

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        expect(req.request.headers.get('x-foo')).toEqual('foo');
        expect(req.request.headers.get('x-bar')).toEqual('bar');
        req.flush([]);
      }
    ));

    it('should add URL parameters to request when called with params config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const entityId = 1;
        service.delete(entityId, { params: { foo: 'foo', bar: 'bar' } }).subscribe();

        const req = httpMock.expectOne((x) => x.url === `${service.api}/${entityId}`);
        expect(req.request.params.get('foo')).toEqual('foo');
        expect(req.request.params.get('bar')).toEqual('bar');
        req.flush([]);
      }
    ));

    it('should add URL postfix to request URL when called with urlPostfix config', inject(
      [TestServiceWithInlineConfig, HttpTestingController],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController) => {
        const entityId = 1;
        const urlPostfix = 'foo/3/bar/3';
        const expectedUrl = `${service.api}/${entityId}/${urlPostfix}`;
        service.delete(entityId, { urlPostfix }).subscribe();
        const req = httpMock.expectOne((x) => x.url === expectedUrl);
        expect(req.request.url).toBe(expectedUrl);
        req.flush([]);
      }
    ));

    it('should dispatch success notice when request is successful', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        const entityId = 1;
        const deleteResponse = { id: entityId, message: 'deleted' };
        service.delete(entityId).subscribe(() => {
          expect(notifier.dispatch).toHaveBeenCalledWith({
            storeName,
            type: 'success',
            payload: deleteResponse,
            method: HttpMethod.DELETE,
            successMsg: undefined,
          });
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush(deleteResponse);
      }
    ));

    it('should dispatch success notice with configured success message when successMsg is configured and request is successful', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        const successMsg = 'Success test message...';
        const entityId = 1;
        const deleteResponse = { id: entityId, message: 'deleted' };
        service.delete(entityId, { successMsg }).subscribe(() => {
          expect(notifier.dispatch).toHaveBeenCalledWith({
            storeName,
            type: 'success',
            payload: deleteResponse,
            method: HttpMethod.DELETE,
            successMsg,
          });
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush(deleteResponse);
      }
    ));

    it('should dispatch error notice when request gives an error', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        const entityId = 1;
        service.delete(entityId).subscribe({
          error: () =>
            expect(notifier.dispatch).toHaveBeenCalledWith(
              expect.objectContaining({
                storeName,
                type: 'error',
                method: HttpMethod.DELETE,
                errorMsg: undefined,
              })
            ),
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush([], { status: 500, statusText: '🧨😨💥' });
      }
    ));

    it('should dispatch error notice with configured error message when errorMsg is configured and request gives an error', inject(
      [TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceNotifier],
      (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, notifier: NgEntityServiceNotifier) => {
        jest.spyOn(notifier, 'dispatch');
        const errorMsg = 'Error test message...';
        const entityId = 1;
        service.delete(entityId, { errorMsg }).subscribe({
          error: () =>
            expect(notifier.dispatch).toHaveBeenCalledWith(
              expect.objectContaining({
                storeName,
                type: 'error',
                method: HttpMethod.DELETE,
                errorMsg,
              })
            ),
        });

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush([], { status: 500, statusText: '🧨😨💥' });
      }
    ));

    it('should dispatch stop loading event when request is complete', fakeAsync(
      inject([TestServiceWithInlineConfig, HttpTestingController, NgEntityServiceLoader], (service: TestServiceWithInlineConfig, httpMock: HttpTestingController, loader: NgEntityServiceLoader) => {
        const spy = jest.spyOn(loader, 'dispatch');
        const entityId = 1;
        service.delete(entityId).subscribe();

        const req = httpMock.expectOne(`${service.api}/${entityId}`);
        req.flush([]);
        tick(); // needed for the finalize pipe operator to run
        expect(spy.mock.calls[spy.mock.calls.length - 1]).toEqual([
          {
            storeName,
            loading: false,
            entityId, // !WARN this is inconsistant with the stop loading event in both get & add, as they don't include entityId
            method: HttpMethod.DELETE,
          },
        ]);
      })
    ));
  });
});
