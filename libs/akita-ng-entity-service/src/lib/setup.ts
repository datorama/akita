/* eslint-disable max-classes-per-file */
import { EntityState, EntityStore, ID, StoreConfig } from '@datorama/akita';
import { NgEntityServiceConfig } from './ng-entity-service.config';
import { NgEntityService } from './ng-entity.service';

export interface TestEntity {
  id: ID;
  foo: string;
  bar: number;
}

export type TestEntityState = EntityState<TestEntity>;

export const storeName = 'test-store';

@StoreConfig({ name: storeName })
export class TestStore extends EntityStore<TestEntityState, TestEntity> {}

@NgEntityServiceConfig()
export class TestService extends NgEntityService<TestEntityState> {
  public constructor(readonly store: TestStore) {
    super(store);
  }
}

@NgEntityServiceConfig()
export class TestServiceWithInlineConfig extends NgEntityService<TestEntityState> {
  public constructor(readonly store: TestStore) {
    super(store, { baseUrl: 'inline-url', resourceName: 'inline-res' });
  }
}

@NgEntityServiceConfig({
  baseUrl: 'decorator-url',
  resourceName: 'decorator-res',
})
export class TestServiceWithDecoratorConfig extends NgEntityService<TestEntityState> {
  public constructor(readonly store: TestStore) {
    super(store);
  }
}

@NgEntityServiceConfig({
  baseUrl: 'decorator-url',
  resourceName: 'decorator-res',
})
export class TestServiceWithDecoratorAndInlineConfig extends NgEntityService<TestEntityState> {
  public constructor(readonly store: TestStore) {
    super(store, { baseUrl: 'inline-url', resourceName: 'inline-res' });
  }
}

@NgEntityServiceConfig({ baseUrl: 'decorator-url' })
export class TestServiceWithMixedConfig extends NgEntityService<TestEntityState> {
  public constructor(readonly store: TestStore) {
    super(store, { resourceName: 'inline-res' });
  }
}
