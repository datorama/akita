import { enableAkitaProdMode } from '@datorama/akita';

// isBrowser expression has to be mocked because
// in context of enableAkitaProdMode func it evaluates
// to true and that defeats the purpose of this test
jest.mock('../lib/root', () => ({
  get isBrowser() {
    return false; // set some default value
  },
}));

describe('env', () => {
  let windowSpy;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    windowSpy = jest.spyOn(global, 'window', 'get');
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  it('should not throw an error despite window being undefined.', () => {
    windowSpy.mockImplementation(() => undefined);
    expect(window).toBeUndefined();
    expect(() => enableAkitaProdMode()).not.toThrow();
  });
});
