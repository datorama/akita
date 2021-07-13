import {
  <%= classify(name) %>ComponentQuery,
  <%= classify(name) %>ComponentStore,
} from './<%= dasherize(name) %>.state';

describe('<%= classify(name) %>ComponentStore', () => {
  let componentStore: <%= classify(name) %>ComponentStore;

  beforeEach(() => {
    componentStore = new <%= classify(name) %>ComponentStore();
  });

  it('should create an instance', () => {
    expect(componentStore).toBeTruthy();
  });

});

describe('<%= classify(name) %>ComponentQuery', () => {
  let componentQuery: <%= classify(name) %>ComponentQuery;

  beforeEach(() => {
    componentQuery = new <%= classify(name) %>ComponentQuery(new <%= classify(name) %>ComponentStore());
  });

  it('should create an instance', () => {
    expect(componentQuery ).toBeTruthy();
  });

});
