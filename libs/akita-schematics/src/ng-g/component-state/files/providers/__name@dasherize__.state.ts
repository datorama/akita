import { ActiveState, guid, Query, Store } from '@datorama/akita';
import { Injectable } from '@angular/core';

export interface <%= classify(name) %>ComponentState extends ActiveState {
  loading: boolean;
}

export class <%= classify(name) %>ComponentStore extends Store<<%= classify(name) %>ComponentState> {
  constructor() {
    super({ loading: true }, { name: `<%= classify(name) %>Component-${guid()}` });
  }
}

@Injectable()
export class <%= classify(name) %>ComponentQuery extends Query<<%= classify(name) %>ComponentState> {
  constructor(protected store: <%= classify(name) %>ComponentStore) { super(store); }
}
