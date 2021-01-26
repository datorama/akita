/**
 * @internal
 *
 * @example
 *
 * getValue(state, 'todos.ui')
 *
 */
export function getValue(obj: any, prop: string): any {
  /** return the whole state  */
  if (prop.split('.').length === 1) {
    return obj;
  }
  const removeStoreName = prop.split('.').slice(1).join('.');
  return removeStoreName.split('.').reduce((acc: any, part: string) => acc && acc[part], obj);
}
