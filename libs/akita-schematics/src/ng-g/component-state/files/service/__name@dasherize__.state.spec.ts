import { TestBed } from '@angular/core/testing';

import { <%= classify(name) %>ComponentStateService } from './<%= dasherize(name) %>.state';

describe('<%= classify(name) %>ComponentStateService', () => {
  let service: <%= classify(name) %>ComponentStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(<%= classify(name) %>ComponentStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
