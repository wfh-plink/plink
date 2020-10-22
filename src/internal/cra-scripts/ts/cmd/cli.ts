#!/usr/bin/env node
// import fs from 'fs';
import {CliExtension, GlobalOptions} from '@wfh/plink/wfh/dist/cmd/types';
// import replacePatches, { ReplacementInf } from '@wfh/plink/wfh/dist/utils/patch-text';
// import Path from 'path';
import commander from 'Commander';
import {saveCmdOptionsToEnv} from '../utils';
import {initConfigAsync, initProcess} from '@wfh/plink/wfh/dist';
import walkPackagesAndSetupInjector from '@wfh/webpack-common/dist/initInjectors';
import log4js from 'log4js';
import {initTsconfig} from './cli-init';
// import {ObjectAst} from '@wfh/plink/wfh/dist/utils/json-sync-parser';


const cli: CliExtension = (program, withGlobalOptions) => {

  const genCmd = program.command('cra-gen <dir>')
  .description('Generate a sample package in specific directory')
  .option('-d, --dry-run', 'Do not generate files, just list new file names', false)
  .action(async (dir: string) => {
    (await import('./cli-gen')).genPackage(dir, genCmd.opts().dryRun);
  });

  const buildCmd = program.command('cra-build <app|lib> <package-name>')
  .description('Compile react application or library, <package-name> is the target package name,\n' +
    'argument "app" for building an compelete application like create-react-app,\n' +
    'argument "lib" for building a library')
  .option('-i, --include <module-path-regex>',
  '(multiple value), when argument is "lib", we will set external property of Webpack configuration for all request not begin with "." (except "@babel/runtimer"), ' +
  'meaning all external modules will not be included in the output bundle file, you need to explicitly provide a list in' +
  ' Regular expression (e.g. -i "^someLib/?" -i "^someLib2/?" -i ...) to make them be included in bundle file', arrayOptionFn, [])
  .action(async (type, pkgName) => {
    await initEverything(buildCmd, type, pkgName);
    require('react-scripts/scripts/build');
  });
  withClicOpt(buildCmd);
  withGlobalOptions(buildCmd);

  const StartCmd = program.command('cra-start <app|lib> <package-name>')
  .description('Run CRA start script for react application or library, <package-name> is the target package name')
  .action(async (type, pkgName) => {
    await initEverything(StartCmd, type, pkgName);
    require('react-scripts/scripts/start');
  });
  withClicOpt(StartCmd);
  withGlobalOptions(StartCmd);

  const initCmd = program.command('cra-init')
  .description('Initial workspace files based on files which are newly generated by create-react-app')
  .action(async () => {
    await initConfigAsync(initCmd.opts() as GlobalOptions);
    await initTsconfig();
  });
  withGlobalOptions(initCmd);
};

function withClicOpt(cmd: commander.Command) {
  cmd.option('-w, --watch', 'Watch file changes and compile', false)
  .option('--dev', 'set NODE_ENV to "development", enable react-scripts in dev mode', false)
  .option('--purl, --publicUrl <string>', 'set environment variable PUBLIC_URL for react-scripts', undefined);
}

function arrayOptionFn(curr: string, prev: string[] | undefined) {
  if (prev)
    prev.push(curr);
  return prev;
}

async function initEverything(buildCmd: commander.Command, type: 'app' | 'lib', pkgName: string) {
  initProcess();
  await initConfigAsync(buildCmd.opts() as GlobalOptions);
  await initTsconfig();
  saveCmdOptionsToEnv(pkgName, buildCmd, type);
  await walkPackagesAndSetupInjector(process.env.PUBLIC_URL || '/');
  if (!['app', 'lib'].includes(type)) {
    const log = log4js.getLogger('cra');
    log.error(`type argument must be one of "${['app', 'lib']}"`);
    return;
  }
  await (await import('../preload')).poo();
}

export {cli as default};

