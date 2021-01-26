import { basename, dirname, normalize, Path } from '@angular-devkit/core';

export interface Location {
  name: string;
  path: Path;
}

export function parseName(options: any): Location {
  const { name, path } = options;
  const nameWithoutPath = basename(name as Path);
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  const namePath = dirname((path + '/' + name) as Path);
  const normalizedPath = normalizePath(nameWithoutPath, namePath, options);

  return {
    name: nameWithoutPath,
    path: normalizedPath,
  };
}

function normalizePath(name: string, namePath: Path, options: any): Path {
  const { dirName, feature, flat } = options;
  const basePath = `/${namePath}`;

  if (!feature) {
    return normalize(basePath);
  }

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const dirPath = `${basePath}/${dirName}`;
  const fullPath = flat ? dirPath : `${dirPath}/${name}`;

  return normalize(fullPath);
}
