import { ActiveState, Query, Store } from '@datorama/akita';
import { Injectable } from '@angular/core';

interface <%= classify(name) %>ComponentState extends ActiveState {
  loading: boolean;
}

class ComponentState {
  store: Store<<%= classify(name) %>ComponentState>;
  query: Query<<%= classify(name) %>ComponentState>;
}

@Injectable({ providedIn: 'root' })
export class <%= classify(name) %>ComponentStateService {

private stores = new Map<string, ComponentState>();

public createState(name: string): ComponentState {
    const store = new Store<<%= classify(name) %>ComponentState>({ loading: false }, { name });
    const query = new Query<<%= classify(name) %>ComponentState>(store);

    const state: ComponentState = { store, query };
    this.stores.set(name, state);

    return state;
}

public getState(name: string): ComponentState {
    return this.stores.get(name);
  }
}
