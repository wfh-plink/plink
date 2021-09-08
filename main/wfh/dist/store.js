"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveState = exports.startLogging = exports.stateFactory = exports.lastSavedState = exports.BEFORE_SAVE_STATE = exports.isStateSyncMsg = exports.setSyncStateToMainProcess = exports.ofPayloadAction = exports.createReducers = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const operators_1 = require("rxjs/operators");
const redux_toolkit_observable_1 = require("../../redux-toolkit-observable/dist/redux-toolkit-observable");
Object.defineProperty(exports, "ofPayloadAction", { enumerable: true, get: function () { return redux_toolkit_observable_1.ofPayloadAction; } });
const log4js_1 = __importDefault(require("log4js"));
const serialize_javascript_1 = __importDefault(require("serialize-javascript"));
const immer_1 = require("immer");
const worker_threads_1 = require("worker_threads");
const chalk_1 = __importDefault(require("chalk"));
var helper_1 = require("../../redux-toolkit-observable/dist/helper");
Object.defineProperty(exports, "createReducers", { enumerable: true, get: function () { return helper_1.createReducers; } });
(0, immer_1.enableMapSet)();
configDefaultLog();
let syncStateToMainProcess = false;
// process.on('message', msg => {
//   if (msg && msg.type === '__plink_save_state') {
//   }
// });
function setSyncStateToMainProcess(enabled) {
    syncStateToMainProcess = enabled;
}
exports.setSyncStateToMainProcess = setSyncStateToMainProcess;
const PROCESS_MSG_TYPE = 'rtk-observable:state';
function isStateSyncMsg(msg) {
    return msg.type === PROCESS_MSG_TYPE;
}
exports.isStateSyncMsg = isStateSyncMsg;
function configDefaultLog() {
    let logPatternPrefix = '';
    if (process.send || !worker_threads_1.isMainThread)
        logPatternPrefix = `[P${process.pid}.T${worker_threads_1.threadId}] `;
    log4js_1.default.configure({
        appenders: {
            out: {
                type: 'stdout',
                layout: { type: 'pattern', pattern: logPatternPrefix + '%[%c%] - %m' }
            }
        },
        categories: {
            default: { appenders: ['out'], level: 'info' }
        }
    });
    /**
     - %r time in toLocaleTimeString format
     - %p log level
     - %c log category
     - %h hostname
     - %m log data
     - %d date, formatted - default is ISO8601, format options are: ISO8601, ISO8601_WITH_TZ_OFFSET, ABSOLUTE, DATE, or any string compatible with the date-format library. e.g. %d{DATE}, %d{yyyy/MM/dd-hh.mm.ss}
     - %% % - for when you want a literal % in your output
     - %n newline
     - %z process id (from process.pid)
     - %f full path of filename (requires enableCallStack: true on the category, see configuration object)
     - %f{depth} path’s depth let you chose to have only filename (%f{1}) or a chosen number of directories
     - %l line number (requires enableCallStack: true on the category, see configuration object)
     - %o column postion (requires enableCallStack: true on the category, see configuration object)
     - %s call stack (requires enableCallStack: true on the category, see configuration object)
     - %x{<tokenname>} add dynamic tokens to your log. Tokens are specified in the tokens parameter.
     - %X{<tokenname>} add values from the Logger context. Tokens are keys into the context values.
     - %[ start a coloured block (colour will be taken from the log level, similar to colouredLayout)
     - %] end a coloured block
     */
}
exports.BEFORE_SAVE_STATE = 'BEFORE_SAVE_STATE';
const IGNORE_SLICE = ['config', 'configView', 'cli'];
const IGNORE_ACTION = new Set(['packages/setInChina', 'packages/updatePlinkPackageInfo']);
const ignoreSliceSet = new Set(IGNORE_SLICE);
const stateFile = path_1.default.resolve(JSON.parse(process.env.__plink).distDir, 'plink-state.json');
let stateChangeCount = 0;
/**
 * Since Redux-toolkit does not read initial state with any lazy slice that has not defined in root reducer,
 * e.g.
 * "Unexpected keys "clean", "packages" found in preloadedState argument passed to createStore.
 * Expected to find one of the known reducer keys instead: "main". Unexpected keys will be ignored.""
 *
 * I have to export saved state, so that eacy lazy slice can initialize its own slice state by themself
 */
