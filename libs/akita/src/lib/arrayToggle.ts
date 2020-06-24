/**
 * Adds or removes a value from an array by comparing its values. If a matching value exists it is removed, otherwise
 * it is added to the array.
 *
 * @param array The array to modify.
 * @param newValue The new value to toggle.
 * @param compare A compare function to determine equality of array values.
 */
export function arrayToggle<T>(array: T[], newValue: T, compare: (a: T, b: T) => boolean = (a, b) => a === b) {
  const oldIndex = array.findIndex((oldValue) => compare(newValue, oldValue));
  return oldIndex >= 0 ? array.filter((value, index) => index !== oldIndex) : [...array, newValue];
}
