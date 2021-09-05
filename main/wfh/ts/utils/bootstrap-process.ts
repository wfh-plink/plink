import '../node-path';
import log4js from 'log4js';
import config from '../config';
// import logConfig from '../log-config';
import {GlobalOptions} from '../cmd/types';
import * as store from '../store';

const log = log4js.getLogger('plink.bootstrap-process');

process.on('uncaughtException', function(err) {
  // log.error('Uncaught exception', err, err.stack);
  log.error('Uncaught exception: ', err);
  throw err; // let PM2 handle exception
});

process.on('unhandledRejection', err => {
  // log.warn('unhandledRejection', err);
  log.error('unhandledRejection', err);
});

// const log = log4js.getLogger('bootstrap-process');

// export async function initConfigAsync(options: GlobalOptions) {
//   // initProcess(onShutdownSignal);
//   await config.init(options);
//   // logConfig(config());
//   return config;
// }

/**
 * Must invoke initProcess() or initAsChildProcess() before this function.
 * If this function is called from a child process or thread worker of Plink,
 * you may pass `JSON.parse(process.env.PLINK_CLI_OPTS!)` as parameter since
 * Plink's main process save `GlobalOptions` in environment variable "PLINK_CLI_OPTS",
 * so that child process gets same GlobalOptions as the main process does.
 * @param options 
 */
export function initConfig(options: GlobalOptions) {
  config.initSync(options);
  // logConfig(config());
  return config;
}

/**
 * - Register process event handler for SIGINT and shutdown command
 * - Initialize redux-store for Plink
 * 
 * DO NOT fork a child process on this function
 * @param onShutdownSignal 
 */
export function initProcess(onShutdownSignal?: () => void | Promise<any>) {
  process.on('SIGINT', function() {
    // eslint-disable-next-line no-console
    log.info('pid ' + process.pid + ': bye');
    void onShut();
  });
  // Be aware this is why "initProcess" can not be "fork"ed in a child process, it will keep alive for parent process's 'message' event
  process.on('message', function(msg) {
    if (msg === 'shutdown') {
      // eslint-disable-next-line no-console
      log.info('Recieve shutdown message from PM2, bye.');
      void onShut();
    }
  });

  const {saveState, stateFactory, startLogging} = require('../store') as typeof store;
  startLogging();
  stateFactory.configureStore();

  async function onShut() {
    if (onShutdownSignal) {
      await Promise.resolve(onShutdownSignal);
    }
    await saveState();
    setImmediate(() => process.exit(0));
  }
}

/**
 * Initialize redux-store for Plink.
 * 
 * Use this function instead of initProcess() in case it is in a forked child process or worker thread.
 * 
 * Unlink initProcess() which registers process event handler for SIGINT and shutdown command,
 * in case this is running as a forked child process, it will stand by until parent process explicitly
 *  sends a signal to exit
 * @param syncState send changed state back to main process
 */
export function initAsChildProcess(syncState = false, onShutdownSignal?: () => void | Promise<any>) {
  const {saveState, stateFactory, startLogging, setSyncStateToMainProcess} = require('../store') as typeof store;
  process.on('SIGINT', function() {
    // eslint-disable-next-line no-console
    if (onShutdownSignal) {
      void Promise.resolve(onShutdownSignal)
      .then(() => saveState())
      .finally(() => {
        log.info('bye');
        setImmediate(() => process.exit(0));
      });
    } else {
      log.info('bye');
      process.exit(0);
    }
  });

  let needSaveState = process.env.__plink_save_state === '1';
  if (needSaveState) {
    process.env.__plink_save_state = '0';
  }

  startLogging();
  if (syncState && !needSaveState) {
    setSyncStateToMainProcess(true);
  }
  stateFactory.configureStore();
}

// export function forkCli(cliArgs: string[], opts: ForkOptions = {}) {
//   const cp = fork(require.resolve('../cmd-bootstrap'), cliArgs, {...opts, stdio: ['ignore', 'inherit', 'inherit', 'ipc']});
//   cp.on('message', (msg) => {
//     if (store.isStateSyncMsg(msg)) {
//       log.info('Recieve state sync message from forked process');
//       store.stateFactory.actionsToDispatch.next({type: '::syncState', payload(state: any) {
//         return eval('(' + msg.data + ')');
//       }});
//     }
//   });
//   return cp;
// }

