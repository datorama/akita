import { Inject, Injectable, NgZone } from '@angular/core';
import { akitaDevtools, DevtoolsOptions } from '@datorama/akita';
import { DEVTOOLS_OPTIONS } from './devtools-options';

@Injectable({
  providedIn: 'root',
})
export class AkitaDevtools {
  constructor(private readonly ngZone: NgZone, @Inject(DEVTOOLS_OPTIONS) private readonly options: DevtoolsOptions) {
    akitaDevtools(this.ngZone, this.options);
  }
}
