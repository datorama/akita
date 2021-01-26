/** @internal */
export class AkitaError extends Error {}

/** @internal */
export function assertStoreHasName(name: string, className: string): void {
  if (!name) {
    console.error(`@StoreConfig({ name }) is missing in ${className}`);
  }
}
