"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/* tslint:disable no-console */
const ts_before_aot_1 = tslib_1.__importDefault(require("../utils/ts-before-aot"));
const fs = tslib_1.__importStar(require("fs"));
const Path = tslib_1.__importStar(require("path"));
const log4js = require("log4js");
const log = log4js.getLogger('api-aotSpec');
const __api_1 = tslib_1.__importDefault(require("__api"));
describe('apiAotCompiler', () => {
    it('should recoganize identifier __api', () => {
        Object.assign(Object.getPrototypeOf(__api_1.default), {
            packageInfo: { allModules: [] },
            findPackageByFile(file) {
                return { longName: 'test' };
            },
            getNodeApiForPackage(pk) {
                return {
                    packageName: 'PACKAGE_NAME',
                    config: () => {
                        return { PACKAGE_NAME: 'CONFIG' };
                    },
                    assetsUrl() {
                        return 'ASSETS';
                    },
                    publicPath: 'PUBLIC_PATH'
                };
            }
        });
        const compiler = new ts_before_aot_1.default('test.ts', fs.readFileSync(Path.resolve(__dirname, '../../ts/spec/api-aot-sample.ts.txt'), 'utf8'));
        log.info(compiler.parse(source => {
            console.log(source);
            return source;
        }));
        log.info(compiler.replacements.map(({ text }) => text).join('\n'));
        expect(compiler.replacements.map(({ text }) => text)).toEqual([
            '"PACKAGE_NAME"',
            '"ASSETS"',
            '"ASSETS"',
            '"CONFIG"',
            '"PUBLIC_PATH"'
        ]);
    });
});

//# sourceMappingURL=api-aotSpec.js.map
