// tslint:disable: max-line-length
import commander from 'commander';
import chalk from 'chalk';
import type * as store from '../store';
import * as tp from './types';

const pk = require('../../../package');
// const WIDTH = 130;

const arrayOptionFn = (curr: string, prev: string[] | undefined) => {
  if (prev)
    prev.push(curr);
  return prev;
};

export async function drcpCommand(startTime: number) {
  process.title = 'Plink - command line';
  const {stateFactory}: typeof store = require('../store');
  await import('./cli-store');
  stateFactory.configureStore();
  console.log('stateFactory configured');
  // await import('./cli-store');
  let saved = false;
  process.on('beforeExit', async (code) => {
    if (saved)
      return;
    saved = true;
    // tslint:disable-next-line: no-console
    console.log(chalk.green(`Done in ${new Date().getTime() - startTime} ms`));
    (await import('../store')).saveState();
  });

  const program = new commander.Command().name('plink')
  .action(args => {
    program.outputHelp();
    // tslint:disable-next-line: no-console
    console.log('\nversion:', pk.version);
  });

  program.version(pk.version, '-v, --vers', 'output the current version');

  subDrcpCommand(program);

  try {
    await program.parseAsync(process.argv);
  } catch (e) {
    console.error(chalk.redBright(e), e.stack);
    process.exit(1);
  }
}

