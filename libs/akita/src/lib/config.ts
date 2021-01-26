export interface AkitaConfig {
  /**
   * Whether to allowed the reset() stores functionality
   */
  resettable?: boolean;
  ttl?: number;
  producerFn?: (state: any, fn: any) => any;
}

let CONFIG: AkitaConfig = {
  resettable: false,
  ttl: null,
  producerFn: undefined,
};

export function akitaConfig(config: AkitaConfig): void {
  CONFIG = { ...CONFIG, ...config };
}

/** @internal */
export function getAkitaConfig(): AkitaConfig {
  return CONFIG;
}

export function getGlobalProducerFn(): AkitaConfig['producerFn'] {
  return CONFIG.producerFn;
}
