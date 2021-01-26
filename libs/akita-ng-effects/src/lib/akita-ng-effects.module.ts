import { Injector, ModuleWithProviders, NgModule, Type } from '@angular/core';
import { _FEATURE_EFFECTS, _ROOT_EFFECTS, FEATURE_EFFECT_INSTANCES, ROOT_EFFECT_INSTANCES } from './tokens';
import { EffectsRootModule } from './effect-root.module';
import { Actions } from './actions';
import { EffectsFeatureModule } from './effect-feature.module';
import { ModuleManager } from './module-manager.service';

@NgModule({})
export class AkitaNgEffectsModule {
  static forRoot(rootEffects: Type<any>[] = []): ModuleWithProviders<EffectsRootModule> {
    return {
      ngModule: EffectsRootModule,
      providers: [
        ModuleManager,
        Actions,
        rootEffects,
        {
          provide: _ROOT_EFFECTS,
          useValue: rootEffects,
        },
        {
          provide: ROOT_EFFECT_INSTANCES,
          useFactory: createEffectInstances,
          deps: [Injector, _ROOT_EFFECTS],
        },
      ],
    };
  }

  static forFeature(featureEffects: Type<any>[] = []): ModuleWithProviders<EffectsFeatureModule> {
    return {
      ngModule: EffectsFeatureModule,
      providers: [
        featureEffects,
        {
          provide: _FEATURE_EFFECTS,
          useValue: featureEffects,
        },
        {
          provide: FEATURE_EFFECT_INSTANCES,
          useFactory: createEffectInstances,
          deps: [Injector, _FEATURE_EFFECTS],
        },
      ],
    };
  }
}

export function createEffectInstances(injector: Injector, effects: Type<any>[]): any[] {
  const effectInstances = effects.map((effect) => {
    return injector.get(effect);
  });

  return effectInstances;
}
