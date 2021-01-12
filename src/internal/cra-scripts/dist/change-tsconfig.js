"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeTsConfigFile = void 0;
const config_handler_1 = require("@wfh/plink/wfh/dist/config-handler");
const misc_1 = require("@wfh/plink/wfh/dist/utils/misc");
const package_mgr_1 = require("@wfh/plink/wfh/dist/package-mgr");
const dist_1 = require("@wfh/plink/wfh/dist");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function changeTsConfigFile() {
    // const craOptions = getCmdOptions();
    const plinkRoot = dist_1.getRootDir();
    const rootDir = misc_1.closestCommonParentDir(Array.from(package_mgr_1.getState().project2Packages.keys()).map(prjDir => path_1.default.resolve(plinkRoot, prjDir))).replace(/\\/g, '/');
    const tsconfigJson = JSON.parse(fs_1.default.readFileSync(process.env._plink_cra_scripts_tsConfig, 'utf8'));
    config_handler_1.setTsCompilerOptForNodePath(process.cwd(), './', tsconfigJson.compilerOptions, {
        workspaceDir: process.cwd()
    });
    tsconfigJson.include = [path_1.default.relative(process.cwd(), process.env._plink_cra_scripts_indexJs)];
    tsconfigJson.compilerOptions.rootDir = rootDir;
    // tslint:disable-next-line: no-console
    // console.log('tsconfigJson:', tsconfigJson);
    // fs.writeFileSync(Path.resolve('tsconfig.json'), JSON.stringify(tsconfigJson, null, '  '));
    return tsconfigJson;
}
exports.changeTsConfigFile = changeTsConfigFile;

//# sourceMappingURL=change-tsconfig.js.map