import { Inject, NgModule, Optional, SkipSelf } from '@angular/core';
import { Actions } from './actions';
import { ModuleManager } from './module-manager.service';
import { ROOT_EFFECT_INSTANCES } from './tokens';

@NgModule()
export class EffectsRootModule {
  constructor(
    private readonly moduleManager: ModuleManager,
    readonly actions: Actions,
    @Inject(ROOT_EFFECT_INSTANCES) rootEffects: any[],
    @Optional() @SkipSelf() private readonly parentModule?: EffectsRootModule
  ) {
    this.rootGuard();
    rootEffects.forEach((effect) => this.moduleManager.addEffectInstance(effect));
  }

  rootGuard() {
    if (this.parentModule) {
      throw new Error('EffectsRootModule is already loaded. Import it in the AppModule only');
    }
  }
}
