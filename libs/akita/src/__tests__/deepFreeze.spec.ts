import { deepFreeze } from '../lib/deepFreeze';
import { Store } from '../lib/store';
import { StoreConfig } from '../lib/storeConfig';

class SpecialObject {
  specialString = 'special';

  specialNumber = 2;

  constructor(params: Partial<ComplexState>) {
    Object.assign(this, params);
  }
}

class ComplexState {
  propertyString = '';

  propertyNumber = 1;

  specialObject: SpecialObject = new SpecialObject({});

  constructor(params: Partial<ComplexState>) {
    Object.assign(this, params);
  }
}

@StoreConfig({
  name: 'complexState',
})
class ComplexStore extends Store<ComplexState> {
  constructor() {
    super(new ComplexState({}));
  }
}

const complexStore = new ComplexStore();

describe('store with no custom deepFreeze', () => {
  it('should use default function', () => {
    expect(complexStore.deepFreeze).toEqual(deepFreeze);
  });

  it('should freeze all properties', () => {
    expect(Object.isFrozen(complexStore._value().propertyNumber)).toBeTruthy();
    expect(Object.isFrozen(complexStore._value().propertyString)).toBeTruthy();
    expect(Object.isFrozen(complexStore._value().specialObject)).toBeTruthy();
    expect(Object.isFrozen(complexStore._value().specialObject.specialNumber)).toBeTruthy();
    expect(Object.isFrozen(complexStore._value().specialObject.specialString)).toBeTruthy();
  });
});

function deepFreezeCustom(o: ComplexState) {
  Object.freeze(o);

  return o;
}

@StoreConfig({
  name: 'complexState2',
  deepFreezeFn: deepFreezeCustom,
})
class ComplexStoreCustom extends Store<ComplexState> {
  constructor() {
    super(new ComplexState({}));
  }
}

const complexStoreCustom = new ComplexStoreCustom();

describe('store with custom deepFreeze', () => {
  it('should use custom function', () => {
    expect(complexStoreCustom.deepFreeze).toEqual(deepFreezeCustom);
  });

  it('should not freeze all properties', () => {
    expect(Object.isFrozen(complexStoreCustom._value().propertyNumber)).toBeTruthy();
    expect(Object.isFrozen(complexStoreCustom._value().propertyString)).toBeTruthy();
    expect(Object.isFrozen(complexStoreCustom._value().specialObject)).toBeFalsy();
    expect(Object.isFrozen(complexStoreCustom._value().specialObject.specialNumber)).toBeTruthy();
    expect(Object.isFrozen(complexStoreCustom._value().specialObject.specialString)).toBeTruthy();
  });
});
