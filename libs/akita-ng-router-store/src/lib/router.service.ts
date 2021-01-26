import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, GuardsCheckEnd, NavigationCancel, NavigationEnd, NavigationError, ResolveEnd, Router, RoutesRecognized } from '@angular/router';
import { action, setSkipAction } from '@datorama/akita';
import { RouterQuery } from './router.query';
import { RouterState, RouterStore } from './router.store';

@Injectable({
  providedIn: 'root',
})
export class RouterService {
  private dispatchTriggeredByRouter = false;

  private navigationTriggeredByDispatch = false;
  private lastRouterState: RouterState;

  constructor(private readonly routerStore: RouterStore, private readonly routerQuery: RouterQuery, private readonly router: Router) {}

  @action('Navigation Cancelled')
  dispatchRouterCancel(event: NavigationCancel) {
    this.update({ navigationId: event.id });
    this.routerQuery.emitNavigationCancel(event);
  }

  @action('Navigation Error')
  dispatchRouterError(event: NavigationError) {
    this.update({ navigationId: event.id });
    this.routerQuery.emitNavigationError(event);
  }

  @action('Navigation Succeeded')
  dispatchRouterSuccess() {
    this.update(this.lastRouterState);
  }

  init(): void {
    this.setUpStoreListener();
    this.setUpStateRollbackEvents();
  }

  private update(routerState: Partial<RouterState>) {
    this.dispatchTriggeredByRouter = true;
    this.routerStore.update((state) => {
      return {
        ...state,
        ...routerState,
      };
    });
    this.dispatchTriggeredByRouter = false;
    this.navigationTriggeredByDispatch = false;
  }

  private setUpStoreListener(): void {
    this.routerQuery
      .select((state) => state)
      .subscribe((s) => {
        this.lastRouterState = s;
        this.navigateIfNeeded();
      });
  }

  private navigateIfNeeded(): void {
    if (!this.lastRouterState || !this.lastRouterState.state || this.dispatchTriggeredByRouter) {
      return;
    }

    if (this.router.url !== this.lastRouterState.state.url) {
      this.navigationTriggeredByDispatch = true;
      setSkipAction();
      void this.router.navigateByUrl(this.lastRouterState.state.url);
    }
  }

  private setUpStateRollbackEvents(): void {
    this.router.events.subscribe((e) => {
      if (e instanceof RoutesRecognized || e instanceof GuardsCheckEnd || e instanceof ResolveEnd) {
        this.lastRouterState = this.serializeRoute(e);
      } else if (e instanceof NavigationCancel) {
        this.dispatchRouterCancel(e);
      } else if (e instanceof NavigationError) {
        this.dispatchRouterError(e);
      } else if (e instanceof NavigationEnd && !this.navigationTriggeredByDispatch) {
        this.dispatchRouterSuccess();
      }
    });
  }

  private serializeRoute(navigationEvent: RoutesRecognized | GuardsCheckEnd | ResolveEnd): RouterState {
    let state: ActivatedRouteSnapshot = navigationEvent.state.root;
    while (state.firstChild) {
      state = state.firstChild;
    }
    const { params, data, queryParams, fragment } = state;

    return {
      navigationId: navigationEvent.id,
      state: {
        url: navigationEvent.url,
        urlAfterRedirects: navigationEvent.urlAfterRedirects,
        params,
        queryParams,
        fragment,
        data,
        navigationExtras: this.router.getCurrentNavigation().extras ? this.router.getCurrentNavigation().extras.state : {},
      },
    };
  }
}
