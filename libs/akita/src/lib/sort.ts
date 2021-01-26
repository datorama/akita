export enum Order {
  ASC = 'asc',
  DESC = 'desc',
}

/** @internal */
export function compareValues(key, order: Order = Order.ASC) {
  return (a, b): number => {
    if (!Object.prototype.hasOwnProperty.call(a, key) || !Object.prototype.hasOwnProperty.call(b, key)) {
      return 0;
    }

    const varA = typeof a[key] === 'string' ? a[key].toUpperCase() : a[key];
    const varB = typeof b[key] === 'string' ? b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return order === Order.DESC ? comparison * -1 : comparison;
  };
}
