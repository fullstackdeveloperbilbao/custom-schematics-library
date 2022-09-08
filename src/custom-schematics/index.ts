/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { join, normalize, strings } from '@angular-devkit/core';
import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  noop,
  url,
  schematic,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  NodeDependencyType,
  addPackageJsonDependency,
} from '../utility/dependencies';
import { JSONFile } from '../utility/json-file';
import { latestVersions } from '../utility/latest-versions';
import { relativePathToWorkspaceRoot } from '../utility/paths';
import { getWorkspace, updateWorkspace } from '../utility/workspace';
import { Builders, ProjectType } from '../utility/workspace-models';

function updateTsConfig(packageName: string, ...paths: string[]) {
  return (host: Tree) => {
    if (!host.exists('tsconfig.json')) {
      return host;
    }

    const file = new JSONFile(host, 'tsconfig.json');
    const jsonPath = ['compilerOptions', 'paths', packageName];
    const value = file.get(jsonPath);
    file.modify(jsonPath, Array.isArray(value) ? [...value, ...paths] : paths);
  };
}

function addDependenciesToPackageJson() {
  return (host: Tree) => {
    [
      {
        type: NodeDependencyType.Dev,
        name: '@angular/compiler-cli',
        version: latestVersions.Angular,
      },
      {
        type: NodeDependencyType.Dev,
        name: '@angular-devkit/build-angular',
        version: latestVersions.DevkitBuildAngular,
      },
      {
        type: NodeDependencyType.Dev,
        name: 'ng-packagr',
        version: latestVersions['ng-packagr'],
      },
      {
        type: NodeDependencyType.Default,
        name: 'tslib',
        version: latestVersions['tslib'],
      },
      {
        type: NodeDependencyType.Dev,
        name: 'typescript',
        version: latestVersions['typescript'],
      },
    ].forEach((dependency) => addPackageJsonDependency(host, dependency));

    return host;
  };
}

function addLibToWorkspaceFile(
  options: any,
  projectRoot: string,
  projectName: string
): Rule {
  return updateWorkspace((workspace) => {
    if (workspace.projects.size === 0) {
      workspace.extensions.defaultProject = projectName;
    }

    workspace.projects.add({
      name: projectName,
      root: projectRoot,
      sourceRoot: `${projectRoot}/src`,
      projectType: ProjectType.Library,
      prefix: options.prefix,
      targets: {
        build: {
          builder: Builders.NgPackagr,
          defaultConfiguration: 'production',
          options: {
            project: `${projectRoot}/ng-package.json`,
          },
          configurations: {
            production: {
              tsConfig: `${projectRoot}/tsconfig.lib.prod.json`,
            },
            development: {
              tsConfig: `${projectRoot}/tsconfig.lib.json`,
            },
          },
        },
        test: {
          builder: Builders.Karma,
          options: {
            main: `${projectRoot}/src/test.ts`,
            tsConfig: `${projectRoot}/tsconfig.spec.json`,
            karmaConfig: `${projectRoot}/karma.conf.js`,
          },
        },
      },
    });
  });
}

function createPackageName(name: string) {
  const nameParts = name.split('/');
  if (nameParts.length == 1) return name;

  let packageName = '';
  for (let i = 0; i < nameParts.length; i++) {
    if (i == 0) packageName += nameParts[i] + '/';
    else if (i != nameParts.length - 1) packageName += nameParts[i] + '-';
    else packageName += nameParts[i];
  }
  return packageName;
}

export default function (options: any): Rule {
  return async (host: Tree, _context: SchematicContext) => {
    const prefix = options.prefix;

    // If scoped project (i.e. "@foo/bar"), convert projectDir to "foo/bar".
    const optionsName = options.name;
    // _context.logger.info('optionsName: ' + optionsName);
    const packageName = createPackageName(optionsName);
    // _context.logger.info('packageName: ' + packageName);
    if (/^@.*\/.*/.test(options.name)) {
      const name = options.name.split('/')[options.name.split('/').length - 1];
      options.name = name;
    }

    const workspace = await getWorkspace(host);
    const newProjectRoot =
      (workspace.extensions.newProjectRoot as string | undefined) || '';

    let folderName = optionsName.startsWith('@')
      ? optionsName.substr(1)
      : optionsName;
    // _context.logger.info('folderName: ' + folderName);
    if (/[A-Z]/.test(folderName)) {
      folderName = strings.dasherize(folderName);
    }
    // _context.logger.info('folderName: ' + folderName);
    const projectRoot = join(normalize(newProjectRoot), folderName);
    const distRoot = `dist/${folderName}`;
    const sourceDir = `${projectRoot}/src/lib`;
    const tsDir = `${projectRoot}/src/public-api.ts`;
    // _context.logger.info('sourceDir: ' + sourceDir);
    // _context.logger.info('tsDir: ' + tsDir);

    const templateSource = apply(url('./files'), [
      applyTemplates({
        ...strings,
        ...options,
        packageName: optionsName,
        projectRoot,
        distRoot,
        relativePathToWorkspaceRoot: relativePathToWorkspaceRoot(projectRoot),
        prefix,
        angularLatestVersion: latestVersions.Angular.replace(/~|\^/, ''),
        tsLibLatestVersion: latestVersions['tslib'].replace(/~|\^/, ''),
        folderName,
      }),
      move(projectRoot),
    ]);

    // _context.logger.info('options.name: ' + options.name);
    // _context.logger.info('prefix: ' + prefix);
    return chain([
      mergeWith(templateSource),
      addLibToWorkspaceFile(options, projectRoot, packageName),
      options.skipPackageJson ? noop() : addDependenciesToPackageJson(),
      options.skipTsConfig ? noop() : updateTsConfig(packageName, tsDir),
      schematic('module', {
        name: options.name,
        commonModule: false,
        flat: true,
        path: sourceDir,
        project: optionsName,
      }),
      schematic('component', {
        name: options.name,
        selector: `${prefix}-${options.name}`,
        inlineStyle: true,
        inlineTemplate: true,
        flat: true,
        path: sourceDir,
        export: true,
        project: packageName,
      }),
      schematic('service', {
        name: options.name,
        flat: true,
        path: sourceDir,
        project: optionsName,
      }),
      (_tree: Tree, context: SchematicContext) => {
        if (!options.skipPackageJson && !options.skipInstall) {
          context.addTask(new NodePackageInstallTask());
        }
      },
    ]);
  };
}
