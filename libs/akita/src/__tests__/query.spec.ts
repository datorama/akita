import { Query } from '../lib/query';
import { Store } from '../lib/store';
import { StoreConfig } from '../lib/storeConfig';

class User {
  firstName = '';

  lastName = '';

  constructor(params: Partial<User>) {
    Object.assign(this, params);
  }

  get name() {
    return `${this.firstName} ${this.lastName}`;
  }
}

@StoreConfig({
  name: 'user',
})
class UserStore extends Store<User> {
  constructor() {
    super(new User({ firstName: 'Netanel', lastName: 'Basal' }));
  }
}

const userStore = new UserStore();

class UserQuery extends Query<User> {
  constructor() {
    super(userStore);
  }
}

const query = new UserQuery();

describe('With Class', () => {
  it('should select a slice from the state', () => {
    const spy = jest.fn();
    query.select((state) => state.firstName).subscribe(spy);
    expect(spy).toHaveBeenCalledWith('Netanel');
  });

  it('should select all', () => {
    const spy = jest.fn();
    query.select().subscribe(spy);
    expect(spy).toHaveBeenCalledWith({ firstName: 'Netanel', lastName: 'Basal' });
  });

  it('should get the value', () => {
    expect(query.getValue()).toEqual(userStore._value());
  });

  it('should work with string', () => {
    let result;
    query.select('firstName').subscribe((name) => {
      result = name;
    });
    expect(result).toBe('Netanel');
  });
});
