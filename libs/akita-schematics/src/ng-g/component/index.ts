import { apply, branchAndMerge, chain, mergeWith, move, Rule, SchematicContext, template, Tree, url } from '@angular-devkit/schematics';
import { getProject, getProjectPath, parseName, stringUtils } from '../utils';
import { dasherize } from '../utils/string';

function buildSelector(options: any, projectPrefix: string): string {
  let selector = dasherize(options.name);
  if (options.prefix) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    selector = `${options.prefix}-${selector}`;
  } else if (options.prefix === undefined && projectPrefix) {
    selector = `${projectPrefix}-${selector}`;
  }

  return selector;
}

export default function (options: any): Rule {
  return (host: Tree, context: SchematicContext) => {
    const project = getProject(host, options.project);

    options.path = getProjectPath(host, options);

    const parsedPath = parseName(options);

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    (parsedPath as any).path = parsedPath.path.replace(`${options.dirName}`, `${parsedPath.name}/`);

    options.name = parsedPath.name;
    options.path = parsedPath.path;
    options.selector = options.selector || buildSelector(options, project.prefix);

    const templateSource = apply(url('./files'), [
      template({
        ...stringUtils,
        ...options,
      }),
      move(parsedPath.path),
    ]);

    return chain([branchAndMerge(chain([mergeWith(templateSource)]))])(host, context);
  };
}
