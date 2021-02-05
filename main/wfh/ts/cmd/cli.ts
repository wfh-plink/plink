/// <reference path="./cfont.d.ts" />
// tslint:disable: max-line-length
import commander from 'commander';
import chalk from 'chalk';
// import * as store from '../store';
import * as tp from './types';
import * as pkgMgr from '../package-mgr';
// import '../tsc-packages-slice';
import {packages4Workspace} from '../package-mgr/package-list-helper';
import * as _ from 'lodash';
import { isDrcpSymlink, sexyFont, getRootDir, boxString } from '../utils/misc';
import _scanNodeModules from '../utils/symlinks';
import fs from 'fs';
import Path from 'path';
import semver from 'semver';
import {CommandOverrider} from './override-commander';
import {initInjectorForNodePackages} from '../package-runner';
import {hl, hlDesc, arrayOptionFn} from './utils';
import {getLogger} from 'log4js';
const pk = require('../../../package.json');
// const WIDTH = 130;
const log = getLogger('plink.cli');

export const cliPackageArgDesc = 'Single or multiple package names, the "scope" name part can be omitted,' +
'if the scope name (the part between "@" "/") are listed configuration property "packageScopes"';

export async function createCommands(startTime: number) {
  process.title = 'Plink';
  // const {stateFactory}: typeof store = require('../store');
  await import('./cli-slice');
  // stateFactory.configureStore();


  let cliExtensions: string[] | undefined;
  const program = new commander.Command('plink')
  .description(chalk.cyan('A pluggable monorepo and multi-repo management tool'))
  .action(args => {
    // tslint:disable-next-line: no-console
    console.log(sexyFont('PLink').string);
    // tslint:disable-next-line: no-console
    console.log(program.helpInformation());
    // tslint:disable-next-line: no-console
    console.log(`\nversion: ${pk.version} ${isDrcpSymlink ? chalk.yellow('(symlinked)') : ''} `);
    if (cliExtensions && cliExtensions.length > 0) {
      // tslint:disable-next-line: no-console
      console.log(`Found ${cliExtensions.length} command line extension` +
      `${cliExtensions.length > 1 ? 's' : ''}: ${cliExtensions.map(pkg => chalk.blue(pkg)).join(', ')}`);
    }
  });

  program.version(pk.version, '-v, --vers', 'output the current version');
  program.addHelpCommand('help [command]', 'show help information, same as "-h". ');

  const overrider = new CommandOverrider(program);
  let wsState: pkgMgr.WorkspaceState | undefined;
  if (process.env.PLINK_SAFE !== 'true') {
    const {getState: getPkgState, workspaceKey} = require('../package-mgr') as typeof pkgMgr;
    wsState = getPkgState().workspaces.get(workspaceKey(process.cwd()));
    if (wsState != null) {
      overrider.forPackage(null, program => {
        spaceOnlySubWfhCommand(program);
        subWfhCommand(program);
      });
    } else {
      overrider.forPackage(null, subWfhCommand);
    }
  } else {
    overrider.forPackage(null, subWfhCommand);
  }

  if (process.env.PLINK_SAFE !== 'true') {
    cliExtensions = loadExtensionCommand(program, wsState, overrider);
  } else {
    // tslint:disable-next-line: no-console
    console.log('Value of environment varaible "PLINK_SAFE" is true, skip loading extension');
  }

  overrider.appendGlobalOptions();
  try {
    await program.parseAsync(process.argv, {from: 'node'});
  } catch (e) {
    log.error('Failed to execute command due to:' + chalk.redBright(e.message), e.stack);
    process.exit(1);
  }
}

