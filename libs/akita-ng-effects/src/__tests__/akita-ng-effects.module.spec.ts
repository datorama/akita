import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AkitaNgEffectsModule } from '@datorama/akita-ng-effects';

@Injectable()
class FakeEffects {}

describe(`forRoot`, () => {
  it(`should provide FakeEffects`, () => {
    TestBed.configureTestingModule({
      imports: [AkitaNgEffectsModule.forRoot([FakeEffects])],
    });
    const fakeEffects = TestBed.get(FakeEffects);
    expect(fakeEffects).toBeDefined();
  });
});
