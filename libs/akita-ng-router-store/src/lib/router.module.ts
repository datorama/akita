import { NgModule } from '@angular/core';
import { RouterService } from './router.service';

@NgModule()
export class AkitaNgRouterStoreModule {
  constructor(private readonly routerService: RouterService) {
    this.routerService.init();
  }
}
