/** @internal */
export function isNil(v: any): v is null | undefined {
  return v === null || v === undefined;
}
