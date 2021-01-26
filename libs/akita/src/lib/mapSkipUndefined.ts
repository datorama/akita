/** @internal */
export function mapSkipUndefined<T, V>(arr: T[], callbackFn: (value: T, index: number, array: T[]) => V): any[] {
  return arr.reduce((result, value, index, array) => {
    const val = callbackFn(value, index, array);
    if (val !== undefined) {
      result.push(val);
    }
    return result;
  }, []);
}
