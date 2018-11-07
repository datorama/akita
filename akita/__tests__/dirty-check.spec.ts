import { DirtyCheckPlugin, EntityDirtyCheckPlugin } from '../src/index';
import { Widget, WidgetsQuery, WidgetsStore } from './setup';
import { Observable } from 'rxjs';
import { skip } from 'rxjs/operators';

describe('DirtyCheck', () => {
  function createWidget() {
    return {
      id: ++_id,
      title: `Widget ${_id}`
    } as Widget;
  }

  let _id = 0;
  describe('Watch entire store', () => {
    const widgetsStore = new WidgetsStore();
    const widgetsQuery = new WidgetsQuery(widgetsStore);

    it('should call activate only on first setHead()', () => {
      spyOn(DirtyCheckPlugin.prototype, 'activate');
      const dirtyCheck = new DirtyCheckPlugin(widgetsQuery);

      expect(DirtyCheckPlugin.prototype.activate).not.toHaveBeenCalled();
      dirtyCheck.setHead();
      expect(DirtyCheckPlugin.prototype.activate).toHaveBeenCalledTimes(1);
      dirtyCheck.setHead();
      expect(DirtyCheckPlugin.prototype.activate).toHaveBeenCalledTimes(1);
    });

    describe('Plugin flow', () => {
      const dirtyCheck = new DirtyCheckPlugin(widgetsQuery);
      const spy = jest.fn();

      dirtyCheck.isDirty$.subscribe(spy);

      it('should setHead()', () => {
        widgetsStore.add(createWidget());
        expect(spy).toHaveBeenLastCalledWith(false);
        dirtyCheck.setHead();
        expect(dirtyCheck.head).toEqual({
          entities: {
            '1': {
              id: 1,
              title: 'Widget 1'
            }
          },
          error: null,
          ids: [1],
          loading: true
        });
        expect(spy).toHaveBeenLastCalledWith(false);
      });

      it("should mark as dirty when the store value doesn't equal to head", () => {
        widgetsStore.add(createWidget());
        expect(spy).toHaveBeenLastCalledWith(true);
      });

      it('should mark as pristine when the store value equal to head', () => {
        widgetsStore.remove(2);
        expect(spy).toHaveBeenLastCalledWith(false);
      });

      it('should rebase the head', () => {
        widgetsStore.add(createWidget());
        expect(spy).toHaveBeenLastCalledWith(true);
        dirtyCheck.setHead();
        expect(spy).toHaveBeenLastCalledWith(false);
        expect(dirtyCheck.head).toEqual({
          entities: {
            '1': {
              id: 1,
              title: 'Widget 1'
            },
            '3': {
              id: 3,
              title: 'Widget 3'
            }
          },

          error: null,
          ids: [1, 3],
          loading: true
        });
      });

      it('should reset the store to current head value', () => {
        widgetsStore.add(createWidget());
        expect(spy).toHaveBeenLastCalledWith(true);
        dirtyCheck.reset();
        expect(widgetsStore._value()).toEqual({
          entities: {
            '1': {
              id: 1,
              title: 'Widget 1'
            },
            '3': {
              id: 3,
              title: 'Widget 3'
            }
          },
          error: null,
          ids: [1, 3],
          loading: true
        });

        expect(spy).toHaveBeenLastCalledWith(false);
      });

      it('should unsubscribe on destroy', () => {
        dirtyCheck.destroy();
        expect(dirtyCheck.subscription.closed).toBeTruthy();
      });

      it('should return true if state is dirty', () => {
        dirtyCheck.updateDirtiness(true);
        const isDirty = dirtyCheck.isDirty();
        expect(isDirty).toBeTruthy();
      });

      it('should return false if state is not dirty', () => {
        dirtyCheck.updateDirtiness(false);
        const isDirty = dirtyCheck.isDirty();
        expect(isDirty).toBeFalsy();
      });

      it('should return true if state has head', () => {
        dirtyCheck.setHead();
        const isDirty = dirtyCheck.hasHead();
        expect(isDirty).toBeTruthy();
      });

      it('should return false if state does not has head', () => {
        dirtyCheck.head = null;
        const hasHead = dirtyCheck.hasHead();
        expect(hasHead).toBeFalsy();
      });

      describe('dirtyPath',()=>{
        const widgetsStore = new WidgetsStore({ some: { nested: { value: '' } } });
        const widgetsQuery = new WidgetsQuery(widgetsStore);
        const dirtyCheck = new DirtyCheckPlugin(widgetsQuery).setHead();
        it('should not return dirty for isPathDirty', function() {
          let isPathDirty: boolean;
          dirtyCheck.setHead();
          const firstWidget = createWidget();
          widgetsStore.add(firstWidget);
          isPathDirty = dirtyCheck.isPathDirty('some.nested.value');
          expect(isPathDirty).toBeFalsy();
        });

        it('should return dirty for isPathDirty', function() {
          let isPathDirty: boolean;
          dirtyCheck.setHead();
          widgetsStore.updateRoot({
            some: {
              nested: {
                value: 'some other name'
              }
            }
          });

          isPathDirty = dirtyCheck.isPathDirty('some.nested.value');
          expect(isPathDirty).toBeTruthy();
        });
      })
    });
  });

  describe('Watch specific property', () => {
    const widgetsStore = new WidgetsStore({ name: 'akita' });
    const widgetsQuery = new WidgetsQuery(widgetsStore);
    const dirtyCheck = new DirtyCheckPlugin(widgetsQuery, { watchProperty: 'name' }).setHead();
    const spy = jest.fn();
    dirtyCheck.isDirty$.pipe(skip(1)).subscribe(spy);

    it('should not trigger a change in is dirty', () => {
      /** reset widgets ID */
      _id = 0;
      widgetsStore.add(createWidget());
      expect(spy).not.toHaveBeenCalled();
    });

    it('should return true if state is dirty', () => {
      widgetsStore.updateRoot({ name: 'kazaz' });
      expect(spy).toHaveBeenLastCalledWith(true);
    });

    it('should only reset the watched property', () => {
      widgetsStore.add(createWidget());
      dirtyCheck.reset();
      expect(spy).toHaveBeenLastCalledWith(false);
      expect(widgetsStore.entities[1]).toBeDefined();
      expect(widgetsStore.entities[2]).toBeDefined();
      expect(widgetsStore._value().name).toBe('akita');
    });

    describe('Watch entities', () => {
      const dirtyCheck = new DirtyCheckPlugin(widgetsQuery, { watchProperty: 'entities' }).setHead();
      it(`should watch 'ids' property if 'entities' is watched`, () => {
        const watching = !['entities', 'ids'].some(key => !(dirtyCheck.params.watchProperty as any[]).includes(key));
        expect(watching).toBe(true);
      });

      it('should reset to original entities after store changes', () => {
        dirtyCheck.setHead();
        /** do some manipulation */
        widgetsStore.add([createWidget(), createWidget(), createWidget()]);
        widgetsStore.remove(1);
        widgetsStore.updateRoot({ name: 'Akita' });
        widgetsStore.update(2, { title: 'kazaz widget' });
        dirtyCheck.reset();
        expect(widgetsStore.entities).toEqual({ '1': { id: 1, title: 'Widget 1' }, '2': { id: 2, title: 'Widget 2' } });
        expect(widgetsStore._value().name).toEqual('Akita');
      });
    });
  });
});

