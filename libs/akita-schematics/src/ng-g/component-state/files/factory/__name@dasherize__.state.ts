import { ActiveState, guid, Query, Store } from '@datorama/akita';
import { ElementRef } from '@angular/core';

interface <%= classify(name) %>ComponentState extends ActiveState {
  loading: boolean;
}

export class ComponentState {
  store: Store<<%= classify(name) %>ComponentState>;
  query: Query<<%= classify(name) %>ComponentState>;
}

export function componentStateFactory(element: ElementRef<Element>): ComponentState {
  const name = element?.nativeElement?.getAttribute('name') || `<%= classify(name) %>Component-${guid()}`;
  const store = new Store<<%= classify(name) %>ComponentState>({ loading: false }, { name });
  const query = new Query<<%= classify(name) %>ComponentState>(store);

  return { store, query };
}
