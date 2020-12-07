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
const dist_1 = require("@wfh/plink/wfh/dist");
const child_process_1 = require("child_process");
const initInjectors_1 = __importDefault(require("@wfh/webpack-common/dist/initInjectors"));
const log4js_1 = __importDefault(require("log4js"));
const cli_init_1 = require("./cli-init");
const cli_gen_slice_1 = __importDefault(require("./cli-gen-slice"));
// import {ObjectAst} from '@wfh/plink/wfh/dist/utils/json-sync-parser';
const log = log4js_1.default.getLogger('cra');
const cli = (program, withGlobalOptions) => {
    const genCmd = program.command('cra-gen <path>')
        .description('Generate a sample package')
        .option('-d, --dry-run', 'Do not generate files, just list new file names', false)
        .action((dir) => __awaiter(void 0, void 0, void 0, function* () {
        (yield Promise.resolve().then(() => __importStar(require('./cli-gen')))).genPackage(dir, genCmd.opts().dryRun);
    }));
    cli_gen_slice_1.default(program, withGlobalOptions);
    const buildCmd = program.command('cra-build <app|lib> <package-name>')
        .description('Compile react application or library, <package-name> is the target package name,\n' +
        'argument "app" for building a complete application like create-react-app,\n' +
        'argument "lib" for building a library')
        .option('-w, --watch', 'When build a library, watch file changes and compile', false)
        .option('--dev', 'set NODE_ENV to "development", enable react-scripts in dev mode', false)
        .option('-i, --include <module-path-regex>', '(multiple value), when argument is "lib", we will set external property of Webpack configuration for all request not begin with "." (except "@babel/runtimer"), ' +
        'meaning all external modules will not be included in the output bundle file, you need to explicitly provide a list in' +
        ' Regular expression (e.g. -i "^someLib/?" -i "^someLib2/?" -i ...) to make them be included in bundle file', arrayOptionFn, [])
        .option('--source-map', 'set environment variable GENERATE_SOURCEMAP to "true" (see https://create-react-app.dev/docs/advanced-configuration', false)
        .action((type, pkgName) => __awaiter(void 0, void 0, void 0, function* () {
        yield initEverything(buildCmd, type, pkgName);
        if (buildCmd.opts().sourceMap) {
            log.info('source map is enabled');
            process.env.GENERATE_SOURCEMAP = 'true';
        }
        require('react-scripts/scripts/build');
    }));
    withClicOpt(buildCmd);
    withGlobalOptions(buildCmd);
    const StartCmd = program.command('cra-start <package-name>')
        .description('Run CRA start script for react application or library, <package-name> is the target package name')
        .action((pkgName) => __awaiter(void 0, void 0, void 0, function* () {
        yield initEverything(StartCmd, 'app', pkgName);
        require('react-scripts/scripts/start');
    }));
    withClicOpt(StartCmd);
    withGlobalOptions(StartCmd);
    const initCmd = program.command('cra-init')
        .description('Initial workspace files based on files which are newly generated by create-react-app')
        .action(() => __awaiter(void 0, void 0, void 0, function* () {
        yield dist_1.initConfigAsync(initCmd.opts());
        yield cli_init_1.initTsconfig();
    }));
    withGlobalOptions(initCmd);
    const smeCmd = program.command('cra-analyze [app-base-path]')
        .description('Run source-map-explorer')
        .action((appPath) => __awaiter(void 0, void 0, void 0, function* () {
        const plinkCfg = yield dist_1.initConfigAsync(initCmd.opts());
        const smePkgDir = path_1.default.dirname(require.resolve('source-map-explorer/package.json'));
        const smeBin = require(path_1.default.resolve(smePkgDir, 'package.json')).bin['source-map-explorer'];
        child_process_1.fork(path_1.default.resolve(smePkgDir, smeBin), [
            '--gzip', '--no-root',
            plinkCfg.resolve('staticDir', appPath ? appPath : '', 'static/js/*.js')
        ], { stdio: 'inherit' });
    }));
    withGlobalOptions(smeCmd);
};
exports.default = cli;
function withClicOpt(cmd) {
    cmd
        // .option('--dev', 'set NODE_ENV to "development", enable react-scripts in dev mode', false)
        .option('--purl, --publicUrl <string>', 'set environment variable PUBLIC_URL for react-scripts', undefined);
}
function arrayOptionFn(curr, prev) {
    if (prev)
        prev.push(curr);
    return prev;
}
function initEverything(buildCmd, type, pkgName) {
    return __awaiter(this, void 0, void 0, function* () {
        dist_1.initProcess();
        yield dist_1.initConfigAsync(buildCmd.opts());
        yield cli_init_1.initTsconfig();
        utils_1.saveCmdOptionsToEnv(pkgName, buildCmd, type);
        yield initInjectors_1.default(process.env.PUBLIC_URL || '/');
        if (!['app', 'lib'].includes(type)) {
            log.error(`type argument must be one of "${['app', 'lib']}"`);
            return;
        }
        yield (yield Promise.resolve().then(() => __importStar(require('../preload')))).poo();
    });
}

//# sourceMappingURL=cli.js.map
