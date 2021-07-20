#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.default = void 0;
// import replacePatches, { ReplacementInf } from '@wfh/plink/wfh/dist/utils/patch-text';
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
const child_process_1 = require("child_process");
const plink_1 = require("@wfh/plink");
const __plink_1 = __importDefault(require("__plink"));
// import {ObjectAst} from '@wfh/plink/wfh/di st/utils/json-sync-parser';
const cli = (program) => {
    const buildCmd = program.command('cra-build <app|lib> <package-name>')
        .description('Compile react application or library (work with create-react-app v4.0.3)', {
        'app|lib': '"app" stands for building a complete application like create-react-app,\n' +
            '"lib" stands for building a library',
        'package-name': 'target package name, the "scope" name part can be omitted'
    })
        .option('-w, --watch', 'when argument is "lib", watch file changes and compile', false)
        // .option('--tsd-only', 'In "lib" mode (building a library), only build out Typescript tsd file')
        // .option('--dev', 'set NODE_ENV to "development", enable react-scripts in dev mode', false)
        // .option('-e, --external <module-path-regex>',
        // '(multiple value), when argument is "lib", by default we will set "external" property of Webpack configuration for ' +
        //   'all request that does not begin with "." (not relative path) or contains "?!" character,' +
        //   ' meaning all non-relative modules will not be included in the output bundle file. ' +
        //   'To change this behavior, you can explicitly provide a list of "external" module name with this option, in form of regular expression, ' +
        //   '(e.g. -e "^react(/|$)" -e "^react-dom(/|$)"),  to make nothing "external": -e "^$" (any RegExp that never matches)', (value, prev) => { prev.push(value); return prev;}, [] as string[])
        .option('-i, --include <module-path-regex>', '(multiple value), when argument is "lib", we will set "external" property of Webpack configuration for all request not begin with "." (not relative path), ' +
        'meaning all non-relative modules will not be included in the output bundle file, you need to explicitly provide a list in' +
        ' Regular expression (e.g. -i \'^someLib(/|$)\' -i \'^someLib2(/|$)\' -i ...) ' +
        ' to make them be included in bundle file. To make specific module (React) external: -i \'^(?!react(-dom)?($|/))\'', arrayOptionFn, [])
        .option('--source-map', 'set environment variable GENERATE_SOURCEMAP to "true" (see https://create-react-app.dev/docs/advanced-configuration', false)
        .action((type, pkgName) => {
        initEverything(buildCmd, type, pkgName);
        if (buildCmd.opts().sourceMap) {
            __plink_1.default.logger.info('source map is enabled');
            process.env.GENERATE_SOURCEMAP = 'true';
        }
        require('react-scripts/scripts/build');
    });
    withClicOpt(buildCmd);
    program.command('cra-build-tsd <package-name>')
        .description('Compile packages for only generating Typescript definition files. If you are creating a library, ' +
        'command "cra-build" will also generate tsd file along with client bundle', {
        'package-name': 'target package name, the "scope" name part can be omitted'
    })
        .action((pkgName) => __awaiter(void 0, void 0, void 0, function* () {
        initEverything(StartCmd, 'lib', pkgName);
        yield (yield Promise.resolve().then(() => __importStar(require('../tsd-generate')))).buildTsd([pkgName]);
    }));
    const StartCmd = program.command('cra-start <package-name>')
        .description('Run CRA start script for react application or library (work with create-react-app v4.0.3)', {
        'package-name': 'target package name, the "scope" name part can be omitted'
    })
        .action((pkgName) => __awaiter(void 0, void 0, void 0, function* () {
        initEverything(StartCmd, 'app', pkgName);
        require('react-scripts/scripts/start');
    }));
    withClicOpt(StartCmd);
    program.command('cra-open <url>')
        .description('Run react-dev-utils/openBrowser', { url: 'URL' })
        .action((url) => __awaiter(void 0, void 0, void 0, function* () {
        (yield Promise.resolve().then(() => __importStar(require('../cra-open-browser')))).default(url);
    }));
    // const initCmd = program.command('cra-init')
    // .description('Initial workspace files based on files which are newly generated by create-react-app')
    // .action(async () => {
    //   const opt: GlobalOptions = {prop: [], config: []};
    //   await initConfigAsync(opt);
    //   // await initTsconfig();
    // });
    // // withGlobalOptions(initCmd);
    program.command('cra-analyze [js-dir]')
        .alias('cra-analyse')
        .description('Run source-map-explorer', {
        'js-dir': 'Normally this path should be <root-dir>dist/static/<output-path-basename>/static/js'
    })
        .action((outputPath) => __awaiter(void 0, void 0, void 0, function* () {
        const smePkgDir = path_1.default.dirname(require.resolve('source-map-explorer/package.json'));
        const smeBin = require(path_1.default.resolve(smePkgDir, 'package.json')).bin['source-map-explorer'];
        yield new Promise((resolve, rej) => {
            const cp = child_process_1.fork(path_1.default.resolve(smePkgDir, smeBin), [
                '--gzip', '--no-root',
                path_1.default.resolve(outputPath ? outputPath : '', '*.js')
            ], { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });
            cp.on('error', err => {
                console.error(err);
                rej(err);
            });
            cp.on('exit', (sign, code) => { resolve(code); });
        });
    }));
    // smeCmd.usage(smeCmd.usage() + '\n  app-base-path: ')
};
exports.default = cli;
function withClicOpt(cmd) {
    cmd.option('--purl, --publicUrl <string>', 'set environment variable PUBLIC_URL for react-scripts', undefined);
}
function arrayOptionFn(curr, prev) {
    if (prev)
        prev.push(curr);
    return prev;
}
function initEverything(buildCmd, type, pkgName) {
    // const cfg = await initConfigAsync(buildCmd.opts() as GlobalOptions);
    const cfg = plink_1.config;
    // await initTsconfig();
    utils_1.saveCmdOptionsToEnv(pkgName, buildCmd, type);
    if (process.env.PORT == null && cfg().port)
        process.env.PORT = cfg().port + '';
    // await walkPackagesAndSetupInjector(process.env.PUBLIC_URL || '/');
    if (!['app', 'lib'].includes(type)) {
        __plink_1.default.logger.error('type argument must be one of \'app\', \'lib\'');
        return;
    }
    const preload = require('../preload');
    preload.poo();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0EseUZBQXlGO0FBQ3pGLGdEQUF3QjtBQUV4QixvQ0FBNkM7QUFDN0MsaURBQW1DO0FBSW5DLHNDQUFrQztBQUNsQyxzREFBNEI7QUFDNUIseUVBQXlFO0FBRXpFLE1BQU0sR0FBRyxHQUFpQixDQUFDLE9BQU8sRUFBRSxFQUFFO0lBQ3BDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsb0NBQW9DLENBQUM7U0FDckUsV0FBVyxDQUFDLDBFQUEwRSxFQUFFO1FBQ3ZGLFNBQVMsRUFBRSwyRUFBMkU7WUFDcEYscUNBQXFDO1FBQ3ZDLGNBQWMsRUFBRSwyREFBMkQ7S0FDNUUsQ0FBQztTQUNELE1BQU0sQ0FBQyxhQUFhLEVBQUUsd0RBQXdELEVBQUUsS0FBSyxDQUFDO1FBQ3ZGLGtHQUFrRztRQUNsRyw2RkFBNkY7UUFDN0YsZ0RBQWdEO1FBQ2hELHlIQUF5SDtRQUN6SCxpR0FBaUc7UUFDakcsMkZBQTJGO1FBQzNGLCtJQUErSTtRQUMvSSw4TEFBOEw7U0FDN0wsTUFBTSxDQUFDLG1DQUFtQyxFQUMzQyw2SkFBNko7UUFDN0osMkhBQTJIO1FBQzNILCtFQUErRTtRQUMvRSxtSEFBbUgsRUFBRSxhQUFhLEVBQUUsRUFBRSxDQUFDO1NBQ3RJLE1BQU0sQ0FBQyxjQUFjLEVBQUUscUhBQXFILEVBQUUsS0FBSyxDQUFDO1NBQ3BKLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsRUFBRTtRQUN4QixjQUFjLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN4QyxJQUFJLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEVBQUU7WUFDN0IsaUJBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENB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QUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO1FBQ3BFLE9BQU87S0FDUjtJQUNELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQW9CLENBQUM7SUFDekQsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG4vLyBpbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHtDbGlFeHRlbnNpb259IGZyb20gJ0B3ZmgvcGxpbmsnO1xuLy8gaW1wb3J0IHJlcGxhY2VQYXRjaGVzLCB7IFJlcGxhY2VtZW50SW5mIH0gZnJvbSAnQHdmaC9wbGluay93ZmgvZGlzdC91dGlscy9wYXRjaC10ZXh0JztcbmltcG9ydCBQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGNvbW1hbmRlciBmcm9tICdDb21tYW5kZXInO1xuaW1wb3J0IHtzYXZlQ21kT3B0aW9uc1RvRW52fSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQge2Zvcmt9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuLy8gaW1wb3J0IHdhbGtQYWNrYWdlc0FuZFNldHVwSW5qZWN0b3IgZnJvbSAnQHdmaC93ZWJwYWNrLWNvbW1vbi9kaXN0L2luaXRJbmplY3RvcnMnO1xuLy8gaW1wb3J0IHtpbml0VHNjb25maWd9IGZyb20gJy4vY2xpLWluaXQnO1xuaW1wb3J0ICogYXMgX3ByZWxvYWQgZnJvbSAnLi4vcHJlbG9hZCc7XG5pbXBvcnQge2NvbmZpZ30gZnJvbSAnQHdmaC9wbGluayc7XG5pbXBvcnQgcGxpbmsgZnJvbSAnX19wbGluayc7XG4vLyBpbXBvcnQge09iamVjdEFzdH0gZnJvbSAnQHdmaC9wbGluay93ZmgvZGkgc3QvdXRpbHMvanNvbi1zeW5jLXBhcnNlcic7XG5cbmNvbnN0IGNsaTogQ2xpRXh0ZW5zaW9uID0gKHByb2dyYW0pID0+IHtcbiAgY29uc3QgYnVpbGRDbWQgPSBwcm9ncmFtLmNvbW1hbmQoJ2NyYS1idWlsZCA8YXBwfGxpYj4gPHBhY2thZ2UtbmFtZT4nKVxuICAuZGVzY3JpcHRpb24oJ0NvbXBpbGUgcmVhY3QgYXBwbGljYXRpb24gb3IgbGlicmFyeSAod29yayB3aXRoIGNyZWF0ZS1yZWFjdC1hcHAgdjQuMC4zKScsIHtcbiAgICAnYXBwfGxpYic6ICdcImFwcFwiIHN0YW5kcyBmb3IgYnVpbGRpbmcgYSBjb21wbGV0ZSBhcHBsaWNhdGlvbiBsaWtlIGNyZWF0ZS1yZWFjdC1hcHAsXFxuJyArXG4gICAgICAnXCJsaWJcIiBzdGFuZHMgZm9yIGJ1aWxkaW5nIGEgbGlicmFyeScsXG4gICAgJ3BhY2thZ2UtbmFtZSc6ICd0YXJnZXQgcGFja2FnZSBuYW1lLCB0aGUgXCJzY29wZVwiIG5hbWUgcGFydCBjYW4gYmUgb21pdHRlZCdcbiAgfSlcbiAgLm9wdGlvbignLXcsIC0td2F0Y2gnLCAnd2hlbiBhcmd1bWVudCBpcyBcImxpYlwiLCB3YXRjaCBmaWxlIGNoYW5nZXMgYW5kIGNvbXBpbGUnLCBmYWxzZSlcbiAgLy8gLm9wdGlvbignLS10c2Qtb25seScsICdJbiBcImxpYlwiIG1vZGUgKGJ1aWxkaW5nIGEgbGlicmFyeSksIG9ubHkgYnVpbGQgb3V0IFR5cGVzY3JpcHQgdHNkIGZpbGUnKVxuICAvLyAub3B0aW9uKCctLWRldicsICdzZXQgTk9ERV9FTlYgdG8gXCJkZXZlbG9wbWVudFwiLCBlbmFibGUgcmVhY3Qtc2NyaXB0cyBpbiBkZXYgbW9kZScsIGZhbHNlKVxuICAvLyAub3B0aW9uKCctZSwgLS1leHRlcm5hbCA8bW9kdWxlLXBhdGgtcmVnZXg+JyxcbiAgLy8gJyhtdWx0aXBsZSB2YWx1ZSksIHdoZW4gYXJndW1lbnQgaXMgXCJsaWJcIiwgYnkgZGVmYXVsdCB3ZSB3aWxsIHNldCBcImV4dGVybmFsXCIgcHJvcGVydHkgb2YgV2VicGFjayBjb25maWd1cmF0aW9uIGZvciAnICtcbiAgLy8gICAnYWxsIHJlcXVlc3QgdGhhdCBkb2VzIG5vdCBiZWdpbiB3aXRoIFwiLlwiIChub3QgcmVsYXRpdmUgcGF0aCkgb3IgY29udGFpbnMgXCI/IVwiIGNoYXJhY3RlciwnICtcbiAgLy8gICAnIG1lYW5pbmcgYWxsIG5vbi1yZWxhdGl2ZSBtb2R1bGVzIHdpbGwgbm90IGJlIGluY2x1ZGVkIGluIHRoZSBvdXRwdXQgYnVuZGxlIGZpbGUuICcgK1xuICAvLyAgICdUbyBjaGFuZ2UgdGhpcyBiZWhhdmlvciwgeW91IGNhbiBleHBsaWNpdGx5IHByb3ZpZGUgYSBsaXN0IG9mIFwiZXh0ZXJuYWxcIiBtb2R1bGUgbmFtZSB3aXRoIHRoaXMgb3B0aW9uLCBpbiBmb3JtIG9mIHJlZ3VsYXIgZXhwcmVzc2lvbiwgJyArXG4gIC8vICAgJyhlLmcuIC1lIFwiXnJlYWN0KC98JClcIiAtZSBcIl5yZWFjdC1kb20oL3wkKVwiKSwgIHRvIG1ha2Ugbm90aGluZyBcImV4dGVybmFsXCI6IC1lIFwiXiRcIiAoYW55IFJlZ0V4cCB0aGF0IG5ldmVyIG1hdGNoZXMpJywgKHZhbHVlLCBwcmV2KSA9PiB7IHByZXYucHVzaCh2YWx1ZSk7IHJldHVybiBwcmV2O30sIFtdIGFzIHN0cmluZ1tdKVxuICAub3B0aW9uKCctaSwgLS1pbmNsdWRlIDxtb2R1bGUtcGF0aC1yZWdleD4nLFxuICAnKG11bHRpcGxlIHZhbHVlKSwgd2hlbiBhcmd1bWVudCBpcyBcImxpYlwiLCB3ZSB3aWxsIHNldCBcImV4dGVybmFsXCIgcHJvcGVydHkgb2YgV2VicGFjayBjb25maWd1cmF0aW9uIGZvciBhbGwgcmVxdWVzdCBub3QgYmVnaW4gd2l0aCBcIi5cIiAobm90IHJlbGF0aXZlIHBhdGgpLCAnICtcbiAgJ21lYW5pbmcgYWxsIG5vbi1yZWxhdGl2ZSBtb2R1bGVzIHdpbGwgbm90IGJlIGluY2x1ZGVkIGluIHRoZSBvdXRwdXQgYnVuZGxlIGZpbGUsIHlvdSBuZWVkIHRvIGV4cGxpY2l0bHkgcHJvdmlkZSBhIGxpc3QgaW4nICtcbiAgJyBSZWd1bGFyIGV4cHJlc3Npb24gKGUuZy4gLWkgXFwnXnNvbWVMaWIoL3wkKVxcJyAtaSBcXCdec29tZUxpYjIoL3wkKVxcJyAtaSAuLi4pICcgK1xuICAnIHRvIG1ha2UgdGhlbSBiZSBpbmNsdWRlZCBpbiBidW5kbGUgZmlsZS4gVG8gbWFrZSBzcGVjaWZpYyBtb2R1bGUgKFJlYWN0KSBleHRlcm5hbDogLWkgXFwnXig/IXJlYWN0KC1kb20pPygkfC8pKVxcJycsIGFycmF5T3B0aW9uRm4sIFtdKVxuICAub3B0aW9uKCctLXNvdXJjZS1tYXAnLCAnc2V0IGVudmlyb25tZW50IHZhcmlhYmxlIEdFTkVSQVRFX1NPVVJDRU1BUCB0byBcInRydWVcIiAoc2VlIGh0dHBzOi8vY3JlYXRlLXJlYWN0LWFwcC5kZXYvZG9jcy9hZHZhbmNlZC1jb25maWd1cmF0aW9uJywgZmFsc2UpXG4gIC5hY3Rpb24oKHR5cGUsIHBrZ05hbWUpID0+IHtcbiAgICBpbml0RXZlcnl0aGluZyhidWlsZENtZCwgdHlwZSwgcGtnTmFtZSk7XG4gICAgaWYgKGJ1aWxkQ21kLm9wdHMoKS5zb3VyY2VNYXApIHtcbiAgICAgIHBsaW5rLmxvZ2dlci5pbmZvKCdzb3VyY2UgbWFwIGlzIGVuYWJsZWQnKTtcbiAgICAgIHByb2Nlc3MuZW52LkdFTkVSQVRFX1NPVVJDRU1BUCA9ICd0cnVlJztcbiAgICB9XG4gICAgcmVxdWlyZSgncmVhY3Qtc2NyaXB0cy9zY3JpcHRzL2J1aWxkJyk7XG4gIH0pO1xuICB3aXRoQ2xpY09wdChidWlsZENtZCk7XG5cbiAgcHJvZ3JhbS5jb21tYW5kKCdjcmEtYnVpbGQtdHNkIDxwYWNrYWdlLW5hbWU+JylcbiAgICAuZGVzY3JpcHRpb24oJ0NvbXBpbGUgcGFja2FnZXMgZm9yIG9ubHkgZ2VuZXJhdGluZyBUeXBlc2NyaXB0IGRlZmluaXRpb24gZmlsZXMuIElmIHlvdSBhcmUgY3JlYXRpbmcgYSBsaWJyYXJ5LCAnICtcbiAgICAgICdjb21tYW5kIFwiY3JhLWJ1aWxkXCIgd2lsbCBhbHNvIGdlbmVyYXRlIHRzZCBmaWxlIGFsb25nIHdpdGggY2xpZW50IGJ1bmRsZScsIHtcbiAgICAgICAgJ3BhY2thZ2UtbmFtZSc6ICd0YXJnZXQgcGFja2FnZSBuYW1lLCB0aGUgXCJzY29wZVwiIG5hbWUgcGFydCBjYW4gYmUgb21pdHRlZCdcbiAgICAgIH0pXG4gICAgLmFjdGlvbihhc3luYyBwa2dOYW1lID0+IHtcbiAgICAgIGluaXRFdmVyeXRoaW5nKFN0YXJ0Q21kLCAnbGliJywgcGtnTmFtZSk7XG4gICAgICBhd2FpdCAoYXdhaXQgaW1wb3J0KCcuLi90c2QtZ2VuZXJhdGUnKSkuYnVpbGRUc2QoW3BrZ05hbWVdKTtcbiAgICB9KTtcblxuXG4gIGNvbnN0IFN0YXJ0Q21kID0gcHJvZ3JhbS5jb21tYW5kKCdjcmEtc3RhcnQgPHBhY2thZ2UtbmFtZT4nKVxuICAuZGVzY3JpcHRpb24oJ1J1biBDUkEgc3RhcnQgc2NyaXB0IGZvciByZWFjdCBhcHBsaWNhdGlvbiBvciBsaWJyYXJ5ICh3b3JrIHdpdGggY3JlYXRlLXJlYWN0LWFwcCB2NC4wLjMpJywge1xuICAgICdwYWNrYWdlLW5hbWUnOiAndGFyZ2V0IHBhY2thZ2UgbmFtZSwgdGhlIFwic2NvcGVcIiBuYW1lIHBhcnQgY2FuIGJlIG9taXR0ZWQnXG4gIH0pXG4gIC5hY3Rpb24oYXN5bmMgKHBrZ05hbWUpID0+IHtcbiAgICBpbml0RXZlcnl0aGluZyhTdGFydENtZCwgJ2FwcCcsIHBrZ05hbWUpO1xuICAgIHJlcXVpcmUoJ3JlYWN0LXNjcmlwdHMvc2NyaXB0cy9zdGFydCcpO1xuICB9KTtcbiAgd2l0aENsaWNPcHQoU3RhcnRDbWQpO1xuXG4gIHByb2dyYW0uY29tbWFuZCgnY3JhLW9wZW4gPHVybD4nKVxuICAgIC5kZXNjcmlwdGlvbignUnVuIHJlYWN0LWRldi11dGlscy9vcGVuQnJvd3NlcicsIHt1cmw6ICdVUkwnfSlcbiAgICAuYWN0aW9uKGFzeW5jIHVybCA9PiB7XG4gICAgICAoYXdhaXQgaW1wb3J0KCcuLi9jcmEtb3Blbi1icm93c2VyJykpLmRlZmF1bHQodXJsKTtcbiAgICB9KTtcblxuICAvLyBjb25zdCBpbml0Q21kID0gcHJvZ3JhbS5jb21tYW5kKCdjcmEtaW5pdCcpXG4gIC8vIC5kZXNjcmlwdGlvbignSW5pdGlhbCB3b3Jrc3BhY2UgZmlsZXMgYmFzZWQgb24gZmlsZXMgd2hpY2ggYXJlIG5ld2x5IGdlbmVyYXRlZCBieSBjcmVhdGUtcmVhY3QtYXBwJylcbiAgLy8gLmFjdGlvbihhc3luYyAoKSA9PiB7XG4gIC8vICAgY29uc3Qgb3B0OiBHbG9iYWxPcHRpb25zID0ge3Byb3A6IFtdLCBjb25maWc6IFtdfTtcbiAgLy8gICBhd2FpdCBpbml0Q29uZmlnQXN5bmMob3B0KTtcbiAgLy8gICAvLyBhd2FpdCBpbml0VHNjb25maWcoKTtcbiAgLy8gfSk7XG4gIC8vIC8vIHdpdGhHbG9iYWxPcHRpb25zKGluaXRDbWQpO1xuXG4gIHByb2dyYW0uY29tbWFuZCgnY3JhLWFuYWx5emUgW2pzLWRpcl0nKVxuICAuYWxpYXMoJ2NyYS1hbmFseXNlJylcbiAgLmRlc2NyaXB0aW9uKCdSdW4gc291cmNlLW1hcC1leHBsb3JlcicsIHtcbiAgICAnanMtZGlyJzogJ05vcm1hbGx5IHRoaXMgcGF0aCBzaG91bGQgYmUgPHJvb3QtZGlyPmRpc3Qvc3RhdGljLzxvdXRwdXQtcGF0aC1iYXNlbmFtZT4vc3RhdGljL2pzJ1xuICB9KVxuICAuYWN0aW9uKGFzeW5jIChvdXRwdXRQYXRoOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBzbWVQa2dEaXIgPSBQYXRoLmRpcm5hbWUocmVxdWlyZS5yZXNvbHZlKCdzb3VyY2UtbWFwLWV4cGxvcmVyL3BhY2thZ2UuanNvbicpKTtcbiAgICBjb25zdCBzbWVCaW46IHN0cmluZyA9IHJlcXVpcmUoUGF0aC5yZXNvbHZlKHNtZVBrZ0RpciwgJ3BhY2thZ2UuanNvbicpKS5iaW5bJ3NvdXJjZS1tYXAtZXhwbG9yZXInXTtcblxuICAgIGF3YWl0IG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlaikgPT4ge1xuICAgICAgY29uc3QgY3AgPSBmb3JrKFBhdGgucmVzb2x2ZShzbWVQa2dEaXIsIHNtZUJpbiksIFtcbiAgICAgICAgJy0tZ3ppcCcsICctLW5vLXJvb3QnLFxuICAgICAgICBQYXRoLnJlc29sdmUob3V0cHV0UGF0aCA/IG91dHB1dFBhdGggOiAnJywgJyouanMnKVxuICAgICAgXSwge3N0ZGlvOiBbJ2luaGVyaXQnLCAnaW5oZXJpdCcsICdpbmhlcml0JywgJ2lwYyddfSk7XG4gICAgICBjcC5vbignZXJyb3InLCBlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIHJlaihlcnIpO1xuICAgICAgfSk7XG4gICAgICBjcC5vbignZXhpdCcsIChzaWduLCBjb2RlKSA9PiB7cmVzb2x2ZShjb2RlKTsgfSk7XG4gICAgfSk7XG4gIH0pO1xuICAvLyBzbWVDbWQudXNhZ2Uoc21lQ21kLnVzYWdlKCkgKyAnXFxuICBhcHAtYmFzZS1wYXRoOiAnKVxufTtcblxuZnVuY3Rpb24gd2l0aENsaWNPcHQoY21kOiBjb21tYW5kZXIuQ29tbWFuZCkge1xuICBjbWQub3B0aW9uKCctLXB1cmwsIC0tcHVibGljVXJsIDxzdHJpbmc+JywgJ3NldCBlbnZpcm9ubWVudCB2YXJpYWJsZSBQVUJMSUNfVVJMIGZvciByZWFjdC1zY3JpcHRzJywgdW5kZWZpbmVkKTtcbn1cblxuZnVuY3Rpb24gYXJyYXlPcHRpb25GbihjdXJyOiBzdHJpbmcsIHByZXY6IHN0cmluZ1tdIHwgdW5kZWZpbmVkKSB7XG4gIGlmIChwcmV2KVxuICAgIHByZXYucHVzaChjdXJyKTtcbiAgcmV0dXJuIHByZXY7XG59XG5cbmZ1bmN0aW9uIGluaXRFdmVyeXRoaW5nKGJ1aWxkQ21kOiBjb21tYW5kZXIuQ29tbWFuZCwgdHlwZTogJ2FwcCcgfCAnbGliJywgcGtnTmFtZTogc3RyaW5nKSB7XG4gIC8vIGNvbnN0IGNmZyA9IGF3YWl0IGluaXRDb25maWdBc3luYyhidWlsZENtZC5vcHRzKCkgYXMgR2xvYmFsT3B0aW9ucyk7XG4gIGNvbnN0IGNmZyA9IGNvbmZpZztcbiAgLy8gYXdhaXQgaW5pdFRzY29uZmlnKCk7XG4gIHNhdmVDbWRPcHRpb25zVG9FbnYocGtnTmFtZSwgYnVpbGRDbWQsIHR5cGUpO1xuICBpZiAocHJvY2Vzcy5lbnYuUE9SVCA9PSBudWxsICYmIGNmZygpLnBvcnQpXG4gICAgcHJvY2Vzcy5lbnYuUE9SVCA9IGNmZygpLnBvcnQgKyAnJztcbiAgLy8gYXdhaXQgd2Fsa1BhY2thZ2VzQW5kU2V0dXBJbmplY3Rvcihwcm9jZXNzLmVudi5QVUJMSUNfVVJMIHx8ICcvJyk7XG4gIGlmICghWydhcHAnLCAnbGliJ10uaW5jbHVkZXModHlwZSkpIHtcblxuICAgIHBsaW5rLmxvZ2dlci5lcnJvcigndHlwZSBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiBcXCdhcHBcXCcsIFxcJ2xpYlxcJycpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBwcmVsb2FkID0gcmVxdWlyZSgnLi4vcHJlbG9hZCcpIGFzIHR5cGVvZiBfcHJlbG9hZDtcbiAgcHJlbG9hZC5wb28oKTtcbn1cblxuZXhwb3J0IHtjbGkgYXMgZGVmYXVsdH07XG5cbiJdfQ==