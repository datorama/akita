import { APP_BASE_HREF } from '@angular/common';
import { Component, Injectable, NgZone } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivate, NavigationExtras, Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AkitaNgRouterStoreModule } from '..';
import { RouterQuery } from './router.query';

@Component({
  selector: 'test-empty',
  template: '',
})
class EmptyComponent {}

const intentionalTestError = new Error('Intentional test error.');

@Injectable()
class AuthGuard implements CanActivate {
  constructor(private readonly router: Router) {}

  canActivate(route: ActivatedRouteSnapshot) {
    if (route.url.toString().includes('throw-error')) {
      throw intentionalTestError;
    }

    if (route.url.toString().includes('redirect-home')) {
      return this.router.parseUrl('/home');
    }

    return !route.url.toString().includes('fail-auth-guard');
  }
}

const routes: Routes = [
  {
    path: 'simple',
    component: EmptyComponent,
  },
  {
    path: 'test/:someParam/:other',
    component: EmptyComponent,
  },
  {
    path: 'with-data',
    data: { actor: 'Brent Spiner' },
    component: EmptyComponent,
  },
  {
    path: '**',
    canActivate: [AuthGuard],
    component: EmptyComponent,
  },
];

describe('RouterService', () => {
  let routerQuery: RouterQuery;
  let ngZone: NgZone;
  let router: Router;

  beforeEach(() => {
    void TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes(routes), AkitaNgRouterStoreModule],
      declarations: [EmptyComponent],
      providers: [AuthGuard, { provide: APP_BASE_HREF, useValue: '/' }],
    }).compileComponents();

    routerQuery = TestBed.get(RouterQuery);
    ngZone = TestBed.get(NgZone);
    router = TestBed.get(Router);

    void navigateByUrl('start');
  });

  function navigateByUrl(url: string, navigationExtras?: NavigationExtras) {
    return ngZone.run(() => router.navigateByUrl(url, navigationExtras));
  }

  it('should update the router state after a successful navigation', async () => {
    await navigateByUrl('/simple');

    expect(routerQuery.getValue().navigationId).toEqual(2);
    expect(routerQuery.getValue().state.url).toEqual('/simple');
  });

  it('should update the router state when only the hash changes', async () => {
    await navigateByUrl('/start#hashBrowns');

    expect(routerQuery.getValue().navigationId).toEqual(2);
    expect(routerQuery.getFragment()).toEqual('hashBrowns');
  });

  it('should update the router state when only query parameters change', async () => {
    await navigateByUrl('/start?one=1&two=2');

    expect(routerQuery.getValue().navigationId).toEqual(2);
    expect(routerQuery.getQueryParams()).toEqual({ one: '1', two: '2' });
  });

  it('should emit a navigationCancel event when canActivate returns false', async () => {
    expect.assertions(3);
    routerQuery.selectNavigationCancel().subscribe((event) => {
      expect(event).toEqual({ id: 2, reason: '', url: '/fail-auth-guard' });
    });

    await navigateByUrl('fail-auth-guard');

    expect(routerQuery.getValue().navigationId).toEqual(2);
    expect(routerQuery.getValue().state.url).toEqual('/start');
  });

  it('should emit a navigationError event when canActivate throws an error', async () => {
    expect.assertions(3);
    routerQuery.selectNavigationError().subscribe((event) => {
      expect(event).toEqual({ id: 2, error: intentionalTestError, url: '/throw-error' });
    });

    try {
      await navigateByUrl('throw-error');
    } catch {}

    expect(routerQuery.getValue().navigationId).toEqual(2);
    expect(routerQuery.getValue().state.url).toEqual('/start');
  });

  it('should not update the state with urls that are never activated due to canActivate redirects', fakeAsync(() => {
    expect.assertions(3);

    routerQuery.selectNavigationCancel().subscribe((event) => {
      expect(event).toEqual({ id: 2, reason: 'NavigationCancelingError: Redirecting to "/home"', url: '/redirect-home' });
    });

    routerQuery.select().subscribe(({ navigationId, state }) => {
      if (navigationId === 2) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(state).toEqual({ data: {}, fragment: null, navigationExtras: undefined, params: {}, queryParams: {}, url: '/start', urlAfterRedirects: '/start' });
      } else if (navigationId === 3) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(state).toEqual({ data: {}, fragment: null, navigationExtras: undefined, params: {}, queryParams: {}, url: '/home', urlAfterRedirects: '/home' });
      }
    });

    void navigateByUrl('/redirect-home');
    tick();
  }));

  it('should support getting route params by name', async () => {
    await navigateByUrl('/test/100/200');

    expect(routerQuery.getParams('someParam')).toEqual('100');
    expect(routerQuery.getParams('other')).toEqual('200');
  });

  it('should support getting state provided in navigationExtras', async () => {
    await navigateByUrl('/simple', { state: { custom: 'yay' } });

    expect(routerQuery.getNavigationExtras('custom')).toEqual('yay');
  });

  it('should support getting route data', async () => {
    await navigateByUrl('with-data');

    expect(routerQuery.getData()).toEqual({ actor: 'Brent Spiner' });
  });
});
