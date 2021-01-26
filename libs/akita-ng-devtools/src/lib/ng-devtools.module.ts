import { APP_INITIALIZER, ModuleWithProviders, NgModule } from '@angular/core';
import { DevtoolsOptions } from '@datorama/akita';
import { DEVTOOLS_OPTIONS } from './devtools-options';
import { AkitaDevtools } from './ng-devtools.service';

// auto initialize the devtools
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function d(): void {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function init(akitaDevtools: AkitaDevtools): () => void {
  return d;
}

@NgModule()
export class AkitaNgDevtools {
  public static forRoot(options?: Partial<DevtoolsOptions>): ModuleWithProviders<AkitaNgDevtools> {
    return {
      ngModule: AkitaNgDevtools,
      providers: [
        {
          provide: DEVTOOLS_OPTIONS,
          useValue: options,
        },
        {
          provide: APP_INITIALIZER,
          useFactory: init,
          deps: [AkitaDevtools],
          multi: true,
        },
      ],
    };
  }
}
