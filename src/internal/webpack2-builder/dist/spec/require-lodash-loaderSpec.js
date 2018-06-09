"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:quotemark */
const loader = require("../lib/require-lodash-loader");
const log4js = require("log4js");
const { doEs, TSParser } = loader;
const log = log4js.getLogger('require-lodash-loaderSpec');
describe('require-lodash-loader', () => {
    let testCode = `var _ = require('lodash');
		function def() {
			something(_.isString(''));
			_.debounce(() => {});
		}
	`;
    it('should replace "require(\'lodash\')" in ES file', () => {
        var result = doEs(testCode, 'test.js');
        log.info(result[0]);
        expect(result[0]).toContain("var _ = {isString: require('lodash/isString'), debounce: require('lodash/debounce')}");
    });
    it('should replace "require(\'lodash\')" in TS file', () => {
        var result = new TSParser().doTs(testCode, 'test.ts');
        log.debug(result);
        expect(result).toContain("var _: any = {isString: require('lodash/isString'), debounce: require('lodash/debounce')}");
    });
    it('should remove orphan require statement', () => {
        let testCode = `require('lodash');
		something();
		`;
        var result = doEs(testCode, 'test.js');
        log.debug(result[0]);
        expect(result).not.toContain('require(\'lodash\')');
    });
});

//# sourceMappingURL=require-lodash-loaderSpec.js.map