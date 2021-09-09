import Path from 'path';
import {fork} from 'child_process';
import fs from 'fs';
import {plinkEnv} from './utils/misc';
import * as _editorHelper from './editor-helper';
import * as _store from './store';

import log4js from 'log4js';
const log = log4js.getLogger('plink.fork-for-preserver-symlink');

export async function forkFile(moduleName: string) {
  process.on('SIGINT', () => {
    // eslint-disable-next-line no-console
    console.log('bye');
    process.exit(0);
  });

  let recovered = false;
  const renamedNodeModules = await renameNodeModuleSymlink();

  process.on('beforeExit', () => {
    if (recovered)
      return;
    recovered = true;
    const suffixLen = '.lock'.length;

    for (const link of renamedNodeModules) {
      const orig = link.slice(0, link.length - suffixLen);
      if (!fs.existsSync(orig)) {
        void fs.promises.rename(link, orig);
        log.info('recover ' + link);
      }
    }
  });


  let argv = process.argv.slice(2);
  const foundCmdOptIdx =  argv.findIndex(arg => arg === '--cwd' || arg === '--space');
  const workdir = foundCmdOptIdx >= 0 ? Path.resolve(plinkEnv.rootDir,  argv[foundCmdOptIdx + 1]) : null;
  if (workdir) {
    argv.splice(foundCmdOptIdx, 2);
    // process.env.PLINK_WORK_DIR = workdir;
  }

  process.execArgv.push('--preserve-symlinks-main', '--preserve-symlinks');
  const foundDebugOptIdx = argv.findIndex(arg => arg === '--inspect' || arg === '--inspect-brk');

  const env: {[key: string]: string | undefined} = {...process.env};
  if (foundDebugOptIdx >= 0) {
    env.NODE_OPTIONS = env.NODE_OPTIONS ? env.NODE_OPTIONS + ' ' + argv[foundDebugOptIdx] : argv[foundDebugOptIdx];
    argv.splice(foundDebugOptIdx, 1);
  }
  const debugOptIdx = argv.findIndex(arg => arg === '--debug');
  if (debugOptIdx >= 0) {
    env.NODE_OPTIONS = env.NODE_OPTIONS ? env.NODE_OPTIONS + ' --inspect-brk' : '--inspect-brk';
    argv.splice(debugOptIdx, 1);
  }

  env.__plink_fork_main = moduleName;
  // env.__plink_save_state = '1';

  if (workdir)
    env.PLINK_WORK_DIR = workdir;

  const cp = fork(Path.resolve(__dirname, 'fork-preserve-symlink-main.js'), argv, {
    env,
    stdio: 'inherit'
  });

  const {isStateSyncMsg} = require('./store') as typeof _store;
  cp.on('message', (msg) => {
    if (isStateSyncMsg(msg)) {
      // const stat = eval('(' + msg.data + ')');
    }
  });

  return;
}

/**
 * Temporarily rename <pkg>/node_modules to another name
 * @returns 
 */
async function renameNodeModuleSymlink() {
  const {getState} = require('./editor-helper') as typeof _editorHelper;
  const links = getState().nodeModuleSymlinks;

  if (links == null)
    return Promise.resolve([]);
  const dones = Array.from(links.values()).map(async link => {
    try {
    const stat = await fs.promises.lstat(link);
    if (!stat.isSymbolicLink() && !stat.isDirectory())
      return null;
    } catch (ex) {
      return null;
    }
    log.info('Temporarliy rename ' + link);
    const newName = link + '.lock';
    if (fs.existsSync(newName)) {
      await fs.promises.unlink(link);
      return newName;
    }
    return fs.promises.rename(link, newName).then(() => newName);
  });
  const res = await Promise.all(dones);
  return res.filter(item => item != null) as string[];
}
