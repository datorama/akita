import { isNumber, isString } from '@datorama/akita';

export function isID(idOrConfig: any): idOrConfig is number | string {
  return isNumber(idOrConfig) || isString(idOrConfig);
}