describe('DirtyCheckEntity', () => {
  function createWidget(complete = false) {
    return {
      id: ++_id,
      title: `Widget ${_id}`,
      complete
    } as Widget;
  }

  let _id = 0;
  let widgetsStore = new WidgetsStore();
  let widgetsQuery = new WidgetsQuery(widgetsStore);
  let collection = new EntityDirtyCheckPlugin(widgetsQuery);
  widgetsStore.add([createWidget(), createWidget(), createWidget()]);
  collection.setHead();

  describe('Not passing ids', () => {
    it('should select all when not passing entityIds', () => {
      expect(collection.entities.size).toEqual(3);
    });

    it('should work with entity', () => {
      const spy = jest.fn();
      collection.isDirty(1).subscribe(spy);
      expect(spy).toHaveBeenLastCalledWith(false);
      widgetsStore.update(2, { title: 'Changed' });
      expect(spy).toHaveBeenLastCalledWith(false);
      widgetsStore.update(1, { title: 'Changed' });
      expect(spy).toHaveBeenLastCalledWith(true);
      widgetsStore.update(1, { title: 'Widget 1' });
      expect(spy).toHaveBeenLastCalledWith(false);
      widgetsStore.update(1, { title: 'Changed' });
      expect(spy).toHaveBeenLastCalledWith(true);
      expect(widgetsQuery.getEntity(1)).toEqual({ id: 1, title: 'Changed', complete: false });
      collection.reset(1);
      expect(widgetsQuery.getEntity(1)).toEqual({ id: 1, title: 'Widget 1', complete: false });
      widgetsStore.update(1, { title: 'Changed', complete: true });
      expect(widgetsQuery.getEntity(1)).toEqual({ id: 1, title: 'Changed', complete: true });
      const updateFn = (head, current) => {
        return {
          ...head,
          title: current.title
        };
      };
      collection.reset(1, { updateFn });
      expect(widgetsQuery.getEntity(1)).toEqual({ id: 1, title: 'Changed', complete: false });
      expect(spy).toHaveBeenLastCalledWith(true);
    });

    it('should return true if some of the entities are dirty', () => {
      widgetsStore.remove();
      widgetsStore.add([createWidget(), createWidget(), createWidget()]);
      collection.setHead();
      const spy = jest.fn();
      collection.isSomeDirty$.subscribe(spy);
      let isDirty = collection.someDirty();
      expect(isDirty).toBe(false);
      expect(spy).toHaveBeenLastCalledWith(false);
      widgetsStore.update(5, { title: 'Changed' });
      isDirty = collection.someDirty();
      expect(isDirty).toBe(true);
      expect(spy).toHaveBeenLastCalledWith(true);
      widgetsStore.update(4, { title: 'Changed' });
      isDirty = collection.someDirty();
      expect(isDirty).toBe(true);
      expect(spy).toHaveBeenLastCalledWith(true);
      widgetsStore.update(4, { title: 'Widget 4' });
      isDirty = collection.someDirty();
      expect(isDirty).toBe(true);
      expect(spy).toHaveBeenLastCalledWith(true);
      widgetsStore.update(5, { title: 'Widget 5' });
      isDirty = collection.someDirty();
      expect(isDirty).toBe(false);
      expect(spy).toHaveBeenLastCalledWith(false);
    });

    it('should return isDirty as observable by default', () => {
      const widget = createWidget();
      widgetsStore.add(widget);
      const isDirty = collection.isDirty(widget.id);
      expect(isDirty).toBeInstanceOf(Observable);
    });

    it('should return isDirty as observable', () => {
      const widget = createWidget();
      widgetsStore.add(widget);
      const isDirty = collection.isDirty(widget.id, true);
      expect(isDirty).toBeInstanceOf(Observable);
    });

    it('should return isDirty as boolean', () => {
      const widget = createWidget();
      widgetsStore.add(widget);
      const isDirty = collection.isDirty(widget.id, false);
      expect(typeof isDirty).toEqual('boolean');
    });

    it('should return true for hasHead()', () => {
      const widget = createWidget();
      widgetsStore.add(widget);
      expect(collection.hasHead(widget.id)).toBeTruthy();
    });

    describe('dirtyPath',()=>{
      it('should not return dirty for isPathDirty', function() {
        let isPathDirty: boolean;
        const firstWidget = createWidget();
        widgetsStore.add(firstWidget);
        isPathDirty = collection.isPathDirty(firstWidget.id, 'title');
        expect(isPathDirty).toBeFalsy();
      });

      it('should return dirty for isPathDirty', function() {
        let isPathDirty: boolean;
        let widget = createWidget();
        widgetsStore.add(widget);

        widgetsStore.update(widget.id, {
          ...widget,
          title: 'some other name'
        });

        isPathDirty = collection.isPathDirty(widget.id, 'title');
        expect(isPathDirty).toBeTruthy();
      });
    });


  });

  describe('Passing ids', () => {
    let widgetsStore = new WidgetsStore();
    let widgetsQuery = new WidgetsQuery(widgetsStore);
    _id = 0;
    let collection = new EntityDirtyCheckPlugin(widgetsQuery, { entityIds: [1, 2] });
    widgetsStore.add([createWidget(), createWidget(), createWidget()]);
    collection.setHead([1, 2]);

    it('should select given ids', () => {
      expect(collection.entities.size).toEqual(2);
    });

    it('should work with entity', () => {
      const spy = jest.fn();
      collection.isDirty(1).subscribe(spy);
      expect(spy).toHaveBeenLastCalledWith(false);
      widgetsStore.update(2, { title: 'Changed' });
      expect(spy).toHaveBeenLastCalledWith(false);
      widgetsStore.update(1, { title: 'Changed' });
      expect(spy).toHaveBeenLastCalledWith(true);
      widgetsStore.update(1, { title: 'Widget 1' });
      expect(spy).toHaveBeenLastCalledWith(false);
      widgetsStore.update(1, { title: 'Changed' });
      expect(spy).toHaveBeenLastCalledWith(true);
      expect(widgetsQuery.getEntity(1)).toEqual({ id: 1, title: 'Changed', complete: false });
      collection.reset(1);
      expect(widgetsQuery.getEntity(1)).toEqual({ id: 1, title: 'Widget 1', complete: false });
      widgetsStore.update(1, { title: 'Changed', complete: true });
      expect(widgetsQuery.getEntity(1)).toEqual({ id: 1, title: 'Changed', complete: true });
      const updateFn = (head, current) => {
        return {
          ...head,
          title: current.title
        };
      };
      collection.reset(1, { updateFn });
      expect(widgetsQuery.getEntity(1)).toEqual({ id: 1, title: 'Changed', complete: false });
      expect(spy).toHaveBeenLastCalledWith(true);
    });

    it('should return true if some of the entities are dirty', () => {
      widgetsStore.remove();
      _id = 3;
      widgetsStore.add([createWidget(), createWidget(), createWidget()]);
      collection = new EntityDirtyCheckPlugin(widgetsQuery, { entityIds: [4, 6] });
      collection.setHead();
      const spy = jest.fn();
      collection.someDirty$.subscribe(spy);
      let isDirty = collection.someDirty();
      expect(isDirty).toBe(false);
      expect(spy).toHaveBeenLastCalledWith(false);
      widgetsStore.update(5, { title: 'Changed' });
      isDirty = collection.someDirty();
      expect(isDirty).toBe(false);
      expect(spy).toHaveBeenLastCalledWith(false);
      widgetsStore.update(6, { title: 'Changed' });
      isDirty = collection.someDirty();
      expect(isDirty).toBe(true);
      expect(spy).toHaveBeenLastCalledWith(true);
      widgetsStore.update(4, { title: 'Changed' });
      isDirty = collection.someDirty();
      expect(isDirty).toBe(true);
      expect(spy).toHaveBeenLastCalledWith(true);
      widgetsStore.update(4, { title: 'Widget 4' });
      isDirty = collection.someDirty();
      expect(isDirty).toBe(true);
      expect(spy).toHaveBeenLastCalledWith(true);
      widgetsStore.update(5, { title: 'Widget 5' });
      isDirty = collection.someDirty();
      expect(isDirty).toBe(true);
      expect(spy).toHaveBeenLastCalledWith(true);
      widgetsStore.update(6, { title: 'Widget 6' });
      isDirty = collection.someDirty();
      expect(isDirty).toBe(false);
      expect(spy).toHaveBeenLastCalledWith(false);
    });

    it('should return false for hasHead()', () => {
      const widget = createWidget();
      widgetsStore.add(widget);
      expect(collection.hasHead(widget.id)).toBeFalsy();
      collection.setHead(widget.id);
      expect(collection.hasHead(widget.id)).toBeFalsy();
    });
  });
});
