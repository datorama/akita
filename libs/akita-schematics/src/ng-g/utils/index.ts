import { camelize, capitalize, classify, dasherize, decamelize, featurePath, group, plural, singular, underscore } from './string';

export * from './parse-name';
export * from './project';
export * from './workspace';

export const stringUtils = {
  dasherize,
  decamelize,
  camelize,
  classify,
  underscore,
  group,
  capitalize,
  featurePath,
  singular,
  plural,
};

export { isIvyEnabled } from './angular-utils';

export {
  findNodes,
  getSourceNodes,
  getDecoratorMetadata,
  getContentOfKeyLiteral,
  insertAfterLastOccurrence,
  insertImport,
  addBootstrapToModule,
  addDeclarationToModule,
  addExportToModule,
  addImportToModule,
  addProviderToModule,
  replaceImport,
  containsProperty,
} from './ast-utils';

export { Host, Change, NoopChange, InsertChange, RemoveChange, ReplaceChange, createReplaceChange, createChangeRecorder, commitChanges } from './change';

export { AppConfig, getWorkspace, getWorkspacePath } from './config';

export { findModule, findModuleFromOptions, buildRelativePath, ModuleOptions } from './find-module';

export { findPropertyInAstObject } from './json-utilts';

export { getProjectPath, getProject } from './project';

export { parseName } from './parse-name';
