import { AkitaConfig } from './config';

export type StoreConfigOptions = {
  name: string;
  resettable?: AkitaConfig['resettable'];
  cache?: { ttl: number };
  deepFreezeFn?: (o: any) => any;
  idKey?: string;
  producerFn?: AkitaConfig['producerFn'];
};

export type UpdatableStoreConfigOptions = {
  cache?: { ttl: number };
};

export const configKey = 'akitaConfig';

export function StoreConfig(metadata: StoreConfigOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (constructor: Function): void => {
    // TODO just use the StoreConfigOptions type
    const config: any = {
      // default value
      idKey: 'id',
      ...metadata,
    };
    // rename name to storeName
    config.storeName = config.name;
    delete config.name;

    // eslint-disable-next-line no-param-reassign
    constructor[configKey] = config;
  };
}
