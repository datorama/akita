import { Subscription } from 'rxjs';
import { getInitialEntitiesState } from '..';
import { EntityStore } from '../lib/entityStore';
import { QueryEntity } from '../lib/queryEntity';
import { StoreConfig } from '../lib/storeConfig';
import { EntityState } from '../lib/types';

type Widget = {
  id: number;
  options: {
    a: number[];
    b: number[];
  };
  config: {
    date: {
      from: string;
      to: string;
    };
    filter: {
      a: number;
      b: number;
    };
  };
  interactive: {
    c: number;
  };
};

type State = EntityState<Widget>;

const initialState: State = {
  ...getInitialEntitiesState(),
  active: 1,
};

@StoreConfig({ name: 'widgets' })
class WidgetsStore extends EntityStore<State, Widget> {
  constructor() {
    super(initialState);
  }
}

const store = new WidgetsStore();
const query = new QueryEntity(store);

let spy;
let spy2;
let spy3;
let subscription: Subscription;
let subscription2: Subscription;
let subscription3: Subscription;

describe('Update', () => {
  beforeEach(() => {
    spy = jest.fn();
    spy2 = jest.fn();
    spy3 = jest.fn();

    store.add({
      id: 1,
      options: {
        a: [1],
        b: [1],
      },
      config: {
        date: {
          from: 'from',
          to: 'to',
        },
        filter: {
          a: 1,
          b: 2,
        },
      },
      interactive: {
        c: 3,
      },
    });
    store.add({
      id: 2,
      options: {
        a: [1],
        b: [1],
      },
      config: {
        date: {
          from: 'from',
          to: 'to',
        },
        filter: {
          a: 1,
          b: 2,
        },
      },
      interactive: {
        c: 3,
      },
    });
  });

  afterEach(() => {
    store.remove();
    spy = null;
    spy2 = null;
    subscription.unsubscribe();
    if (subscription2) subscription2.unsubscribe();
    if (subscription3) subscription2.unsubscribe();
    subscription = null;
    subscription2 = null;
    subscription3 = null;
  });

  it('should call two times - one init and one on update', () => {
    subscription = query.selectEntity(1, (widget) => widget.interactive).subscribe(spy);
    subscription2 = query.selectEntity(1, (widget) => widget.config).subscribe(spy2);
    subscription3 = query.selectEntity(2, (widget) => widget.config).subscribe(spy3);

    store.update(1, {
      interactive: {
        c: 10,
      },
    });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy3).toHaveBeenCalledTimes(1);
  });

  it('should work with nested objects', () => {
    subscription = query.selectEntity(1, (widget) => widget.config.filter).subscribe(spy);
    subscription2 = query.selectEntity(1, (widget) => widget.config.date).subscribe(spy2);

    store.update(1, (entity) => {
      return {
        config: {
          ...entity.config,
          filter: {
            ...entity.config.filter,
            b: 100,
          },
        },
      };
    });

    expect(spy).toHaveBeenCalledTimes(2);
    /** only on initial */
    expect(spy2).toHaveBeenCalledTimes(1);
  });

  it('should work with nested objects - 2', () => {
    subscription = query.selectEntity(1, (widget) => widget.config.filter).subscribe(spy);
    subscription2 = query.selectEntity(1, (widget) => widget.config.date).subscribe(spy2);

    store.update(1, (entity) => {
      return {
        config: {
          ...entity.config,
          filter: {
            a: 300,
            b: 100,
          },
        },
      };
    });

    expect(spy).toHaveBeenCalledTimes(2);
    /** only on initial */
    expect(spy2).toHaveBeenCalledTimes(1);
  });

  it('should work with arrays - push', () => {
    subscription = query.selectEntity(1, (widget) => widget.options.a).subscribe(spy);
    subscription2 = query.selectEntity(1, (widget) => widget.options.b).subscribe(spy2);

    store.update(1, (entity) => {
      return {
        options: {
          ...entity.options,
          a: [...entity.options.a, 2],
        },
      };
    });

    expect(spy).toHaveBeenCalledTimes(2);
    /** only on initial */
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(query.getEntity(1).options.a).toEqual([1, 2]);
  });

  it('should work with arrays - replace', () => {
    subscription = query.selectEntity(1, (widget) => widget.options.a).subscribe(spy);
    subscription2 = query.selectEntity(1, (widget) => widget.config).subscribe(spy2);

    store.update(1, (entity) => {
      return {
        options: {
          ...entity.options,
          a: [3, 4],
        },
      };
    });

    expect(spy).toHaveBeenCalledTimes(2);
    /** only on initial */
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(query.getEntity(1).options.a).toEqual([3, 4]);
  });
});
