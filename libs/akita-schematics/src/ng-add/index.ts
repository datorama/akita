import { chain, noop, Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { addModuleImportToRootModule, addPackageJsonDependency, getAppModulePath, getProjectFromWorkspace, getWorkspace, InsertChange, NodeDependency, NodeDependencyType } from 'schematics-utilities';
import * as ts from 'typescript';
import { Schema } from './schema';
import { addProviderToModule, applyChanges, getModuleFile, insertImport, isImported } from './utils';

function addPackageJsonDependencies(options: Schema): Rule {
  return (host: Tree, context: SchematicContext): Tree => {
    const dependencies: NodeDependency[] = [
      {
        type: NodeDependencyType.Default,
        version: '^6.0.0',
        name: '@datorama/akita',
      },
    ];

    if (options.withRouter || options.router) {
      dependencies.push({
        type: NodeDependencyType.Default,
        version: '^6.0.0',
        name: '@datorama/akita-ng-router-store',
      });
    }

    if (options.devtools) {
      dependencies.push({
        type: NodeDependencyType.Dev,
        version: '^6.0.0',
        name: '@datorama/akita-ngdevtools',
      });
    }

    if (options.httpEntityService) {
      dependencies.push({
        type: NodeDependencyType.Default,
        version: '^6.0.0',
        name: '@datorama/akita-ng-entity-service',
      });
    }

    if (options.firebaseEntityService) {
      dependencies.push({
        type: NodeDependencyType.Default,
        version: '^3.1.6',
        name: 'akita-ng-fire',
      });
    }

    dependencies.forEach((dependency) => {
      addPackageJsonDependency(host, dependency);
      context.logger.log('info', `✅️ Added "${dependency.name}" into ${dependency.type}`);
    });

    return host;
  };
}

function installPackageJsonDependencies(): Rule {
  return (host: Tree, context: SchematicContext): Tree => {
    context.addTask(new NodePackageInstallTask());
    context.logger.log('info', `🔍 Installing packages...`);

    return host;
  };
}

function getTsSourceFile(host: Tree, path: string): ts.SourceFile {
  const buffer = host.read(path);
  if (!buffer) {
    throw new SchematicsException(`Could not read file (${path}).`);
  }
  const content = buffer.toString();
  const source = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);

  return source;
}

function injectImports(options: Schema): Rule {
  // eslint-disable-next-line complexity
  return (host: Tree): Tree | undefined => {
    if (!options.router && !options.devtools && !options.httpEntityService && !options.firebaseEntityService) {
      return undefined;
    }
    const workspace = getWorkspace(host);
    const project = getProjectFromWorkspace(
      workspace,
      // Takes the first project in case it's not provided by CLI
      options.project ? options.project : Object.keys(workspace.projects)[0]
    );
    const modulePath = getAppModulePath(host, (project as any).architect.build.options.main);

    const moduleSource = getTsSourceFile(host, modulePath);
    const importModule = 'environment';
    const importPath = '../environments/environment';

    if (!isImported(moduleSource, importModule, importPath)) {
      const change = insertImport(moduleSource, modulePath, importModule, importPath);

      if (change) {
        const recorder = host.beginUpdate(modulePath);
        recorder.insertLeft((change as InsertChange).pos, (change as InsertChange).toAdd);
        host.commitUpdate(recorder);
      }
    }

    if (options.withRouter || options.router) {
      const routerChange = insertImport(moduleSource, modulePath, 'AkitaNgRouterStoreModule', '@datorama/akita-ng-router-store');
      if (routerChange) {
        const recorder = host.beginUpdate(modulePath);
        recorder.insertLeft((routerChange as InsertChange).pos, (routerChange as InsertChange).toAdd);
        host.commitUpdate(recorder);
      }
    }

    if (options.devtools) {
      const devtoolsChange = insertImport(moduleSource, modulePath, 'AkitaNgDevtools', '@datorama/akita-ngdevtools');
      if (devtoolsChange) {
        const recorder = host.beginUpdate(modulePath);
        recorder.insertLeft((devtoolsChange as InsertChange).pos, (devtoolsChange as InsertChange).toAdd);
        host.commitUpdate(recorder);
      }
    }

    if (options.httpEntityService) {
      const entityServiceChange = insertImport(moduleSource, modulePath, 'NG_ENTITY_SERVICE_CONFIG', '@datorama/akita-ng-entity-service');
      if (entityServiceChange) {
        const recorder = host.beginUpdate(modulePath);
        recorder.insertLeft((entityServiceChange as InsertChange).pos, (entityServiceChange as InsertChange).toAdd);
        host.commitUpdate(recorder);
      }
    }

    return host;
  };
}

function setSchematicsAsDefault(): Rule {
  return (host: Tree, context: SchematicContext): Tree => {
    // eslint-disable-next-line global-require,@typescript-eslint/no-var-requires
    const { exec } = require('child_process');

    exec('ng config cli.defaultCollection @datorama/akita', () => {
      context.logger.log('info', `✅️ Setting Akita schematics as default`);
    });
    return host;
  };
}

function addModuleToImports(options: Schema): Rule {
  // eslint-disable-next-line complexity
  return (host: Tree, context: SchematicContext): Tree => {
    const workspace = getWorkspace(host);
    const project = getProjectFromWorkspace(
      workspace,
      // Takes the first project in case it's not provided by CLI
      options.project ? options.project : Object.keys(workspace.projects)[0]
    );

    let importDevtools = '';
    let importRouter = '';
    let provideEntityServiceConfig = '';

    if ((options.withRouter || options.router) && options.devtools) {
      importRouter = `AkitaNgRouterStoreModule`;
    }

    if (options.devtools) {
      importDevtools = `environment.production ? [] : AkitaNgDevtools.forRoot()`;
    }

    if (options.httpEntityService) {
      provideEntityServiceConfig = `{ provide: NG_ENTITY_SERVICE_CONFIG, useValue: { baseUrl: 'https://jsonplaceholder.typicode.com' }}`;
    }

    if (importDevtools) {
      addModuleImportToRootModule(host, importDevtools, null as any, project as any);
    }

    if (importRouter) {
      addModuleImportToRootModule(host, importRouter, null as any, project as any);
    }

    if (provideEntityServiceConfig) {
      const modulePath = getAppModulePath(host, project.architect.build.options.main);
      const module = getModuleFile(host, modulePath);
      const providerChanges = addProviderToModule(module, modulePath, provideEntityServiceConfig, null);
      applyChanges(host, modulePath, providerChanges as InsertChange[]);
    }

    if (options.devtools) {
      context.logger.log('info', `🔥 AkitaNgDevtools is imported`);
    }

    if (options.withRouter || options.router) {
      context.logger.log('info', `🦄 AkitaNgRouterStoreModule is imported`);
    }

    if (options.httpEntityService) {
      context.logger.log('info', `🌈 NgEntityService is imported`);
    }

    return host;
  };
}

function log(): Rule {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  return (host: Tree, context: SchematicContext) => {
    context.logger.log('info', `👏 Create your first entity store by running: ng g af todos/todos`);

    return host;
  };
}

export function akitaNgAdd(options: Schema): Rule {
  return chain([
    options && options.skipPackageJson ? noop() : addPackageJsonDependencies(options),
    options && options.skipPackageJson ? noop() : installPackageJsonDependencies(),
    addModuleToImports(options),
    injectImports(options),
    setSchematicsAsDefault(),
    log(),
  ]);
}