function subWfhCommand(program: commander.Command) {
  /** command init
   */
  const initCmd = program.command('init [work-directory]')
  .description('Initialize and update work directory, generate basic configuration files for project and component packages,' +
    ' calculate hoisted transitive dependencies, and run "npm install" in current directory.',
    {
      'work-directory': 'A relative or abosolute directory path, use "." to specify current directory,\n  ommitting this argument meaning:\n' +
        '  - If current directory is already a "work directory", update it.\n' +
        '  - If current directory is not a work directory (maybe at repo\'s root directory), update the latest updated work' +
        ' directory.'
    })
  .option('-f, --force', 'Force run "npm install" in specific workspace directory', false)
  .option('--lint-hook, --lh', 'Create a git push hook for code lint', false)
  // .option('--yarn', 'Use Yarn to install component peer dependencies instead of using NPM', false)
  .option('--production', 'Add "--production" or "--only=prod" command line argument to "yarn/npm install"', false)
  .action(async (workspace?: string) => {
    // tslint:disable-next-line: no-console
    console.log(sexyFont('PLink').string);
    await (await import('./cli-init')).default(initCmd.opts() as tp.InitCmdOptions, workspace);
  });
  // withGlobalOptions(initCmd);

  const updateDirCmd = program.command('update-dir')
  .description('Run this command to sync internal state when whole workspace directory is renamed or moved.\n' +
  'Because we store absolute path info of each package in internal state, and it will become invalid after you rename or move directory')
  .action(async (workspace: string) => {
    await (await import('./cli-ls')).checkDir(updateDirCmd.opts() as any);
  });
  // withGlobalOptions(updateDirCmd);

  /**
   * command project
   */
  program.command('project [add|remove] [project-dir...]')
  .description('Associate, disassociate or list associated project folders, late on Plink will' +
    'Scan source code directories from associated projects', {
      'add|remove': 'Specify whether Associate to a project or Disassociate from a project',
      'project-dir': 'Specify target project repo directory (absolute path or relative path to current directory)' +
        ', specify multiple project by seperating with space character'
    })
  .action(async (action: 'add'|'remove'|undefined, projectDir: string[]) => {
    // tslint:disable-next-line: no-console
    console.log(sexyFont('PLink').string);
    (await import('./cli-project')).default(action, projectDir);
  });

  /**
   * command lint
   */
  const lintCmd = program.command('lint [package...]')
  .description('source code style check', {
    package: cliPackageArgDesc
  })
  .option('--pj <project1,project2...>', 'lint only TS code from specific project', arrayOptionFn, [])
  .option('--fix', 'Run eslint/tslint fix, this could cause your source code being changed unexpectedly', false)
  .action(async packages => {
    await (await import('./cli-lint')).default(packages, lintCmd.opts() as any);
  });
  // withGlobalOptions(lintCmd);
  lintCmd.usage(lintCmd.usage() +
    hl('\ndrcp lint --pj <project-dir..> [--fix]') + ' Lint TS files from specific project directory\n' +
    hl('\ndrcp lint <component-package..> [--fix]') + ' Lint TS files from specific component packages');

  /**
   * command clean
   */
  program.command('cs').alias('clear-symlinks')
  .description('Clear symlinks from node_modules, do this before run "npm install" in root directory, if there is any symlinks in current node_modules')
  // .option('--only-symlink', 'Clean only symlinks, not dist directory', false)
  .action(async () => {
    const scanNodeModules: typeof _scanNodeModules = require('../utils/symlinks').default;
    await scanNodeModules('all');
  });

  /**
   * command upgrade
   */
  program.command('upgrade')
  .alias('install')
  .description('Reinstall local Plink along with other dependencies.' +
    ' (Unlike "npm install" which does not work with node_modules that might contain symlinks)')
  .action(async () => {
    await (await import('./cli-link-plink')).reinstallWithLinkedPlink();
  });

  // program.command('dockerize <workspace-dir>')
  // .description(chalk.gray('[TBI] Generate Dockerfile for specific workspace directory, and generate docker image'));

  // program.command('pkg <workspace-dir>')
  // .description(chalk.gray('[TBI] Use Pkg (https://github.com/vercel/pkg) to package Node.js project into an executable '));

  /**
   * command ls
   */
  const listCmd = program.command('ls').alias('list')
  .option('-j, --json', 'list linked dependencies in form of JSON', false)
  .description('If you want to know how many packages will actually run, this command prints out a list and the priorities, including installed packages')
  .action(async () => {
    await (await import('./cli-ls')).default(listCmd.opts() as any);
  });
  // withGlobalOptions(listCmd);

  /**
   * Bump command
   */
  const bumpCmd = program.command('bump [package...]')
    .description('bump package.json version number for specific package, same as "npm version" does',
      {package: cliPackageArgDesc})
    .option<string[]>('--pj, --project <project-dir,...>', 'only bump component packages from specific project directory',
      (value, prev) => {
        prev.push(...value.split(',')); return prev;
      }, [])
    .option('-i, --incre-version <value>',
      'version increment, valid values are: major, minor, patch, prerelease', 'patch')
    .action(async (packages: string[]) => {
      (await import('./cli-bump')).default({...bumpCmd.opts() as tp.BumpOptions, packages});
    });
  // withGlobalOptions(bumpCmd);
  // bumpCmd.usage(bumpCmd.usage() + '\n' + hl('plink bump <package> ...') + ' to recursively bump package.json from multiple directories\n' +
  //   hl('plink bump <dir> -i minor') + ' to bump minor version number, default is patch number');

  /**
   * Pack command
   */
  const packCmd = program.command('pack [package...]')
    .description('npm pack every pakage into tarball files', {package: cliPackageArgDesc})
    .option('--dir <package directory>', 'pack packages by specifying directories', arrayOptionFn, [])
    .option('-w,--workspace <workspace-dir>', 'pack packages which are linked as dependency of specific workspaces',
      arrayOptionFn, [])
    .option('--pj, --project <project-dir>',
      'project directories to be looked up for all packages which need to be packed to tarball files',
      arrayOptionFn, [])
    .action(async (packages: string[]) => {
      await (await import('./cli-pack')).pack({...packCmd.opts() as tp.PackOptions, packages});
    });
  // withGlobalOptions(packCmd);
  packCmd.usage(packCmd.usage() + '\nBy default, run "npm pack" for each linked package which are dependencies of current workspace');

  /**
   * Pack command
   */
  const publishCmd = program.command('publish [package...]')
    .description('run npm publish', {package: cliPackageArgDesc})
    .option('--dir <package directory>', 'publish packages by specifying directories', arrayOptionFn, [])
    .option<string[]>('--pj, --project <project-dir,...>',
    'project directories to be looked up for all packages which need to be packed to tarball files',
      (value, prev) => {
        prev.push(...value.split(',')); return prev;
      }, [])
    .option('-w,--workspace <workspace-dir>', 'publish packages which are linked as dependency of specific workspaces',
      arrayOptionFn, [])
    .option('--public', 'same as "npm publish" command option "--access public"', false)
    .action(async (packages: string[]) => {
      await (await import('./cli-pack')).publish({...publishCmd.opts() as tp.PublishOptions, packages});
    });
  // withGlobalOptions(publishCmd);

  const analysisCmd = program.command('analyze')
    .alias('analyse')
    .description('Use Typescript compiler to parse source code, draw a dependence graph with DFS algarithm')
    .option('-d, --dir <directory>',
      'specify target directory, scan JS/JSX/TS/TSX files under target directory')
    .option('-f, --file <file>',
      'specify target TS/JS(X) files (multiple file with more options "-f <file> -f <glob>")', arrayOptionFn, [])
    .option('-j', 'Show result in JSON', false)
    .action(async (packages: string[]) => {
      return (await import('./cli-analyze')).default(packages, analysisCmd.opts() as tp.AnalyzeOptions);
    });

  analysisCmd.usage(analysisCmd.usage() + '\n' +
    'e.g.\n  ' + chalk.blue('plink analyze -f "packages/foobar1/**/*" -f packages/foobar2/ts/main.ts'));
  // withGlobalOptions(analysisCmd);
}

