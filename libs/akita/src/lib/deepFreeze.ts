/** @internal */
export function deepFreeze<T>(o: T): T {
  Object.freeze(o);

  const oIsFunction = typeof o === 'function';

  Object.getOwnPropertyNames(o).forEach((prop) => {
    if (
      Object.prototype.hasOwnProperty.call(o, prop) &&
      (oIsFunction ? prop !== 'caller' && prop !== 'callee' && prop !== 'arguments' : true) &&
      o[prop] !== null &&
      (typeof o[prop] === 'object' || typeof o[prop] === 'function') &&
      !Object.isFrozen(o[prop])
    ) {
      deepFreeze(o[prop]);
    }
  });

  return o;
}
