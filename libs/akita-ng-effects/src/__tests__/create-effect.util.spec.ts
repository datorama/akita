import { createEffect } from '@datorama/akita-ng-effects';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

describe('Create effect utility', () => {
  it('should create an effect with effect metadata', () => {
    const effect = createEffect(() => of('sample'));

    expect(effect).toMatchObject({ isEffect: true });
    expect(effect).toHaveProperty('name');
  });

  it('should emit a value upon subscription', () => {
    return new Promise<void>((done) => {
      createEffect(() =>
        of('sample').pipe(
          tap((val) => {
            expect(val).toBe('sample');
            done();
          })
        )
      ).subscribe();
    });
  });
});
