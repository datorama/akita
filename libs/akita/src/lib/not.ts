/** @internal */
// eslint-disable-next-line @typescript-eslint/ban-types
export function not(pred: Function): Function {
  return (...args): boolean => {
    return !pred(...args);
  };
}