function spaceOnlySubWfhCommand(program: commander.Command) {
  /** command run*/
  const runCmd = program.command('run <target> [arguments...]')
  .description('Run specific module\'s exported function\n')
  .action(async (target: string, args: string[]) => {
    await (await import('../package-runner')).runSinglePackage({target, args});
  });
  // withGlobalOptions(runCmd);
  runCmd.usage(runCmd.usage() + '\n' + chalk.green('plink run <target> [arguments...]\n') +
  `e.g.\n  ${chalk.green('plink run forbar-package/dist/file#function argument1 argument2...')}\n` +
  'execute exported function of TS/JS file from specific package or path\n\n' +
  '<target> - JS or TS file module path which can be resolved by Node.js (ts-node) followed by "#" and exported function name,\n' +
  'e.g. \n' +
  chalk.green('package-name/dist/foobar.js#myFunction') +
  ', function can be async which returns Promise\n' +
  chalk.green('node_modules/package-dir/dist/foobar.ts#myFunction') +
  ', relative or absolute path\n');


  /**
   * tsc command
   */
  const tscCmd = program.command('tsc [package...]')
  .description('Run Typescript compiler to compile source code for target packages, ' +
  'which have been linked to current work directory', {package: cliPackageArgDesc})
  .option('-w, --watch', 'Typescript compiler watch mode', false)
  .option('--pj, --project <project-dir,...>', 'Compile only specific project directory', (v, prev) => {
    prev.push(...v.split(',')); return prev;
  }, [] as string[])
  // .option('--ws,--workspace <workspace-dir>', 'only include those linked packages which are dependency of specific workspaces',
  //   arrayOptionFn, [])
  .option('--jsx', 'includes TSX file', false)
  .option('--ed, --emitDeclarationOnly', 'Typescript compiler option: --emitDeclarationOnly.\nOnly emit ‘.d.ts’ declaration files.', false)
  .option('--source-map <inline|file>', 'Source map style: "inline" or "file"', 'inline')
  .option('--copath, --compiler-options-paths <pathMapJson>',
    'Add more "paths" property to compiler options. ' +
    '(e.g. --copath \'{\"@/*":["/Users/worker/ocean-ui/src/*"]}\')', (v, prev) => {
    prev.push(...v.split(',')); return prev;
  }, [] as string[])
  .action(async (packages: string[]) => {
    const opt = tscCmd.opts();
    const tsc = await import('../ts-cmd');

    await tsc.tsc({
      package: packages,
      project: opt.project,
      watch: opt.watch,
      sourceMap: opt.sourceMap,
      jsx: opt.jsx,
      ed: opt.emitDeclarationOnly,
      pathsJsons: opt.compilerOptionsPaths
    });
  });
  // withGlobalOptions(tscCmd);
  tscCmd.usage(tscCmd.usage() + '\n' + 'Run gulp-typescript to compile Node.js side Typescript files.\n\n' +
  'It compiles \n  "<package-directory>/ts/**/*.ts" to "<package-directory>/dist",\n' +
  '  or\n  "<package-directory>/isom/**/*.ts" to "<package-directory>/isom"\n for all @wfh packages.\n' +
  'I suggest to put Node.js side TS code in directory `ts`, and isomorphic TS code (meaning it runs in ' +
  'both Node.js and Browser) in directory `isom`.\n' +
  hlDesc('plink tsc\n') + 'Compile linked packages that are dependencies of current workspace (you shall run this command only in a workspace directory)\n' +
  hlDesc('plink tsc <package..>\n') + ' Only compile specific packages by providing package name or short name\n' +
  hlDesc('plink tsc [package...] -w\n') + ' Watch packages change and compile when new typescript file is changed or created\n\n');
}

