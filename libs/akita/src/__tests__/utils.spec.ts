import { isPlainObject } from '../lib/isPlainObject';

describe('Utils', () => {
  describe('isPlainObject', () => {
    it('should return true', () => {
      expect(isPlainObject({})).toBeTruthy();
    });

    it('should return false', () => {
      expect(isPlainObject(class User {})).toBeFalsy();
    });

    it('should return false when passing function', () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      expect(isPlainObject(() => {})).toBeFalsy();
    });
  });
});