function subDrcpCommand(program: commander.Command) {
  /**
   * command init
   */
  const initCmd = program.command('init [workspace]')
  .description('Initialize workspace directory, generate basic configuration files for project and component packages')
  .option('-f | --force', 'Force run "npm install" in specific workspace directory', false)
  // .option('--yarn', 'Use Yarn to install component peer dependencies instead of using NPM', false)
  .option('--production', 'Add "--production" or "--only=prod" command line argument to "yarn/npm install"', false)
  .action(async (workspace: string) => {
    await (await import('./cli-init')).default(initCmd.opts() as any, workspace);
  });
  withGlobalOptions(initCmd);

  /**
   * command project
   */
  program.command('project [add|remove] [project-dir...]')
  .description('Associate, disassociate or list associated project folders')
  .action(async (action: 'add'|'remove'|undefined, projectDir: string[]) => {
    (await import('./cli-project')).default(action, projectDir);
  });

  /**
   * command lint
   */
  const lintCmd = program.command('lint [package...]')
  .description('source code style check')
  .option('--pj <project1,project2...>', 'lint only TS code from specific project', arrayOptionFn, [])
  .option('--fix', 'Run eslint/tslint fix, this could cause your source code being changed unexpectedly', false)
  .action(async packages => {
    await (await import('./cli-lint')).default(packages, lintCmd.opts() as any);
  });
  withGlobalOptions(lintCmd);
  lintCmd.usage(lintCmd.usage() +
    hl('\ndrcp lint --pj <project-dir..> [--fix]') + ' Lint TS files from specific project directory\n' +
    hl('\ndrcp lint <component-package..> [--fix]') + ' Lint TS files from specific component packages');

  /**
   * command clean
   */
  program.command('clean [symlink]').description('Clean whole "dist" directory or only symbolic links from node_modules')
  .action(async (symlink: 'symlink' | undefined) => {
    (await import('./cli-clean')).default(symlink === 'symlink');
  });

  /**
   * command ls
   */
  const listCmd = program.command('ls').alias('list')
  .description('If you want to know how many components will actually run, this command prints out a list and the priorities, including installed components')
  .action(async () => {
    await (await import('./cli-ls')).default(listCmd.opts() as any);
  });
  withGlobalOptions(listCmd);

  /**
   * command run
   */
  const runCmd = program.command('run <target> [arguments...]')
  .description('Run specific module\'s exported function\n')
  .action(async (target: string, args: string[]) => {
    const config = await (await import('../config')).default;
    await config.init(runCmd.opts() as tp.GlobalOptions);
    const logConfig = await (await import('../log-config')).default;
    logConfig(config());
    (await import('../package-runner')).runSinglePackage({target, args});
  });
  withGlobalOptions(runCmd);
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
  .description('Run Typescript compiler')
  .option('-w, --watch', 'Typescript compiler watch mode', false)
  .option('--pj, --project <project-dir,...>', 'Compile only specific project directory', (v, prev) => {
    prev.push(...v.split(',')); return prev;
  }, [] as string[])
  .option('--jsx', 'includes TSX file', false)
  .option('--ed, --emitDeclarationOnly', 'Typescript compiler option: --emitDeclarationOnly.\nOnly emit ‘.d.ts’ declaration files.', false)
  .option('--source-map', 'Source map style: "inline" or "file"', 'inline')
  .action(async (packages: string[]) => {
    const opt = tscCmd.opts();
    // console.log(opt);
    const config = await (await import('../config')).default;
    await config.init(runCmd.opts() as tp.GlobalOptions);
    const logConfig = await (await import('../log-config')).default;
    logConfig(config());
    const tsCmd = await import('../ts-cmd');
    await tsCmd.tsc({
      package: packages,
      project: opt.project,
      watch: opt.watch,
      sourceMap: opt.sourceMap,
      jsx: opt.jsx,
      ed: opt.emitDeclarationOnly
    });
  });
  withGlobalOptions(tscCmd);
  tscCmd.usage(tscCmd.usage() + '\n' + 'Run gulp-typescript to compile Node.js side typescript files.\n\n' +
  'It compiles \n  "<package-directory>/ts/**/*.ts" to "<package-directory>/dist",\n' +
  '  or\n  "<package-directory>/isom/**/*.ts" to "<package-directory>/isom"\n for all @dr packages.\n' +
  'I suggest to put Node.js side TS code in directory `ts`, and isomorphic TS code (meaning it runs in ' +
  'both Node.js and Browser) in directory `isom`.\n' +
  hlDesc('plink tsc <package..>\n') + ' Only compile specific components by providing package name or short name\n' +
  hlDesc('plink tsc\n') + ' Compile all components belong to associated projects, not including installed components\n' +
  hlDesc('plink tsc --pj <project directory,...>\n') + ' Compile components belong to specific projects\n' +
  hlDesc('plink tsc [package...] -w\n') + ' Watch components change and compile when new typescript file is changed or created\n\n');

  /**
   * Bump command
   */
  const bumpCmd = program.command('bump [package...]')
    .description('bump version number of all package.json from specific directories, same as "npm version" does')
    .option<string[]>('--pj, --project <project-dir,...>', 'only bump component packages from specific project directory',
      (value, prev) => {
        prev.push(...value.split(',')); return prev;
      }, [])
    .option('-i, --incre-version <major | minor | patch | premajor | preminor | prepatch | prerelease>',
      'version increment, valid values are: major, minor, patch, prerelease', 'patch')
    .action(async (packages: string[]) => {
      (await import('./cli-bump')).default({...bumpCmd.opts() as tp.BumpOptions, packages});
    });
  withGlobalOptions(bumpCmd);
  bumpCmd.usage(bumpCmd.usage() + '\n' + hl('plink bump <dir-1> <dir-2> ...') + ' to recursively bump package.json from multiple directories\n' +
    hl('plink bump <dir> -i minor') + ' to bump minor version number, default is patch number');

  /**
   * Pack command
   */
  const packCmd = program.command('pack [packageDir...]')
    .description('npm pack every pakage into tarball files')
    .option<string[]>('--pj, --project <project-dir,...>',
    'project directories to be looked up for all components which need to be packed to tarball files',
      (value, prev) => {
        prev.push(...value.split(',')); return prev;
      }, [])
    .action(async (packageDirs: string[]) => {
      (await import('../drcp-cmd')).pack({...packCmd.opts() as tp.PackOptions, packageDirs});
    });
  withGlobalOptions(packCmd);
}

function hl(text: string) {
  return chalk.green(text);
}

function hlDesc(text: string) {
  return chalk.green(text);
}

export function withGlobalOptions(program: commander.Command): commander.Command {
  program.option('-c, --config <config-file>',
    hlDesc('Read config files, if there are multiple files, the latter one overrides previous one'),
    (value, prev) => { prev.push(...value.split(',')); return prev;}, [] as string[])
  .option('--prop <property-path=value as JSON | literal>',
    hlDesc('<property-path>=<value as JSON | literal> ... directly set configuration properties, property name is lodash.set() path-like string\n e.g.\n') +
    '--prop port=8080 --prop devMode=false --prop @dr/foobar.api=http://localhost:8080\n' +
    '--prop port=8080 --prop devMode=false --prop @dr/foobar.api=http://localhost:8080\n' +
    '--prop arraylike.prop[0]=foobar\n' +
    '--prop ["@dr/foo.bar","prop",0]=true',
    arrayOptionFn, [] as string[])
  .option('--log-stat', hlDesc('Print internal Redux state/actions for debug'));

  return program;
}