function loadExtensionCommand(program: commander.Command, ws: pkgMgr.WorkspaceState | undefined, overrider: CommandOverrider): string[] {
  if (ws == null)
    return [];
  initInjectorForNodePackages();
  const availables: string[] = [];
  for (const pk of packages4Workspace()) {
    const dr = pk.json.dr;
    if (dr == null || dr.cli == null)
      continue;
    const [pkgFilePath, funcName] = (dr.cli as string).split('#');

    availables.push(pk.name);

    try {
      overrider.forPackage(pk, pkgFilePath, funcName);
    } catch (e) {
      // tslint:disable-next-line: no-console
      log.warn(`Failed to load command line extension in package ${pk.name}: "${e.message}"`, e);
    }
  }
  return availables;
}


let versionChecked = false;
process.on('beforeExit', () => {
  if (versionChecked)
    return;
  versionChecked = true;
  checkPlinkVersion();
});

function checkPlinkVersion() {
  const pkjson = Path.resolve(getRootDir(), 'package.json');
  if (fs.existsSync(pkjson)) {
    const json = JSON.parse(fs.readFileSync(pkjson, 'utf8'));
    let depVer: string = json.dependencies && json.dependencies['@wfh/plink'] ||
      json.devDependencies && json.devDependencies['@wfh/plink'];
    if (depVer == null) {
      // tslint:disable-next-line: no-console
      console.log(boxString('Don\'t forget to add @wfh/plink in package.json as dependencies'));
      return;
    }
    if (depVer.endsWith('.tgz')) {
      const matched = /-(\d+\.\d+\.[^.]+)\.tgz$/.exec(depVer);
      if (matched == null)
        return;
      depVer = matched[1];
    }
    if (depVer && !semver.satisfies(pk.version, depVer)) {
      // tslint:disable-next-line: no-console
      console.log(boxString(`Local installed Plink version ${chalk.cyan(pk.version)} does not match dependency version ${chalk.green(depVer)} in package.json, ` +
        `run command "${chalk.green('plink upgrade')}" to upgrade or downgrade to expected version`));
    }
  }
}

