import { skip } from 'rxjs/operators';
import { AkitaPlugin, EntityCollectionPlugin, getIDType, IDS } from '..';
import { createWidget, WidgetsQuery, WidgetsStore } from './setup';

class TestPlugin extends AkitaPlugin {
  constructor(protected query) {
    super(query);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  action() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  destroy() {}
}

type TestPluginEntityParams = {
  entityIds?: any;
};

class TestPluginEntity<E, P extends TestPlugin = TestPlugin> extends EntityCollectionPlugin<E, P> {
  constructor(protected query, params: TestPluginEntityParams = {}) {
    super(query, params.entityIds);
    this.activate();
    this.selectIds()
      .pipe(skip(1))
      .subscribe((ids) => this.activate(ids));
  }

  action(ids?: IDS) {
    this.forEachId(ids, (p) => p.action());
  }

  destroy(id?: getIDType<E>) {
    this.forEachId(id, (p) => p.destroy());
  }

  protected instantiatePlugin(): P {
    return new TestPlugin(this.query) as P;
  }
}

const widgetsStore = new WidgetsStore();
const widgetsQuery = new WidgetsQuery(widgetsStore);

describe('EntityCollectionPlugin', () => {
  describe('Entities Map', () => {
    beforeEach(() => {
      widgetsStore.remove();
      widgetsStore.add([createWidget(1), createWidget(2), createWidget(3)]);
    });

    describe('All', () => {
      const collection = new TestPluginEntity(widgetsQuery);

      it('should take all entities by default', () => {
        expect(collection.entities.size).toEqual(3);
      });

      it('should call the plugin method three times', () => {
        jest.spyOn(collection.getEntity(1), 'action');
        jest.spyOn(collection.getEntity(2), 'action');
        jest.spyOn(collection.getEntity(3), 'action');
        collection.action();
        expect(collection.getEntity(1).action).toHaveBeenCalledTimes(1);
        expect(collection.getEntity(2).action).toHaveBeenCalledTimes(1);
        expect(collection.getEntity(3).action).toHaveBeenCalledTimes(1);
      });

      it('should call the plugin method one time', () => {
        jest.spyOn(collection.getEntity(2), 'action');
        jest.spyOn(collection.getEntity(3), 'action');
        collection.action(2);
        expect(collection.getEntity(2).action).toHaveBeenCalledTimes(1);
        expect(collection.getEntity(3).action).not.toHaveBeenCalledTimes(1);
      });

      it('should call the plugin method two times', () => {
        jest.spyOn(collection.getEntity(2), 'action');
        jest.spyOn(collection.getEntity(3), 'action');
        collection.action([2, 3]);
        expect(collection.getEntity(2).action).toHaveBeenCalledTimes(1);
        expect(collection.getEntity(3).action).toHaveBeenCalledTimes(1);
      });

      it('should support adding', () => {
        widgetsStore.add(createWidget(4));
        expect(collection.entities.size).toEqual(4);
        jest.spyOn(collection.getEntity(4), 'action');
        collection.action();
        expect(collection.getEntity(4).action).toHaveBeenCalledTimes(1);
      });

      it('should support removing', () => {
        widgetsStore.remove(4);
        expect(collection.entities.size).toEqual(3);
      });
    });

    describe('One', () => {
      const collection = new TestPluginEntity(widgetsQuery, { entityIds: 1 });

      it('should take one entity', () => {
        expect(collection.entities.size).toEqual(1);
        expect(collection.getEntity(1)).toBeDefined();
        expect(collection.getEntity(2)).not.toBeDefined();
      });

      it('should should not add if not entity 1', () => {
        widgetsStore.add(createWidget(2));
        expect(collection.entities.size).toEqual(1);
      });

      it("should should remove if entity 1 doesn't exist anymore", () => {
        widgetsStore.remove(1);
        expect(collection.entities.size).toEqual(0);
      });

      it('should readd remove if entity 1 exist', () => {
        widgetsStore.remove(1);
        expect(collection.entities.size).toEqual(0);
        widgetsStore.add(createWidget(1));
        expect(collection.entities.size).toEqual(1);
      });

      it('should call the plugin method one time', () => {
        jest.spyOn(collection.getEntity(1), 'action');
        collection.action();
        expect(collection.getEntity(1).action).toHaveBeenCalledTimes(1);
      });
    });

    describe('Multiple', () => {
      const collection = new TestPluginEntity(widgetsQuery, { entityIds: [1, 2] });

      it('should take multi entity', () => {
        expect(collection.entities.size).toEqual(2);
        expect(collection.getEntity(1)).toBeDefined();
        expect(collection.getEntity(2)).toBeDefined();
        expect(collection.getEntity(3)).not.toBeDefined();
      });

      it("should should not add entities that doesn't in the passed list", () => {
        widgetsStore.add(createWidget(5), createWidget(6));
        expect(collection.entities.size).toEqual(2);
      });

      it('should should remove', () => {
        widgetsStore.remove(2);
        expect(collection.entities.size).toEqual(1);
      });

      it('should should re-add', () => {
        widgetsStore.remove(2);
        expect(collection.entities.size).toEqual(1);
        widgetsStore.add(createWidget(2));
        expect(collection.entities.size).toEqual(2);
      });

      it('should call the plugin method two times', () => {
        jest.spyOn(collection.getEntity(1), 'action');
        jest.spyOn(collection.getEntity(2), 'action');
        collection.action();
        expect(collection.getEntity(1).action).toHaveBeenCalledTimes(1);
        expect(collection.getEntity(2).action).toHaveBeenCalledTimes(1);
      });
    });
  });
});
