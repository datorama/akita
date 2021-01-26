/** @internal */
export function sortByOptions(options, config): any {
  const optionsCopy = { ...options };
  optionsCopy.sortBy = options.sortBy || (config && config.sortBy);
  optionsCopy.sortByOrder = options.sortByOrder || (config && config.sortByOrder);
  return optionsCopy;
}
