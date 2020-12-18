# Akita Effects

### What is it?

Use effects to hook into your actions and act upon action events.<br>

### How to use it

Just register your effects in the AkitaNgEffectsModule.


```ts
// Only use .forRoot() once in your base module.
@NgModule({
  imports: [
    CommonModule, 
    AkitaNgEffectModule.forRoot([NavigationEffects])
  ],
})
export class CoreDataModule {}

// Use .forFeature() on any feature module
@NgModule({
  imports: [
    CommonModule, 
    AkitaNgEffectModule.forFeature([NavigationEffects])
  ],
})
export class FeatureModule {}

```

## Usage

Setup your actions, that the effects will listen for.
The action events are published globally on the actions stream so every effect can listen for any action.

```ts
export const LOAD_MAIN_NAVIGATION = createAction('Load Main Navigation');
export const LOAD_MAIN_NAVIGATION_SUCCESS = createAction(
  'Load Main Navigation Success', 
  props<{ mainNav: MainNavigation }>()
);
```

Use the effects to listen for any action event. You can publish other actions or run service tasks on any action event.

```ts
@Injectable({
  providedIn: 'root',
})
export class NavigationEffects {
  constructor(
    // inject the actions stream
    private actions$: Actions, 
    private navigationService: NavigationService, 
    private store: NavigationStore
  ) {}

  // can also be immplemented with createEffect() function
  @Effect()
  loadMainNavigation$ = this.actions$.pipe(
    ofType(LOAD_MAIN_NAVIGATION),
    switchMap(_ => this.navigationService.LOAD_MAIN_NAVIGATION().pipe(
      tap(mainNav => this.actions$.dispatch(LOAD_MAIN_NAVIGATION_SUCCESS({ mainNav }))))
    )
  );

  @Effect()
  loadMainNavigationSuccess$ = this.actions$.pipe(
    ofType(LOAD_MAIN_NAVIGATION_SUCCESS),
    map(({ mainNav }) => this.navigationService.updateNavigationTree(mainNav)),
    tap(mainRoutes => this.store.updateNavigation(mainRoutes))
  );
}
```
A possible use case for an action inside a guard. <br>
```ts
@Injectable({
  providedIn: 'root',
})
export class InitRouterGuard implements CanActivate {
  constructor(
    private navigationQuery: NavigationQuery, 
    private actions: Actions
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.navigationQuery.isNavInitialized$.pipe(
      tap((isInit) => {
        if (!isInit) this.actions.dispatch(LOAD_MAIN_NAVIGATION());
      }),
      filter(isInit => isInit),
      map((val) => true)
    );
  }
}
```
