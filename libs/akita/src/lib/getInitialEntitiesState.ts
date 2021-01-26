import { EntityState } from './types';

/** @internal */
export const getInitialEntitiesState = (): EntityState => ({
  entities: {},
  ids: [],
  loading: true,
  error: null,
});
