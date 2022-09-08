import {
  chain,
  externalSchematic,
  noop,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { JSONFile } from '../utility/json-file';
import { join, normalize, strings } from '@angular-devkit/core';
import { getWorkspace } from '../utility/workspace';

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function custom(_options: any): Rule {
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

  return async (tree: Tree, _context: SchematicContext) => {
    const packageName = _options.name;
    const workspace = await getWorkspace(tree);
    const newProjectRoot = (workspace.extensions.newProjectRoot as string | undefined) || '';
    let folderName = packageName.startsWith('@') ? packageName.substr(1) : packageName;
    if (/[A-Z]/.test(folderName)) {
      folderName = strings.dasherize(folderName);
    }
    const projectRoot = join(normalize(newProjectRoot), folderName);
    const sourceDir = `${projectRoot}/src/lib`;
    return chain([
      externalSchematic('@schematics/angular', 'library', _options),
      _options.skipTsConfig ? noop() : updateTsConfig(packageName, sourceDir),
    ]);
  };
}
