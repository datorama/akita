import { chain, Rule, schematic, SchematicContext, Tree } from '@angular-devkit/schematics';
import { ActiveStateType } from '../entity-store/models/active-state.enum';

const enum EntityServiceType {
  http = 'Http',
  firebase = 'Firebase',
  default = 'Default',
}

export default function (options: any): Rule {
  const plain = options.plain;
  const withModule = options.withModule;
  const entityService = plain ? 'default' : options.entityService;

  let serviceSchematic: 'http-entity-service' | 'firebase-entity-service' | 'akita-service';
  if (entityService === EntityServiceType.http) {
    serviceSchematic = 'http-entity-service';
  } else if (entityService === EntityServiceType.firebase) {
    serviceSchematic = 'firebase-entity-service';
  } else {
    serviceSchematic = 'akita-service';
  }

  let files = [
    schematic(plain ? 'store' : 'entity-store', {
      flat: options.flat,
      name: options.name,
      path: options.path,
      project: options.project,
      dirName: options.dirName,
      feature: true,
      spec: options.spec,
      withActive: entityService === EntityServiceType.firebase ? ActiveStateType.Single : options.withActive,
      idType: entityService === EntityServiceType.firebase ? 'string' : options.idType,
    }),
    schematic(plain ? 'query' : 'entity-query', {
      flat: options.flat,
      name: options.name,
      path: options.path,
      project: options.project,
      spec: options.spec,
      dirName: options.dirName,
      feature: true,
    }),
    schematic(serviceSchematic, {
      flat: options.flat,
      module: options.module,
      name: options.name,
      path: options.path,
      project: options.project,
      spec: options.spec,
      plain,
      dirName: options.dirName,
      feature: true,
    }),
  ];

  if (!plain) {
    files = files.concat([
      schematic('model', {
        flat: options.flat,
        module: options.module,
        name: options.name,
        path: options.path,
        project: options.project,
        spec: options.spec,
        dirName: options.dirName,
        feature: true,
      }),
    ]);
  }

  if (withModule) {
    files = files.concat([
      schematic('withModule', {
        flat: options.flat,
        module: options.module,
        name: options.name,
        path: options.path,
        project: options.project,
        spec: options.spec,
        dirName: options.dirName,
        feature: true,
      }),

      schematic('withComponent', {
        flat: options.flat,
        module: options.module,
        name: options.name,
        path: options.path,
        project: options.project,
        spec: options.spec,
        dirName: options.dirName,
        styleext: options.styleext,
        entity: !options.plain,
        feature: true,
      }),
    ]);
  }
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  return (host: Tree, context: SchematicContext) => {
    return chain(files)(host, context);
  };
}
