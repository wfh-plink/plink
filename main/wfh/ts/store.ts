import Path from 'path';
import fs from 'fs';
import {tap, filter} from 'rxjs/operators';
import {StateFactory, ofPayloadAction} from '../../redux-toolkit-observable/dist/redux-toolkit-observable';
import log4js from 'log4js';
import {getRootDir} from './utils/misc';
import serialize from 'serialize-javascript';
import {enableMapSet} from 'immer';
// import chalk from 'chalk';

export {ofPayloadAction};

enableMapSet();

// import './package-mgr'; 
// ensure slice and epic being initialized before create store, in which case not more lazy load

const stateFile = Path.resolve(getRootDir(), 'dist/plink-state.json');
let actionCount = 0;
/**
 * Since Redux-toolkit does not read initial state with any lazy slice that has not defined in root reducer,
 * e.g. 
 * "Unexpected keys "clean", "packages" found in preloadedState argument passed to createStore.
 * Expected to find one of the known reducer keys instead: "main". Unexpected keys will be ignored.""
 * 
 * I have to export saved state, so that eacy lazy slice can initialize its own slice state by themself
 */
// tslint:disable-next-line: no-eval
export const lastSavedState = fs.existsSync(stateFile) ? eval('(' + fs.readFileSync(stateFile, 'utf8') + ')') : {};

export const stateFactory = new StateFactory(lastSavedState);

stateFactory.actionsToDispatch.pipe(
  filter(action => !action.type.endsWith('/_init')),
  tap(() => actionCount++)
).subscribe();


export async function startLogging() {
  const defaultLog = log4js.getLogger('dr-comp-package.store');
  const logState = log4js.getLogger('dr-comp-package.store.state');
  const logAction = log4js.getLogger('dr-comp-package.store.action');

  stateFactory.log$.pipe(
    tap(params => {
      if (params[0] === 'state')
        (logState.debug as any)(...params.slice(1));
      else if (params[0] === 'action')
        (logAction.info as any)(...params.slice(1));
        // console.log(...params.slice(1));
      else
        (defaultLog.debug as any)(...params);

      // if (params[0] === 'state') {
      //   console.log('[redux:state]', ...params.slice(1));
      // } else if (params[0] === 'action')
      //   console.log('[redux:action]', ...params.slice(1));
      // else
      //   console.log(...params);
    })
  ).subscribe();
}

let saved = false;
/**
 * a listener registered on the 'beforeExit' event can make asynchronous calls, 
 * and thereby cause the Node.js process to continue.
 * The 'beforeExit' event is not emitted for conditions causing explicit termination,
 * such as calling process.exit() or uncaught exceptions.
 */
process.on('beforeExit', async (code) => {
  if (saved)
    return;
  saveState();
  // // tslint:disable-next-line: no-console
  // console.log(chalk.green(`Done in ${new Date().getTime() - process.uptime()} s`));
});

/**
 * Call this function before you explicitly run process.exit(0) to quit, because "beforeExit"
 * won't be triggered prior to process.exit(0)
 */
export async function saveState() {
  saved = true;
  if (actionCount === 0) {
    // tslint:disable-next-line: no-console
    console.log('[package-mgr] state is not changed');
    return;
  }
  const store = await stateFactory.rootStoreReady;
  const mergedState = Object.assign(lastSavedState, store.getState());
  // const jsonStr = JSON.stringify(mergedState, null, '  ');
  const jsonStr = serialize(mergedState, {space: '  '});
  fs.writeFile(stateFile, jsonStr,
    () => {
      // tslint:disable-next-line: no-console
      console.log(`[package-mgr] state file ${Path.relative(process.cwd(), stateFile)} saved (${actionCount})`);
    });
}