const savedStore = fs_1.default.existsSync(stateFile) ? fs_1.default.readFileSync(stateFile, 'utf8') : null;
if (savedStore && savedStore.length === 0) {
    throw new Error('Emptry store file ' + stateFile + ', delete it and initial new workspaces');
}
// eslint-disable-next-line no-eval
exports.lastSavedState = savedStore ? eval('(' + savedStore + ')') : {};
for (const ignoreSliceName of IGNORE_SLICE) {
    delete exports.lastSavedState[ignoreSliceName];
}
exports.stateFactory = new redux_toolkit_observable_1.StateFactory(exports.lastSavedState);
const defaultLog = log4js_1.default.getLogger('plink.store');
exports.stateFactory.actionsToDispatch.pipe((0, operators_1.filter)(action => !action.type.endsWith('/_init') &&
    !IGNORE_ACTION.has(action.type) &&
    !ignoreSliceSet.has(action.type.slice(0, action.type.indexOf('/')))), (0, operators_1.takeWhile)(action => action.type !== exports.BEFORE_SAVE_STATE), (0, operators_1.tap)((action) => {
    stateChangeCount++;
})).subscribe();
function startLogging() {
    // const logState = log4js.getLogger('plink.store.state');
    const logAction = log4js_1.default.getLogger('plink.store.action');
    exports.stateFactory.log$.pipe((0, operators_1.tap)(params => {
        if (params[0] === 'state') {
            // (logState.debug as any)(...params.slice(1));
        }
        else if (params[0] === 'action') {
            logAction.debug(...params.slice(1));
        }
        else
            defaultLog.debug(...params);
    })).subscribe();
}
exports.startLogging = startLogging;
let saved = false;
/**
 * a listener registered on the 'beforeExit' event can make asynchronous calls,
 * and thereby cause the Node.js process to continue.
 * The 'beforeExit' event is not emitted for conditions causing explicit termination,
 * such as calling process.exit() or uncaught exceptions.
 */
process.on('beforeExit', (code) => {
    if (saved)
        return;
    exports.stateFactory.dispatch({ type: 'BEFORE_SAVE_STATE', payload: null });
    process.nextTick(() => saveState());
});
/**
 * Call this function before you explicitly run process.exit(0) to quit, because "beforeExit"
 * won't be triggered prior to process.exit(0)
 */
