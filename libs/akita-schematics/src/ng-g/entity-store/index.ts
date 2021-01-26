import { apply, branchAndMerge, chain, filter, mergeWith, move, noop, Rule, SchematicContext, template, Tree, url } from '@angular-devkit/schematics';
import { getProjectPath, parseName, stringUtils } from '../utils';
import { ActiveStateType } from './models/active-state.enum';
import { EntityStoreOptions } from './models/entity-store-options.model';

function getExtensionState({ idType, name, withActive }: EntityStoreOptions) {
  const isID = idType === 'string' || idType === 'number';
  const entityName = name.split('/').pop();
  const entityType = stringUtils.singular(stringUtils.classify(entityName));
  const generics = [entityType];
  if (isID) {
    generics.push(idType);
  }
  const extensions = [`EntityState<${generics.join(', ')}>`];
  if (withActive) {
    let activeState = withActive === ActiveStateType.Single ? `ActiveState` : `MultiActiveState`;
    activeState += isID ? `<${idType}>` : ``;
    extensions.push(activeState);
  }
  return extensions.join(', ');
}

function getImportsString({ withActive }: EntityStoreOptions) {
  const imports = ['EntityState', 'EntityStore', 'StoreConfig'];
  if (withActive) {
    imports.push(`${withActive}State`);
  }
  return imports.join(', ');
}

export default function (options: EntityStoreOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    options.path = getProjectPath(host, options);

    // Build state based on options
    const extensionState = getExtensionState(options);
    const importsString = getImportsString(options);

    const parsedPath = parseName(options);
    options.name = parsedPath.name;
    options.path = parsedPath.path;
    const templateSource = apply(url('./files'), [
      options.spec ? noop() : filter((path) => !path.endsWith('.spec.ts')),
      template({
        ...stringUtils,
        ...options,
        extensionState,
        importsString,
      }),
      move(parsedPath.path),
    ]);

    return chain([branchAndMerge(chain([mergeWith(templateSource)]))])(host, context);
  };
}
