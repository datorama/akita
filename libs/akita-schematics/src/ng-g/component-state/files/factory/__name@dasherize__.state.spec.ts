import { ComponentState, componentStateFactory  } from './<%= dasherize(name) %>.state';

describe('ComponentState', () => {
  let componentState: ComponentState;

  beforeEach(() => {
    componentState = componentStateFactory(undefined);
  });

  it('should create an instance', () => {
    expect(componentState).toBeTruthy();
  });

});