function saveState() {
    return __awaiter(this, void 0, void 0, function* () {
        const log = log4js_1.default.getLogger('plink.store');
        saved = true;
        if (stateChangeCount === 0) {
            // eslint-disable-next-line no-console
            log.info(chalk_1.default.gray('state is not changed'));
            return;
        }
        if (!worker_threads_1.isMainThread) {
            // eslint-disable-next-line no-console
            log.info(chalk_1.default.gray('not in main thread, skip saving state'));
            return;
        }
        if (process.send && syncStateToMainProcess) {
            const store = yield exports.stateFactory.rootStoreReady;
            log.info('send state sync message');
            process.send({
                type: PROCESS_MSG_TYPE,
                data: (0, serialize_javascript_1.default)(store.getState(), { space: '' })
            });
            // eslint-disable-next-line no-console
            log.info(chalk_1.default.gray('in a forked child process, skip saving state'));
            return;
        }
        const store = yield exports.stateFactory.rootStoreReady;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const mergedState = Object.assign(exports.lastSavedState, store.getState());
        const jsonStr = (0, serialize_javascript_1.default)(mergedState, { space: '  ' });
        fs_extra_1.default.mkdirpSync(path_1.default.dirname(stateFile));
        try {
            yield fs_1.default.promises.writeFile(stateFile, jsonStr);
            // eslint-disable-next-line no-console
            log.info(chalk_1.default.gray(`state file ${path_1.default.relative(process.cwd(), stateFile)} saved (${stateChangeCount})`));
        }
        catch (err) {
            // eslint-disable-next-line no-console
            log.error(chalk_1.default.gray(`Failed to write state file ${path_1.default.relative(process.cwd(), stateFile)}`), err);
        }
    });
}
exports.saveState = saveState;
// TEST async action for Thunk middleware
// stateFactory.store$.subscribe(store => {
//   if (store) {
//     debugger;
//     store.dispatch((async (dispatch: any) => {
//       await new Promise(resolve => setTimeout(resolve, 500));
//       dispatch({type: 'ok'});
//     }) as any);
//   }
// });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9zdG9yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnREFBd0I7QUFDeEIsNENBQW9CO0FBQ3BCLHdEQUEyQjtBQUMzQiw4Q0FBc0Q7QUFDdEQsMkdBQTJHO0FBVW5HLGdHQVZjLDBDQUFlLE9BVWQ7QUFUdkIsb0RBQTRCO0FBQzVCLGdGQUE2QztBQUM3QyxpQ0FBbUM7QUFDbkMsbURBQXNEO0FBRXRELGtEQUEwQjtBQUMxQixxRUFBMEU7QUFBbEUsd0dBQUEsY0FBYyxPQUFBO0FBS3RCLElBQUEsb0JBQVksR0FBRSxDQUFDO0FBRWYsZ0JBQWdCLEVBQUUsQ0FBQztBQUVuQixJQUFJLHNCQUFzQixHQUFHLEtBQUssQ0FBQztBQUVuQyxpQ0FBaUM7QUFDakMsb0RBQW9EO0FBRXBELE1BQU07QUFDTixNQUFNO0FBRU4sU0FBZ0IseUJBQXlCLENBQUMsT0FBZ0I7SUFDeEQsc0JBQXNCLEdBQUcsT0FBTyxDQUFDO0FBQ25DLENBQUM7QUFGRCw4REFFQztBQUVELE1BQU0sZ0JBQWdCLEdBQUcsc0JBQXNCLENBQUM7QUFLaEQsU0FBZ0IsY0FBYyxDQUFDLEdBQVk7SUFDekMsT0FBUSxHQUEyQixDQUFDLElBQUksS0FBSyxnQkFBZ0IsQ0FBQztBQUNoRSxDQUFDO0FBRkQsd0NBRUM7QUFFRCxTQUFTLGdCQUFnQjtJQUN2QixJQUFJLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztJQUMxQixJQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyw2QkFBWTtRQUMvQixnQkFBZ0IsR0FBRyxLQUFLLE9BQU8sQ0FBQyxHQUFHLEtBQUsseUJBQVEsSUFBSSxDQUFDO0lBQ3ZELGdCQUFNLENBQUMsU0FBUyxDQUFDO1FBQ2YsU0FBUyxFQUFFO1lBQ1QsR0FBRyxFQUFFO2dCQUNILElBQUksRUFBRSxRQUFRO2dCQUNkLE1BQU0sRUFBRSxFQUFDLElBQUksRUFBRSxTQUFT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LGdCQUFnQixHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ3pGO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixzQ0FBc0M7WUFDdEMsR0FBRyxDQUFDLEtBQUssQ0FBQyxlQUFLLENBQUMsSUFBSSxDQUFDLDhCQUE4QixjQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDckc7SUFDSCxDQUFDO0NBQUE7QUF4Q0QsOEJBd0NDO0FBRUQseUNBQXlDO0FBQ3pDLDJDQUEyQztBQUMzQyxpQkFBaUI7QUFDakIsZ0JBQWdCO0FBQ2hCLGlEQUFpRDtBQUNqRCxnRUFBZ0U7QUFDaEUsZ0NBQWdDO0FBQ2hDLGtCQUFrQjtBQUNsQixNQUFNO0FBQ04sTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBmc2UgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHt0YXAsIGZpbHRlciwgdGFrZVdoaWxlfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1N0YXRlRmFjdG9yeSwgb2ZQYXlsb2FkQWN0aW9ufSBmcm9tICcuLi8uLi9yZWR1eC10b29sa2l0LW9ic2VydmFibGUvZGlzdC9yZWR1eC10b29sa2l0LW9ic2VydmFibGUnO1xuaW1wb3J0IGxvZzRqcyBmcm9tICdsb2c0anMnO1xuaW1wb3J0IHNlcmlhbGl6ZSBmcm9tICdzZXJpYWxpemUtamF2YXNjcmlwdCc7XG5pbXBvcnQge2VuYWJsZU1hcFNldH0gZnJvbSAnaW1tZXInO1xuaW1wb3J0IHtpc01haW5UaHJlYWQsIHRocmVhZElkfSBmcm9tICd3b3JrZXJfdGhyZWFkcyc7XG5pbXBvcnQge1BsaW5rRW52fSBmcm9tICcuL25vZGUtcGF0aCc7XG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuZXhwb3J0IHtjcmVhdGVSZWR1Y2Vyc30gZnJvbSAnLi4vLi4vcmVkdXgtdG9vbGtpdC1vYnNlcnZhYmxlL2Rpc3QvaGVscGVyJztcbi8vIGltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5cbmV4cG9ydCB7b2ZQYXlsb2FkQWN0aW9ufTtcblxuZW5hYmxlTWFwU2V0KCk7XG5cbmNvbmZpZ0RlZmF1bHRMb2coKTtcblxubGV0IHN5bmNTdGF0ZVRvTWFpblByb2Nlc3MgPSBmYWxzZTtcblxuLy8gcHJvY2Vzcy5vbignbWVzc2FnZScsIG1zZyA9PiB7XG4vLyAgIGlmIChtc2cgJiYgbXNnLnR5cGUgPT09ICdfX3BsaW5rX3NhdmVfc3RhdGUnKSB7XG5cbi8vICAgfVxuLy8gfSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRTeW5jU3RhdGVUb01haW5Qcm9jZXNzKGVuYWJsZWQ6IGJvb2xlYW4pIHtcbiAgc3luY1N0YXRlVG9NYWluUHJvY2VzcyA9IGVuYWJsZWQ7XG59XG5cbmNvbnN0IFBST0NFU1NfTVNHX1RZUEUgPSAncnRrLW9ic2VydmFibGU6c3RhdGUnO1xuZXhwb3J0IHR5cGUgUHJvY2Vzc1N0YXRlU3luY01zZyA9IHtcbiAgdHlwZTogdHlwZW9mIFBST0NFU1NfTVNHX1RZUEU7XG4gIGRhdGE6IHN0cmluZztcbn07XG5leHBvcnQgZnVuY3Rpb24gaXNTdGF0ZVN5bmNNc2cobXNnOiB1bmtub3duKTogbXNnIGlzIFByb2Nlc3NTdGF0ZVN5bmNNc2cge1xuICByZXR1cm4gKG1zZyBhcyBQcm9jZXNzU3RhdGVTeW5jTXNnKS50eXBlID09PSBQUk9DRVNTX01TR19UWVBFO1xufVxuXG5mdW5jdGlvbiBjb25maWdEZWZhdWx0TG9nKCkge1xuICBsZXQgbG9nUGF0dGVyblByZWZpeCA9ICcnO1xuICBpZiAocHJvY2Vzcy5zZW5kIHx8ICFpc01haW5UaHJlYWQpXG4gICAgbG9nUGF0dGVyblByZWZpeCA9IGBbUCR7cHJvY2Vzcy5waWR9LlQke3RocmVhZElkfV0gYDtcbiAgbG9nNGpzLmNvbmZpZ3VyZSh7XG4gICAgYXBwZW5kZXJzOiB7XG4gICAgICBvdXQ6IHtcbiAgICAgICAgdHlwZTogJ3N0ZG91dCcsXG4gICAgICAgIGxheW91dDoge3R5cGU6ICdwYXR0ZXJuJywgcGF0dGVybjogbG9nUGF0dGVyblByZWZpeCArICclWyVjJV0gLSAlbSd9XG4gICAgICB9XG4gICAgfSxcbiAgICBjYXRlZ29yaWVzOiB7XG4gICAgICBkZWZhdWx0OiB7YXBwZW5kZXJzOiBbJ291dCddLCBsZXZlbDogJ2luZm8nfVxuICAgIH1cbiAgfSk7XG4gIC8qKlxuICAgLSAlciB0aW1lIGluIHRvTG9jYWxlVGltZVN0cmluZyBmb3JtYXRcbiAgIC0gJXAgbG9nIGxldmVsXG4gICAtICVjIGxvZyBjYXRlZ29yeVxuICAgLSAlaCBob3N0bmFtZVxuICAgLSAlbSBsb2cgZGF0YVxuICAgLSAlZCBkYXRlLCBmb3JtYXR0ZWQgLSBkZWZhdWx0IGlzIElTTzg2MDEsIGZvcm1hdCBvcHRpb25zIGFyZTogSVNPODYwMSwgSVNPODYwMV9XSVRIX1RaX09GRlNFVCwgQUJTT0xVVEUsIERBVEUsIG9yIGFueSBzdHJpbmcgY29tcGF0aWJsZSB3aXRoIHRoZSBkYXRlLWZvcm1hdCBsaWJyYXJ5LiBlLmcuICVke0RBVEV9LCAlZHt5eXl5L01NL2RkLWhoLm1tLnNzfVxuICAgLSAlJSAlIC0gZm9yIHdoZW4geW91IHdhbnQgYSBsaXRlcmFsICUgaW4geW91ciBvdXRwdXRcbiAgIC0gJW4gbmV3bGluZVxuICAgLSAleiBwcm9jZXNzIGlkIChmcm9tIHByb2Nlc3MucGlkKVxuICAgLSAlZiBmdWxsIHBhdGggb2YgZmlsZW5hbWUgKHJlcXVpcmVzIGVuYWJsZUNhbGxTdGFjazogdHJ1ZSBvbiB0aGUgY2F0ZWdvcnksIHNlZSBjb25maWd1cmF0aW9uIG9iamVjdClcbiAgIC0gJWZ7ZGVwdGh9IHBhdGjigJlzIGRlcHRoIGxldCB5b3UgY2hvc2UgdG8gaGF2ZSBvbmx5IGZpbGVuYW1lICglZnsxfSkgb3IgYSBjaG9zZW4gbnVtYmVyIG9mIGRpcmVjdG9yaWVzXG4gICAtICVsIGxpbmUgbnVtYmVyIChyZXF1aXJlcyBlbmFibGVDYWxsU3RhY2s6IHRydWUgb24gdGhlIGNhdGVnb3J5LCBzZWUgY29uZmlndXJhdGlvbiBvYmplY3QpXG4gICAtICVvIGNvbHVtbiBwb3N0aW9uIChyZXF1aXJlcyBlbmFibGVDYWxsU3RhY2s6IHRydWUgb24gdGhlIGNhdGVnb3J5LCBzZWUgY29uZmlndXJhdGlvbiBvYmplY3QpXG4gICAtICVzIGNhbGwgc3RhY2sgKHJlcXVpcmVzIGVuYWJsZUNhbGxTdGFjazogdHJ1ZSBvbiB0aGUgY2F0ZWdvcnksIHNlZSBjb25maWd1cmF0aW9uIG9iamVjdClcbiAgIC0gJXh7PHRva2VubmFtZT59IGFkZCBkeW5hbWljIHRva2VucyB0byB5b3VyIGxvZy4gVG9rZW5zIGFyZSBzcGVjaWZpZWQgaW4gdGhlIHRva2VucyBwYXJhbWV0ZXIuXG4gICAtICVYezx0b2tlbm5hbWU+fSBhZGQgdmFsdWVzIGZyb20gdGhlIExvZ2dlciBjb250ZXh0LiBUb2tlbnMgYXJlIGtleXMgaW50byB0aGUgY29udGV4dCB2YWx1ZXMuXG4gICAtICVbIHN0YXJ0IGEgY29sb3VyZWQgYmxvY2sgKGNvbG91ciB3aWxsIGJlIHRha2VuIGZyb20gdGhlIGxvZyBsZXZlbCwgc2ltaWxhciB0byBjb2xvdXJlZExheW91dClcbiAgIC0gJV0gZW5kIGEgY29sb3VyZWQgYmxvY2tcbiAgICovXG59XG5cblxuZXhwb3J0IGNvbnN0IEJFRk9SRV9TQVZFX1NUQVRFID0gJ0JFRk9SRV9TQVZFX1NUQVRFJztcbmNvbnN0IElHTk9SRV9TTElDRSA9IFsnY29uZmlnJywgJ2NvbmZpZ1ZpZXcnLCAnY2xpJ107XG5jb25zdCBJR05PUkVfQUNUSU9OID0gbmV3IFNldChbJ3BhY2thZ2VzL3NldEluQ2hpbmEnLCAncGFja2FnZXMvdXBkYXRlUGxpbmtQYWNrYWdlSW5mbyddKTtcbmNvbnN0IGlnbm9yZVNsaWNlU2V0ID0gbmV3IFNldChJR05PUkVfU0xJQ0UpO1xuXG5jb25zdCBzdGF0ZUZpbGUgPSBQYXRoLnJlc29sdmUoKEpTT04ucGFyc2UocHJvY2Vzcy5lbnYuX19wbGluayEpIGFzIFBsaW5rRW52KS5kaXN0RGlyLCAncGxpbmstc3RhdGUuanNvbicpO1xubGV0IHN0YXRlQ2hhbmdlQ291bnQgPSAwO1xuLyoqXG4gKiBTaW5jZSBSZWR1eC10b29sa2l0IGRvZXMgbm90IHJlYWQgaW5pdGlhbCBzdGF0ZSB3aXRoIGFueSBsYXp5IHNsaWNlIHRoYXQgaGFzIG5vdCBkZWZpbmVkIGluIHJvb3QgcmVkdWNlcixcbiAqIGUuZy4gXG4gKiBcIlVuZXhwZWN0ZWQga2V5cyBcImNsZWFuXCIsIFwicGFja2FnZXNcIiBmb3VuZCBpbiBwcmVsb2FkZWRTdGF0ZSBhcmd1bWVudCBwYXNzZWQgdG8gY3JlYXRlU3RvcmUuXG4gKiBFeHBlY3RlZCB0byBmaW5kIG9uZSBvZiB0aGUga25vd24gcmVkdWNlciBrZXlzIGluc3RlYWQ6IFwibWFpblwiLiBVbmV4cGVjdGVkIGtleXMgd2lsbCBiZSBpZ25vcmVkLlwiXCJcbiAqIFxuICogSSBoYXZlIHRvIGV4cG9ydCBzYXZlZCBzdGF0ZSwgc28gdGhhdCBlYWN5IGxhenkgc2xpY2UgY2FuIGluaXRpYWxpemUgaXRzIG93biBzbGljZSBzdGF0ZSBieSB0aGVtc2VsZlxuICovXG5jb25zdCBzYXZlZFN0b3JlID0gZnMuZXhpc3RzU3luYyhzdGF0ZUZpbGUpID8gZnMucmVhZEZpbGVTeW5jKHN0YXRlRmlsZSwgJ3V0ZjgnKSA6IG51bGw7XG5pZiAoc2F2ZWRTdG9yZSAmJiBzYXZlZFN0b3JlLmxlbmd0aCA9PT0gMCkge1xuICB0aHJvdyBuZXcgRXJyb3IoJ0VtcHRyeSBzdG9yZSBmaWxlICcgKyBzdGF0ZUZpbGUgKyAnLCBkZWxldGUgaXQgYW5kIGluaXRpYWwgbmV3IHdvcmtzcGFjZXMnKTtcbn1cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1ldmFsXG5leHBvcnQgY29uc3QgbGFzdFNhdmVkU3RhdGUgPSBzYXZlZFN0b3JlID8gZXZhbCgnKCcgKyBzYXZlZFN0b3JlICsgJyknKSA6IHt9O1xuZm9yIChjb25zdCBpZ25vcmVTbGljZU5hbWUgb2YgSUdOT1JFX1NMSUNFKSB7XG4gIGRlbGV0ZSBsYXN0U2F2ZWRTdGF0ZVtpZ25vcmVTbGljZU5hbWVdO1xufVxuXG5leHBvcnQgY29uc3Qgc3RhdGVGYWN0b3J5ID0gbmV3IFN0YXRlRmFjdG9yeShsYXN0U2F2ZWRTdGF0ZSk7XG5jb25zdCBkZWZhdWx0TG9nID0gbG9nNGpzLmdldExvZ2dlcigncGxpbmsuc3RvcmUnKTtcblxuc3RhdGVGYWN0b3J5LmFjdGlvbnNUb0Rpc3BhdGNoLnBpcGUoXG4gIGZpbHRlcihhY3Rpb24gPT4gIWFjdGlvbi50eXBlLmVuZHNXaXRoKCcvX2luaXQnKSAmJlxuICAgICFJR05PUkVfQUNUSU9OLmhhcyhhY3Rpb24udHlwZSkgJiZcbiAgICAhaWdub3JlU2xpY2VTZXQuaGFzKGFjdGlvbi50eXBlLnNsaWNlKDAsIGFjdGlvbi50eXBlLmluZGV4T2YoJy8nKSkpXG4gICksXG4gIHRha2VXaGlsZShhY3Rpb24gPT4gYWN0aW9uLnR5cGUgIT09IEJFRk9SRV9TQVZFX1NUQVRFKSxcbiAgdGFwKChhY3Rpb24pID0+IHtcbiAgICBzdGF0ZUNoYW5nZUNvdW50Kys7XG4gIH0pXG4pLnN1YnNjcmliZSgpO1xuXG5leHBvcnQgZnVuY3Rpb24gc3RhcnRMb2dnaW5nKCkge1xuXG4gIC8vIGNvbnN0IGxvZ1N0YXRlID0gbG9nNGpzLmdldExvZ2dlcigncGxpbmsuc3RvcmUuc3RhdGUnKTtcbiAgY29uc3QgbG9nQWN0aW9uID0gbG9nNGpzLmdldExvZ2dlcigncGxpbmsuc3RvcmUuYWN0aW9uJyk7XG5cbiAgc3RhdGVGYWN0b3J5LmxvZyQucGlwZShcbiAgICB0YXAocGFyYW1zID0+IHtcbiAgICAgIGlmIChwYXJhbXNbMF0gPT09ICdzdGF0ZScpIHtcbiAgICAgICAgLy8gKGxvZ1N0YXRlLmRlYnVnIGFzIGFueSkoLi4ucGFyYW1zLnNsaWNlKDEpKTtcbiAgICAgIH0gZWxzZSBpZiAocGFyYW1zWzBdID09PSAnYWN0aW9uJykge1xuICAgICAgICAobG9nQWN0aW9uLmRlYnVnIGFzIGFueSkoLi4ucGFyYW1zLnNsaWNlKDEpKTtcbiAgICAgIH0gZWxzZVxuICAgICAgICAoZGVmYXVsdExvZy5kZWJ1ZyBhcyBhbnkpKC4uLnBhcmFtcyk7XG4gICAgfSlcbiAgKS5zdWJzY3JpYmUoKTtcbn1cblxubGV0IHNhdmVkID0gZmFsc2U7XG4vKipcbiAqIGEgbGlzdGVuZXIgcmVnaXN0ZXJlZCBvbiB0aGUgJ2JlZm9yZUV4aXQnIGV2ZW50IGNhbiBtYWtlIGFzeW5jaHJvbm91cyBjYWxscywgXG4gKiBhbmQgdGhlcmVieSBjYXVzZSB0aGUgTm9kZS5qcyBwcm9jZXNzIHRvIGNvbnRpbnVlLlxuICogVGhlICdiZWZvcmVFeGl0JyBldmVudCBpcyBub3QgZW1pdHRlZCBmb3IgY29uZGl0aW9ucyBjYXVzaW5nIGV4cGxpY2l0IHRlcm1pbmF0aW9uLFxuICogc3VjaCBhcyBjYWxsaW5nIHByb2Nlc3MuZXhpdCgpIG9yIHVuY2F1Z2h0IGV4Y2VwdGlvbnMuXG4gKi9cbnByb2Nlc3Mub24oJ2JlZm9yZUV4aXQnLCAoY29kZSkgPT4ge1xuICBpZiAoc2F2ZWQpXG4gICAgcmV0dXJuO1xuICBzdGF0ZUZhY3RvcnkuZGlzcGF0Y2goe3R5cGU6ICdCRUZPUkVfU0FWRV9TVEFURScsIHBheWxvYWQ6IG51bGx9KTtcbiAgcHJvY2Vzcy5uZXh0VGljaygoKSA9PiBzYXZlU3RhdGUoKSk7XG59KTtcblxuLyoqXG4gKiBDYWxsIHRoaXMgZnVuY3Rpb24gYmVmb3JlIHlvdSBleHBsaWNpdGx5IHJ1biBwcm9jZXNzLmV4aXQoMCkgdG8gcXVpdCwgYmVjYXVzZSBcImJlZm9yZUV4aXRcIlxuICogd29uJ3QgYmUgdHJpZ2dlcmVkIHByaW9yIHRvIHByb2Nlc3MuZXhpdCgwKVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZVN0YXRlKCkge1xuICBjb25zdCBsb2cgPSBsb2c0anMuZ2V0TG9nZ2VyKCdwbGluay5zdG9yZScpO1xuICBzYXZlZCA9IHRydWU7XG4gIGlmIChzdGF0ZUNoYW5nZUNvdW50ID09PSAwKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBsb2cuaW5mbyhjaGFsay5ncmF5KCdzdGF0ZSBpcyBub3QgY2hhbmdlZCcpKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCFpc01haW5UaHJlYWQpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGxvZy5pbmZvKGNoYWxrLmdyYXkoJ25vdCBpbiBtYWluIHRocmVhZCwgc2tpcCBzYXZpbmcgc3RhdGUnKSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChwcm9jZXNzLnNlbmQgJiYgc3luY1N0YXRlVG9NYWluUHJvY2Vzcykge1xuICAgIGNvbnN0IHN0b3JlID0gYXdhaXQgc3RhdGVGYWN0b3J5LnJvb3RTdG9yZVJlYWR5O1xuICAgIGxvZy5pbmZvKCdzZW5kIHN0YXRlIHN5bmMgbWVzc2FnZScpO1xuICAgIHByb2Nlc3Muc2VuZCh7XG4gICAgICB0eXBlOiBQUk9DRVNTX01TR19UWVBFLFxuICAgICAgZGF0YTogc2VyaWFsaXplKHN0b3JlLmdldFN0YXRlKCksIHtzcGFjZTogJyd9KVxuICAgIH0gYXMgUHJvY2Vzc1N0YXRlU3luY01zZyk7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBsb2cuaW5mbyhjaGFsay5ncmF5KCdpbiBhIGZvcmtlZCBjaGlsZCBwcm9jZXNzLCBza2lwIHNhdmluZyBzdGF0ZScpKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzdG9yZSA9IGF3YWl0IHN0YXRlRmFjdG9yeS5yb290U3RvcmVSZWFkeTtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnNhZmUtYXNzaWdubWVudFxuICBjb25zdCBtZXJnZWRTdGF0ZSA9IE9iamVjdC5hc3NpZ24obGFzdFNhdmVkU3RhdGUsIHN0b3JlLmdldFN0YXRlKCkpO1xuXG4gIGNvbnN0IGpzb25TdHIgPSBzZXJpYWxpemUobWVyZ2VkU3RhdGUsIHtzcGFjZTogJyAgJ30pO1xuICBmc2UubWtkaXJwU3luYyhQYXRoLmRpcm5hbWUoc3RhdGVGaWxlKSk7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMucHJvbWlzZXMud3JpdGVGaWxlKHN0YXRlRmlsZSwganNvblN0cik7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBsb2cuaW5mbyhjaGFsay5ncmF5KFxuICAgICAgYHN0YXRlIGZpbGUgJHtQYXRoLnJlbGF0aXZlKHByb2Nlc3MuY3dkKCksIHN0YXRlRmlsZSl9IHNhdmVkICgke3N0YXRlQ2hhbmdlQ291bnR9KWApKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBsb2cuZXJyb3IoY2hhbGsuZ3JheShgRmFpbGVkIHRvIHdyaXRlIHN0YXRlIGZpbGUgJHtQYXRoLnJlbGF0aXZlKHByb2Nlc3MuY3dkKCksIHN0YXRlRmlsZSl9YCksIGVycik7XG4gIH1cbn1cblxuLy8gVEVTVCBhc3luYyBhY3Rpb24gZm9yIFRodW5rIG1pZGRsZXdhcmVcbi8vIHN0YXRlRmFjdG9yeS5zdG9yZSQuc3Vic2NyaWJlKHN0b3JlID0+IHtcbi8vICAgaWYgKHN0b3JlKSB7XG4vLyAgICAgZGVidWdnZXI7XG4vLyAgICAgc3RvcmUuZGlzcGF0Y2goKGFzeW5jIChkaXNwYXRjaDogYW55KSA9PiB7XG4vLyAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTAwKSk7XG4vLyAgICAgICBkaXNwYXRjaCh7dHlwZTogJ29rJ30pO1xuLy8gICAgIH0pIGFzIGFueSk7XG4vLyAgIH1cbi8vIH0pO1xuIl19