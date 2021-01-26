import { Tree } from '@angular-devkit/schematics';
import { getWorkspace } from 'schematics-utilities';

export function getProjectPath(host: Tree, options: { project?: string | undefined; path?: string | undefined }): string {
  const workspace = getWorkspace(host);
  const firstWorkspaceProject = Object.keys(workspace.projects)[0];
  const project = workspace.projects[options.project || firstWorkspaceProject];

  if (project.root.substr(-1) === '/') {
    project.root = project.root.substr(0, project.root.length - 1);
  }

  if (options.path === undefined) {
    const projectDirName = project.projectType === 'application' ? 'app' : 'lib';
    const root = project.sourceRoot ? `/${project.sourceRoot}/` : `/${project.root}/src/`;
    return `${root}${projectDirName}`;
  }

  return options.path;
}

export function isWorkspaceSchema(workspace: any): boolean {
  return !!(workspace && workspace.projects);
}

// TODO getProject is only ever called with getProject(host: Tree, options: any)
export function getProject(workspaceOrHost: any, projectName: string): any {
  const workspace = isWorkspaceSchema(workspaceOrHost) ? workspaceOrHost : getWorkspace(workspaceOrHost);

  return workspace.projects[projectName];
}
