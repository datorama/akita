import { createAction, ofType } from '@datorama/akita-ng-effects';
import { payload, props } from 'ts-action';
import { of } from 'rxjs';
import { tap, toArray } from 'rxjs/operators';

describe('of-type', () => {
  describe('payload', () => {
    const actionOne = createAction('actionOne', payload<{ numberOne: number }>());
    const actionTwo = createAction('actionTwo', payload<{ numberTwo: number }>());
    const actionThree = createAction('actionThree', payload<{ numberThree: number }>());

    it('should supply the payload without the type matching a single type', (done) => {
      of(actionOne({ numberOne: 1 }))
        .pipe(
          ofType(actionOne),
          tap((data) => {
            expect(data).not.toHaveProperty('type');
            expect(data).toHaveProperty('payload');
            done();
          })
        )
        .subscribe();
    });

    it('should supply the payload without the type matching multiple types', (done) => {
      of(actionOne({ numberOne: 1 }), actionTwo({ numberTwo: 2 }))
        .pipe(
          ofType(actionOne, actionTwo),
          tap((data) => {
            expect(data).not.toHaveProperty('type');
            expect(data).toHaveProperty('payload');
            done();
          })
        )
        .subscribe();
    });

    it('should filter actions not matching a type', (done) => {
      let hasBeenCalled = false;

      of(actionTwo({ numberTwo: 1 }))
        .pipe(
          ofType(actionOne),
          tap((data) => (hasBeenCalled = true))
        )
        .subscribe();

      expect(hasBeenCalled).toBeFalsy();
      done();
    });

    it('should filter actions not matching multiple types', (done) => {
      let hasBeenCalled = false;

      of(actionThree({ numberThree: 1 }))
        .pipe(
          ofType(actionOne, actionTwo),
          tap((data) => (hasBeenCalled = true))
        )
        .subscribe();

      expect(hasBeenCalled).toBeFalsy();
      done();
    });
  });

  describe('props', () => {
    const actionOne = createAction('actionOne', props<{ numberOne: number }>());
    const actionTwo = createAction('actionTwo', props<{ numberTwo: number }>());
    const actionThree = createAction('actionThree', props<{ numberThree: number }>());

    it('should supply the props without the type matching a single type', (done) => {
      of(actionOne({ numberOne: 1 }))
        .pipe(
          ofType(actionOne),
          tap((data) => {
            expect(data).not.toHaveProperty('type');
            expect(data).toHaveProperty('numberOne');
            done();
          })
        )
        .subscribe();
    });

    it('should supply the props without the type matching multiple types', (done) => {
      of(actionOne({ numberOne: 1 }), actionTwo({ numberTwo: 2 }))
        .pipe(
          ofType(actionOne, actionTwo),
          tap((data) => {
            expect(data).not.toHaveProperty('type');
          }),
          toArray(),
          tap((dataArray) => {
            expect(dataArray).toEqual([{ numberOne: 1 }, { numberTwo: 2 }]);
            done();
          })
        )
        .subscribe();
    });

    it('should filter actions not matching a type', (done) => {
      let hasBeenCalled = false;

      of(actionTwo({ numberTwo: 1 }))
        .pipe(
          ofType(actionOne),
          tap((data) => (hasBeenCalled = true))
        )
        .subscribe();

      expect(hasBeenCalled).toBeFalsy();
      done();
    });

    it('should filter actions not matching multiple types', (done) => {
      let hasBeenCalled = false;

      of(actionThree({ numberThree: 1 }))
        .pipe(
          ofType(actionOne, actionTwo),
          tap((data) => (hasBeenCalled = true))
        )
        .subscribe();

      expect(hasBeenCalled).toBeFalsy();
      done();
    });
  });
});
