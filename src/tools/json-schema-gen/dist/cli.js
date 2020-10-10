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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
// import {program} from 'commander';
const package_json_1 = __importDefault(require("../package.json"));
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs-extra"));
const misc_1 = require("@wfh/plink/wfh/dist/utils/misc");
const log4js_1 = __importDefault(require("log4js"));
const TJS = __importStar(require("typescript-json-schema"));
const ts_ast_query_1 = __importDefault(require("@wfh/prebuild/dist/ts-ast-query"));
const glob_1 = __importDefault(require("glob"));
const dist_1 = require("@wfh/plink/wfh/dist");
const baseTsconfig = require('@wfh/plink/wfh/tsconfig-base.json');
const log = log4js_1.default.getLogger(package_json_1.default.name);
const cliExt = (program, withGlobalOptions) => {
    const cmd = program.command('json-schema-gen [package...]')
        .description('Scan packages and generate json schema. ' +
        'You package.json file must contains:\n  "dr": {jsonSchema: "<interface files whose path is relative to package directory>"}')
        .option('-f, --file <spec>', 'run single file')
        .action((packages) => __awaiter(void 0, void 0, void 0, function* () {
        yield dist_1.initConfigAsync(cmd.opts());
        const dones = [];
        const packageUtils = require('@wfh/plink/wfh/dist/package-utils');
        const onComponent = (name, entryPath, parsedName, json, packagePath) => {
            dones.push(new Promise((resolve, reject) => {
                const dirs = misc_1.getTsDirsOfPackage(json);
                if (json.dr && json.dr.jsonSchema) {
                    const schemaSrcDir = json.dr.jsonSchema;
                    log.info(`package ${name} has JSON schema: ${schemaSrcDir}`);
                    // packagePath = fs.realpathSync(packagePath);
                    glob_1.default(schemaSrcDir, { cwd: packagePath }, (err, matches) => {
                        log.info('Found schema source', matches);
                        const compilerOptions = Object.assign(Object.assign({}, baseTsconfig.compilerOptions), { rootDir: packagePath });
                        const tjsPgm = TJS.getProgramFromFiles(matches.map(path => path_1.default.resolve(packagePath, path)), compilerOptions, packagePath);
                        const generator = TJS.buildGenerator(tjsPgm, {});
                        const symbols = [];
                        for (const filename of matches) {
                            const tsFile = path_1.default.resolve(packagePath, filename);
                            const astQuery = new ts_ast_query_1.default(fs.readFileSync(tsFile, 'utf8'), tsFile);
                            symbols.push(...astQuery.findAll(':SourceFile>.statements:InterfaceDeclaration>.name:Identifier').map(ast => ast.getText()));
                        }
                        if (generator) {
                            const output = {};
                            for (const syb of symbols) {
                                log.info('Schema for ', syb);
                                output[syb] = generator.getSchemaForSymbol(syb);
                            }
                            const outFile = path_1.default.resolve(packagePath, dirs.isomDir, 'json-schema.json');
                            fs.mkdirpSync(path_1.default.resolve(packagePath, dirs.isomDir));
                            fs.writeFile(outFile, JSON.stringify(output, null, '  '), (err) => {
                                if (err)
                                    return reject(err);
                                log.info(' written to ' + outFile);
                                resolve();
                            });
                        }
                    });
                }
            }));
        };
        if (packages && packages.length > 0) {
            packageUtils.lookForPackages(packages, onComponent);
            packageUtils.findAllPackages(packages, onComponent, 'src');
        }
        else
            packageUtils.findAllPackages(onComponent, 'src');
        yield Promise.all(dones);
    }));
    withGlobalOptions(cmd);
};
exports.default = cliExt;

//# sourceMappingURL=cli.js.map
