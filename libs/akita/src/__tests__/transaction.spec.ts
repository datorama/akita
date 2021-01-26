import { Subscription } from 'rxjs';
import { QueryEntity } from '../lib/queryEntity';
import { applyTransaction, transaction } from '../lib/transaction';
import { Todo, TodosStore } from './setup';

const store = new TodosStore();
const query = new QueryEntity(store);

describe('Transactions', () => {
  let observer;
  let subscription: Subscription;

  beforeEach(() => {
    observer = jest.fn();
  });

  afterEach(() => {
    subscription.unsubscribe();
  });

  it('should emit twice without transaction', () => {
    subscription = query.selectAll().subscribe(observer);
    store.add(new Todo({ id: 1, title: '1' }));
    store.add(new Todo({ id: 2, title: '2' }));
    expect(observer).toHaveBeenCalledTimes(3);
  });

  it('should emit once with transaction', () => {
    subscription = query.selectAll().subscribe(observer);
    applyTransaction(() => {
      store.add(new Todo({ id: 3, title: '3' }));
      store.add(new Todo({ id: 4, title: '4' }));
    });
    expect(observer).toHaveBeenCalledTimes(2);
  });

  it('should emit once with transaction decorator', () => {
    subscription = query.selectAll().subscribe(observer);

    class Service {
      @transaction()
      add(): void {
        store.add(new Todo({ id: 5, title: '5' }));
        store.add(new Todo({ id: 6, title: '6' }));
        store.add(new Todo({ id: 7, title: '7' }));
      }
    }

    new Service().add();
    expect(observer).toHaveBeenCalledTimes(2);
  });

  it('should work with nested transactions', () => {
    subscription = query.selectAll().subscribe(observer);

    applyTransaction(() => {
      store.add(new Todo({ id: 8, title: '8' }));
      applyTransaction(() => {
        store.add(new Todo({ id: 9, title: '9' }));
      });
    });

    expect(observer).toHaveBeenCalledTimes(2);
  });

  it('should work with update', () => {
    subscription = query.selectEntity(1).subscribe(observer);

    applyTransaction(() => {
      store.update(1, { title: 'changed' });
      store.update(1, { completed: true });
    });

    expect(observer).toHaveBeenCalledTimes(2);
  });
});
