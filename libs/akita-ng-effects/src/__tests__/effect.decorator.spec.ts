import { Effect } from '@datorama/akita-ng-effects';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

describe('@Effect Decorator', () => {
  it('should create ab effect with metadata', () => {
    return new Promise<void>((done) => {
      class TestClass {
        @Effect()
        testEffect$ = of('sample')
          .pipe(
            tap((val) => {
              expect(val).toBe('sample');
              done();
            })
          )
          .subscribe();
      }

      const testClass = new TestClass();
      expect(testClass.testEffect$).toMatchObject({ isEffect: true });
      expect(testClass.testEffect$).toHaveProperty('name');
    });
  });
});
