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
// import {findPackage} from './build-target-helper';
// import childProc from 'child_process';
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const plink_1 = require("@wfh/plink");
const chalk_1 = __importDefault(require("chalk"));
const worker_threads_1 = require("worker_threads");
const lodash_1 = __importDefault(require("lodash"));
const log = plink_1.logger.getLogger('@wfh/cra-scripts.webpack-lib');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const MiniCssExtractPlugin = require(path_1.default.resolve('node_modules/mini-css-extract-plugin'));
const MODULE_NAME_PAT = /^((?:@[^\\/]+[\\/])?[^\\/]+)/;
function change(buildPackage, config, nodePath) {
    const foundPkg = [...(0, plink_1.findPackagesByNames)([buildPackage])][0];
    if (foundPkg == null) {
        throw new Error(`Can not find package for name like ${buildPackage}`);
    }
    const { realPath: pkDir } = foundPkg;
    if (Array.isArray(config.entry))
        config.entry = config.entry.filter(item => !/[\\/]react-dev-utils[\\/]webpackHotDevClient/.test(item));
    config.output.path = path_1.default.resolve(pkDir, 'build'); // Have to override it cuz' react-scripts assign `undefined` in non-production env
    config.output.filename = 'lib-bundle.js';
    config.output.libraryTarget = 'umd';
    config.optimization.runtimeChunk = false;
    if (config.optimization && config.optimization.splitChunks) {
        config.optimization.splitChunks = {
            cacheGroups: { default: false }
        };
    }
    // ---- Plugins filter ----
    const InlineChunkHtmlPlugin = require(path_1.default.resolve('node_modules/react-dev-utils/InlineChunkHtmlPlugin'));
    // const InterpolateHtmlPlugin = require(Path.resolve('node_modules/react-dev-utils/InterpolateHtmlPlugin'));
    const ForkTsCheckerWebpackPlugin = require(path_1.default.resolve('node_modules/react-dev-utils/ForkTsCheckerWebpackPlugin'));
    // const HtmlWebpackPlugin = require(Path.resolve('node_modules/html-webpack-plugin'));
    const { HotModuleReplacementPlugin } = require(path_1.default.resolve('node_modules/webpack'));
    config.plugins = config.plugins.filter(plugin => {
        return [MiniCssExtractPlugin,
            ForkTsCheckerWebpackPlugin,
            InlineChunkHtmlPlugin,
            HotModuleReplacementPlugin
            // HtmlWebpackPlugin,
            // InterpolateHtmlPlugin
        ].every(cls => !(plugin instanceof cls));
    });
    findAndChangeRule(config.module.rules);
    const cmdOpts = (0, utils_1.getCmdOptions)();
    const externalRequestSet = new Set();
    const includeModuleRe = (cmdOpts.includes || [])
        .map(mod => new RegExp(mod));
    includeModuleRe.push(new RegExp(lodash_1.default.escapeRegExp(cmdOpts.buildTarget)));
    if (config.externals == null) {
        config.externals = [];
    }
    let entrySet;
    config.externals
        .push((context, request, callback) => __awaiter(this, void 0, void 0, function* () {
        if (includeModuleRe.some(rg => rg.test(request))) {
            return callback();
        }
        if (entrySet == null && config.entry)
            entrySet = yield createEntrySet(config.entry);
        if ((!request.startsWith('.') && !entrySet.has(request) &&
            !/[?!]/.test(request)) // && (!/(?:^|[\\/])@babel[\\/]runtime[\\/]/.test(request))
            ||
                // TODO: why hard coe bklib ?
                request.indexOf('/bklib.min') >= 0) {
            if (path_1.default.isAbsolute(request)) {
                log.info('request absolute path:', request);
                return callback();
            }
            else {
                log.debug('external request:', request, `(${context})`);
                externalRequestSet.add(request);
                return callback(null, request);
            }
        }
        callback();
    }));
    config.plugins.push(
    // new EsmWebpackPlugin(),
    new (class {
        constructor() {
            this.forkDone = Promise.resolve();
        }
        apply(compiler) {
            compiler.hooks.done.tap('cra-scripts', stats => {
                this.forkDone = this.forkDone.then(() => forkTsc());
                const externalDeps = new Set();
                const workspaceNodeDir = plink_1.plinkEnv.workDir + path_1.default.sep + 'node_modules' + path_1.default.sep;
                for (const req of externalRequestSet.values()) {
                    if (path_1.default.isAbsolute(req) && path_1.default.resolve(req).startsWith(workspaceNodeDir)) {
                        const m = MODULE_NAME_PAT.exec(req.slice(workspaceNodeDir.length));
                        externalDeps.add(m ? m[1] : req.slice(workspaceNodeDir.length));
                    }
                    else {
                        const m = MODULE_NAME_PAT.exec(req);
                        externalDeps.add(m ? m[1] : req);
                    }
                }
                log.warn(chalk_1.default.red('external dependencies:\n  ' + [...externalDeps.values()].join(', ')));
            });
        }
    })());
}
exports.default = change;
function createEntrySet(configEntry, entrySet) {
    return __awaiter(this, void 0, void 0, function* () {
        if (entrySet == null)
            entrySet = new Set();
        if (Array.isArray(configEntry)) {
            for (const entry of configEntry) {
                entrySet.add(entry);
            }
        }
        else if (typeof configEntry === 'string') {
            entrySet.add(configEntry);
        }
        else if (typeof configEntry === 'function') {
            yield Promise.resolve(configEntry()).then(entries => createEntrySet(entries));
        }
        else if (typeof configEntry === 'object') {
            yield Promise.all(Object.entries(configEntry).map(([_key, value]) => {
                return createEntrySet(value);
            }));
        }
        return entrySet;
    });
}
function findAndChangeRule(rules) {
    // TODO: check in case CRA will use Rule.use instead of "loader"
    checkSet(rules);
    for (const rule of rules) {
        if (Array.isArray(rule.use)) {
            checkSet(rule.use);
        }
        else if (Array.isArray(rule.loader)) {
            checkSet(rule.loader);
        }
        else if (rule.oneOf) {
            return findAndChangeRule(rule.oneOf);
        }
    }
    function checkSet(set) {
        const found = set.findIndex(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
        use => use.loader && use.loader.indexOf(MiniCssExtractPlugin.loader) >= 0);
        // const found = rule.use.findIndex(use => (use as any).loader && (use as any).loader.indexOf('mini-css-extract-plugin') >= 0);
        if (found >= 0) {
            set.splice(found, 1);
            set.unshift(require.resolve('style-loader'));
        }
    }
    return;
}
function forkTsc() {
    return __awaiter(this, void 0, void 0, function* () {
        const worker = new worker_threads_1.Worker(require.resolve('./tsd-generate-thread'), { execArgv: ['--preserve-symlinks-main', '--preserve-symlinks'] });
        log.warn('forkTsc, threadId:', worker.threadId);
        yield new Promise((resolve, rej) => {
            worker.on('exit', code => {
                if (code !== 0) {
                    rej(new Error(`Worker stopped with exit code ${code}`));
                }
                else {
                    resolve();
                }
                worker.off('message', rej);
                worker.off('error', rej);
            });
            worker.on('message', rej);
            worker.on('error', rej);
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VicGFjay1saWIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ3ZWJwYWNrLWxpYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLHFEQUFxRDtBQUNyRCx5Q0FBeUM7QUFDekMsZ0RBQXdCO0FBQ3hCLG1DQUF3QztBQUN4QyxzQ0FBMkU7QUFDM0Usa0RBQTBCO0FBQzFCLG1EQUFzQztBQUN0QyxvREFBdUI7QUFDdkIsTUFBTSxHQUFHLEdBQUcsY0FBTSxDQUFDLFNBQVMsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0FBRTdELG1FQUFtRTtBQUNuRSxNQUFNLG9CQUFvQixHQUFHLE9BQU8sQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLHNDQUFzQyxDQUFDLENBQUMsQ0FBQztBQUUzRixNQUFNLGVBQWUsR0FBRyw4QkFBOEIsQ0FBQztBQUV2RCxTQUF3QixNQUFNLENBQUMsWUFBb0IsRUFBRSxNQUFxQixFQUFFLFFBQWtCO0lBQzVGLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxJQUFBLDJCQUFtQixFQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdELElBQUksUUFBUSxJQUFJLElBQUksRUFBRTtRQUNwQixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0tBQ3ZFO0lBQ0QsTUFBTSxFQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUMsR0FBRyxRQUFRLENBQUM7SUFFbkMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDN0IsTUFBTSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsOENBQThDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFFekcsTUFBTSxDQUFDLE1BQU8sQ0FBQyxJQUFJLEdBQUcsY0FBSSxD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Q0FBQztpQkFDWDtnQkFDRCxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDM0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDM0IsQ0FBQyxDQUFDLENBQUM7WUFDSCxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMxQixNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Q29uZmlndXJhdGlvbiwgQ29tcGlsZXIsIFJ1bGVTZXRSdWxlLCBSdWxlU2V0VXNlSXRlbX0gZnJvbSAnd2VicGFjayc7XG4vLyBpbXBvcnQge2ZpbmRQYWNrYWdlfSBmcm9tICcuL2J1aWxkLXRhcmdldC1oZWxwZXInO1xuLy8gaW1wb3J0IGNoaWxkUHJvYyBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZ2V0Q21kT3B0aW9ucyB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHtsb2dnZXIgYXMgbG9nNGpzLCBmaW5kUGFja2FnZXNCeU5hbWVzLCBwbGlua0Vudn0gZnJvbSAnQHdmaC9wbGluayc7XG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IHtXb3JrZXJ9IGZyb20gJ3dvcmtlcl90aHJlYWRzJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5jb25zdCBsb2cgPSBsb2c0anMuZ2V0TG9nZ2VyKCdAd2ZoL2NyYS1zY3JpcHRzLndlYnBhY2stbGliJyk7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW5zYWZlLWFzc2lnbm1lbnRcbmNvbnN0IE1pbmlDc3NFeHRyYWN0UGx1Z2luID0gcmVxdWlyZShQYXRoLnJlc29sdmUoJ25vZGVfbW9kdWxlcy9taW5pLWNzcy1leHRyYWN0LXBsdWdpbicpKTtcblxuY29uc3QgTU9EVUxFX05BTUVfUEFUID0gL14oKD86QFteXFxcXC9dK1tcXFxcL10pP1teXFxcXC9dKykvO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjaGFuZ2UoYnVpbGRQYWNrYWdlOiBzdHJpbmcsIGNvbmZpZzogQ29uZmlndXJhdGlvbiwgbm9kZVBhdGg6IHN0cmluZ1tdKSB7XG4gIGNvbnN0IGZvdW5kUGtnID0gWy4uLmZpbmRQYWNrYWdlc0J5TmFtZXMoW2J1aWxkUGFja2FnZV0pXVswXTtcbiAgaWYgKGZvdW5kUGtnID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbiBub3QgZmluZCBwYWNrYWdlIGZvciBuYW1lIGxpa2UgJHtidWlsZFBhY2thZ2V9YCk7XG4gIH1cbiAgY29uc3Qge3JlYWxQYXRoOiBwa0Rpcn0gPSBmb3VuZFBrZztcblxuICBpZiAoQXJyYXkuaXNBcnJheShjb25maWcuZW50cnkpKVxuICAgIGNvbmZpZy5lbnRyeSA9IGNvbmZpZy5lbnRyeS5maWx0ZXIoaXRlbSA9PiAhL1tcXFxcL11yZWFjdC1kZXYtdXRpbHNbXFxcXC9dd2VicGFja0hvdERldkNsaWVudC8udGVzdChpdGVtKSk7XG5cbiAgY29uZmlnLm91dHB1dCEucGF0aCA9IFBhdGgucmVzb2x2ZShwa0RpciwgJ2J1aWxkJyk7IC8vIEhhdmUgdG8gb3ZlcnJpZGUgaXQgY3V6JyByZWFjdC1zY3JpcHRzIGFzc2lnbiBgdW5kZWZpbmVkYCBpbiBub24tcHJvZHVjdGlvbiBlbnZcbiAgY29uZmlnLm91dHB1dCEuZmlsZW5hbWUgPSAnbGliLWJ1bmRsZS5qcyc7XG4gIGNvbmZpZy5vdXRwdXQhLmxpYnJhcnlUYXJnZXQgPSAndW1kJztcbiAgY29uZmlnLm9wdGltaXphdGlvbiEucnVudGltZUNodW5rID0gZmFsc2U7XG4gIGlmIChjb25maWcub3B0aW1pemF0aW9uICYmIGNvbmZpZy5vcHRpbWl6YXRpb24uc3BsaXRDaHVua3MpIHtcbiAgICBjb25maWcub3B0aW1pemF0aW9uLnNwbGl0Q2h1bmtzID0ge1xuICAgICAgY2FjaGVHcm91cHM6IHtkZWZhdWx0OiBmYWxzZX1cbiAgICB9O1xuICB9XG5cbiAgLy8gLS0tLSBQbHVnaW5zIGZpbHRlciAtLS0tXG5cbiAgY29uc3QgSW5saW5lQ2h1bmtIdG1sUGx1Z2luID0gcmVxdWlyZShQYXRoLnJlc29sdmUoJ25vZGVfbW9kdWxlcy9yZWFjdC1kZXYtdXRpbHMvSW5saW5lQ2h1bmtIdG1sUGx1Z2luJykpO1xuICAvLyBjb25zdCBJbnRlcnBvbGF0ZUh0bWxQbHVnaW4gPSByZXF1aXJlKFBhdGgucmVzb2x2ZSgnbm9kZV9tb2R1bGVzL3JlYWN0LWRldi11dGlscy9JbnRlcnBvbGF0ZUh0bWxQbHVnaW4nKSk7XG4gIGNvbnN0IEZvcmtUc0NoZWNrZXJXZWJwYWNrUGx1Z2luID0gcmVxdWlyZShQYXRoLnJlc29sdmUoJ25vZGVfbW9kdWxlcy9yZWFjdC1kZXYtdXRpbHMvRm9ya1RzQ2hlY2tlcldlYnBhY2tQbHVnaW4nKSk7XG4gIC8vIGNvbnN0IEh0bWxXZWJwYWNrUGx1Z2luID0gcmVxdWlyZShQYXRoLnJlc29sdmUoJ25vZGVfbW9kdWxlcy9odG1sLXdlYnBhY2stcGx1Z2luJykpO1xuICBjb25zdCB7SG90TW9kdWxlUmVwbGFjZW1lbnRQbHVnaW59ID0gcmVxdWlyZShQYXRoLnJlc29sdmUoJ25vZGVfbW9kdWxlcy93ZWJwYWNrJykpO1xuXG4gIGNvbmZpZy5wbHVnaW5zID0gY29uZmlnLnBsdWdpbnMhLmZpbHRlcihwbHVnaW4gPT4ge1xuXG4gICAgcmV0dXJuIFtNaW5pQ3NzRXh0cmFjdFBsdWdpbixcbiAgICAgIEZvcmtUc0NoZWNrZXJXZWJwYWNrUGx1Z2luLFxuICAgICAgSW5saW5lQ2h1bmtIdG1sUGx1Z2luLFxuICAgICAgSG90TW9kdWxlUmVwbGFjZW1lbnRQbHVnaW5cbiAgICAgIC8vIEh0bWxXZWJwYWNrUGx1Z2luLFxuICAgICAgLy8gSW50ZXJwb2xhdGVIdG1sUGx1Z2luXG4gICAgXS5ldmVyeShjbHMgPT4gIShwbHVnaW4gaW5zdGFuY2VvZiBjbHMpKTtcbiAgfSk7XG5cbiAgZmluZEFuZENoYW5nZVJ1bGUoY29uZmlnLm1vZHVsZSEucnVsZXMpO1xuXG4gIGNvbnN0IGNtZE9wdHMgPSBnZXRDbWRPcHRpb25zKCk7XG4gIGNvbnN0IGV4dGVybmFsUmVxdWVzdFNldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBpbmNsdWRlTW9kdWxlUmUgPSAoY21kT3B0cy5pbmNsdWRlcyB8fCBbXSlcbiAgICAubWFwKG1vZCA9PiBuZXcgUmVnRXhwKG1vZCkpO1xuICBpbmNsdWRlTW9kdWxlUmUucHVzaChuZXcgUmVnRXhwKF8uZXNjYXBlUmVnRXhwKGNtZE9wdHMuYnVpbGRUYXJnZXQpKSk7XG5cbiAgaWYgKGNvbmZpZy5leHRlcm5hbHMgPT0gbnVsbCkge1xuICAgIGNvbmZpZy5leHRlcm5hbHMgPSBbXTtcbiAgfVxuXG4gIGxldCBlbnRyeVNldDogU2V0PHN0cmluZz47XG5cbiAgKGNvbmZpZy5leHRlcm5hbHMgYXMgRXh0cmFjdDxDb25maWd1cmF0aW9uWydleHRlcm5hbHMnXSwgQXJyYXk8YW55Pj4pXG4gICAgLnB1c2goXG4gICAgICBhc3luYyAoY29udGV4dDogc3RyaW5nLCByZXF1ZXN0OiBzdHJpbmcsIGNhbGxiYWNrOiAoZXJyb3I/OiBhbnksIHJlc3VsdD86IGFueSkgPT4gdm9pZCApID0+IHtcbiAgICAgICAgaWYgKGluY2x1ZGVNb2R1bGVSZS5zb21lKHJnID0+IHJnLnRlc3QocmVxdWVzdCkpKSB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVudHJ5U2V0ID09IG51bGwgJiYgY29uZmlnLmVudHJ5KVxuICAgICAgICAgIGVudHJ5U2V0ID0gYXdhaXQgY3JlYXRlRW50cnlTZXQoY29uZmlnLmVudHJ5KTtcblxuICAgICAgICBpZiAoKCFyZXF1ZXN0LnN0YXJ0c1dpdGgoJy4nKSAmJiAhZW50cnlTZXQuaGFzKHJlcXVlc3QpICYmXG4gICAgICAgICAgIS9bPyFdLy50ZXN0KHJlcXVlc3QpKSAvLyAmJiAoIS8oPzpefFtcXFxcL10pQGJhYmVsW1xcXFwvXXJ1bnRpbWVbXFxcXC9dLy50ZXN0KHJlcXVlc3QpKVxuICAgICAgICAgIHx8XG4gICAgICAgICAgLy8gVE9ETzogd2h5IGhhcmQgY29lIGJrbGliID9cbiAgICAgICAgICByZXF1ZXN0LmluZGV4T2YoJy9ia2xpYi5taW4nKSA+PSAwKSB7XG5cbiAgICAgICAgICBpZiAoUGF0aC5pc0Fic29sdXRlKHJlcXVlc3QpKSB7XG4gICAgICAgICAgICBsb2cuaW5mbygncmVxdWVzdCBhYnNvbHV0ZSBwYXRoOicsIHJlcXVlc3QpO1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZygnZXh0ZXJuYWwgcmVxdWVzdDonLCByZXF1ZXN0LCBgKCR7Y29udGV4dH0pYCk7XG4gICAgICAgICAgICBleHRlcm5hbFJlcXVlc3RTZXQuYWRkKHJlcXVlc3QpO1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHJlcXVlc3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfVxuICAgICk7XG5cbiAgY29uZmlnLnBsdWdpbnMucHVzaChcbiAgICAvLyBuZXcgRXNtV2VicGFja1BsdWdpbigpLFxuICAgIG5ldyAoY2xhc3Mge1xuICAgICAgZm9ya0RvbmU6IFByb21pc2U8YW55PiA9IFByb21pc2UucmVzb2x2ZSgpO1xuXG4gICAgICBhcHBseShjb21waWxlcjogQ29tcGlsZXIpIHtcbiAgICAgICAgY29tcGlsZXIuaG9va3MuZG9uZS50YXAoJ2NyYS1zY3JpcHRzJywgc3RhdHMgPT4ge1xuICAgICAgICAgIHRoaXMuZm9ya0RvbmUgPSB0aGlzLmZvcmtEb25lLnRoZW4oKCkgPT4gZm9ya1RzYygpKTtcbiAgICAgICAgICBjb25zdCBleHRlcm5hbERlcHM6IFNldDxzdHJpbmc+ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgICAgY29uc3Qgd29ya3NwYWNlTm9kZURpciA9IHBsaW5rRW52LndvcmtEaXIgKyBQYXRoLnNlcCArICdub2RlX21vZHVsZXMnICsgUGF0aC5zZXA7XG4gICAgICAgICAgZm9yIChjb25zdCByZXEgb2YgZXh0ZXJuYWxSZXF1ZXN0U2V0LnZhbHVlcygpKSB7XG4gICAgICAgICAgICBpZiAoUGF0aC5pc0Fic29sdXRlKHJlcSkgJiYgUGF0aC5yZXNvbHZlKHJlcSkuc3RhcnRzV2l0aCh3b3Jrc3BhY2VOb2RlRGlyKSkge1xuICAgICAgICAgICAgICBjb25zdCBtID0gTU9EVUxFX05BTUVfUEFULmV4ZWMocmVxLnNsaWNlKHdvcmtzcGFjZU5vZGVEaXIubGVuZ3RoKSk7XG4gICAgICAgICAgICAgIGV4dGVybmFsRGVwcy5hZGQobSA/IG1bMV0gOiByZXEuc2xpY2Uod29ya3NwYWNlTm9kZURpci5sZW5ndGgpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNvbnN0IG0gPSBNT0RVTEVfTkFNRV9QQVQuZXhlYyhyZXEpO1xuICAgICAgICAgICAgICBleHRlcm5hbERlcHMuYWRkKG0gPyBtWzFdIDogcmVxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgbG9nLndhcm4oY2hhbGsucmVkKCdleHRlcm5hbCBkZXBlbmRlbmNpZXM6XFxuICAnICsgWy4uLmV4dGVybmFsRGVwcy52YWx1ZXMoKV0uam9pbignLCAnKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KSgpXG4gICk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUVudHJ5U2V0KGNvbmZpZ0VudHJ5OiBOb25OdWxsYWJsZTxDb25maWd1cmF0aW9uWydlbnRyeSddPiwgZW50cnlTZXQ/OiBTZXQ8c3RyaW5nPikge1xuICBpZiAoZW50cnlTZXQgPT0gbnVsbClcbiAgICBlbnRyeVNldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KGNvbmZpZ0VudHJ5KSkge1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgY29uZmlnRW50cnkpIHtcbiAgICAgIGVudHJ5U2V0LmFkZChlbnRyeSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBjb25maWdFbnRyeSA9PT0gJ3N0cmluZycpIHtcbiAgICBlbnRyeVNldC5hZGQoY29uZmlnRW50cnkpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBjb25maWdFbnRyeSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGF3YWl0IFByb21pc2UucmVzb2x2ZShjb25maWdFbnRyeSgpKS50aGVuKGVudHJpZXMgPT4gY3JlYXRlRW50cnlTZXQoZW50cmllcykpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBjb25maWdFbnRyeSA9PT0gJ29iamVjdCcpIHtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChPYmplY3QuZW50cmllcyhjb25maWdFbnRyeSkubWFwKChbX2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICByZXR1cm4gY3JlYXRlRW50cnlTZXQodmFsdWUpO1xuICAgIH0pKTtcbiAgfVxuICByZXR1cm4gZW50cnlTZXQ7XG59XG5cblxuZnVuY3Rpb24gZmluZEFuZENoYW5nZVJ1bGUocnVsZXM6IFJ1bGVTZXRSdWxlW10pOiB2b2lkIHtcbiAgLy8gVE9ETzogY2hlY2sgaW4gY2FzZSBDUkEgd2lsbCB1c2UgUnVsZS51c2UgaW5zdGVhZCBvZiBcImxvYWRlclwiXG4gIGNoZWNrU2V0KHJ1bGVzKTtcbiAgZm9yIChjb25zdCBydWxlIG9mIHJ1bGVzKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocnVsZS51c2UpKSB7XG4gICAgICBjaGVja1NldChydWxlLnVzZSk7XG5cbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocnVsZS5sb2FkZXIpKSB7XG4gICAgICAgIGNoZWNrU2V0KHJ1bGUubG9hZGVyKTtcbiAgICB9IGVsc2UgaWYgKHJ1bGUub25lT2YpIHtcbiAgICAgIHJldHVybiBmaW5kQW5kQ2hhbmdlUnVsZShydWxlLm9uZU9mKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjaGVja1NldChzZXQ6IChSdWxlU2V0UnVsZSB8IFJ1bGVTZXRVc2VJdGVtKVtdKSB7XG4gICAgY29uc3QgZm91bmQgPSBzZXQuZmluZEluZGV4KFxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnNhZmUtbWVtYmVyLWFjY2VzcyxAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW5zYWZlLWNhbGxcbiAgICAgIHVzZSA9PiAodXNlIGFzIGFueSkubG9hZGVyICYmICh1c2UgYXMgYW55KS5sb2FkZXIuaW5kZXhPZihNaW5pQ3NzRXh0cmFjdFBsdWdpbi5sb2FkZXIpID49IDApO1xuICAgIC8vIGNvbnN0IGZvdW5kID0gcnVsZS51c2UuZmluZEluZGV4KHVzZSA9PiAodXNlIGFzIGFueSkubG9hZGVyICYmICh1c2UgYXMgYW55KS5sb2FkZXIuaW5kZXhPZignbWluaS1jc3MtZXh0cmFjdC1wbHVnaW4nKSA+PSAwKTtcbiAgICBpZiAoZm91bmQgPj0gMCkge1xuICAgICAgc2V0LnNwbGljZShmb3VuZCwgMSk7XG4gICAgICBzZXQudW5zaGlmdChyZXF1aXJlLnJlc29sdmUoJ3N0eWxlLWxvYWRlcicpKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmb3JrVHNjKCkge1xuICBjb25zdCB3b3JrZXIgPSBuZXcgV29ya2VyKHJlcXVpcmUucmVzb2x2ZSgnLi90c2QtZ2VuZXJhdGUtdGhyZWFkJyksIHtleGVjQXJndjogWyctLXByZXNlcnZlLXN5bWxpbmtzLW1haW4nLCAnLS1wcmVzZXJ2ZS1zeW1saW5rcyddfSk7XG4gIGxvZy53YXJuKCdmb3JrVHNjLCB0aHJlYWRJZDonLCB3b3JrZXIudGhyZWFkSWQpO1xuICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqKSA9PiB7XG4gICAgd29ya2VyLm9uKCdleGl0JywgY29kZSA9PiB7XG4gICAgICBpZiAoY29kZSAhPT0gMCkge1xuICAgICAgICByZWoobmV3IEVycm9yKGBXb3JrZXIgc3RvcHBlZCB3aXRoIGV4aXQgY29kZSAke2NvZGV9YCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfVxuICAgICAgd29ya2VyLm9mZignbWVzc2FnZScsIHJlaik7XG4gICAgICB3b3JrZXIub2ZmKCdlcnJvcicsIHJlaik7XG4gICAgfSk7XG4gICAgd29ya2VyLm9uKCdtZXNzYWdlJywgcmVqKTtcbiAgICB3b3JrZXIub24oJ2Vycm9yJywgcmVqKTtcbiAgfSk7XG59XG4iXX0=