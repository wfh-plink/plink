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
// tslint:disable: no-console
const config_1 = __importDefault(require("../config"));
const log_config_1 = __importDefault(require("../log-config"));
const pkMgr = __importStar(require("../package-mgr"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const _ = __importStar(require("lodash"));
const cli_init_1 = require("./cli-init");
function list(opt) {
    return __awaiter(this, void 0, void 0, function* () {
        yield config_1.default.init(opt);
        log_config_1.default(config_1.default());
        const pmgr = require('../package-mgr');
        const pkRunner = require('../../lib/packageMgr/packageRunner');
        console.log('==============[ LINKED PACKAGES IN PROJECT ]==============\n');
        if (opt.json)
            console.log(JSON.stringify(jsonOfLinkedPackageForProjects(), null, '  '));
        else
            console.log(pmgr.listPackagesByProjects());
        console.log('\n' + chalk_1.default.green(_.pad('[ SERVER COMPONENTS ]', 50, '=')) + '\n');
        const list = yield pkRunner.listServerComponents();
        list.forEach(row => console.log(' ' + row.desc + '   ' + chalk_1.default.blue(path_1.default.relative(config_1.default().rootPath, row.pk.path))));
        cli_init_1.printWorkspaces();
    });
}
exports.default = list;
function jsonOfLinkedPackageForProjects() {
    var _a;
    const all = {};
    const linkedPkgs = pkMgr.getState().srcPackages;
    for (const [prj, pkgNames] of pkMgr.getState().project2Packages.entries()) {
        const dep = all[prj] = {};
        for (const pkName of pkgNames) {
            dep[pkName] = (_a = linkedPkgs.get(pkName)) === null || _a === void 0 ? void 0 : _a.json.version;
        }
    }
    return all;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdHMvY21kL2NsaS1scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw2QkFBNkI7QUFDN0IsdURBQStCO0FBQy9CLCtEQUFzQztBQUV0QyxzREFBd0M7QUFDeEMsa0RBQTBCO0FBQzFCLGdEQUF3QjtBQUN4QiwwQ0FBNEI7QUFFNUIseUNBQTJDO0FBTTNDLFNBQThCLElBQUksQ0FBQyxHQUFvQzs7UUFDckUsTUFBTSxnQkFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QixvQkFBUyxDQUFDLGdCQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sSUFBSSxHQUFpQixPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUVyRCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsb0NBQW9DLENBQUMsQ0FBQztRQUUvRCxPQUFPLENBQUMsR0FBRyxDQUFDLDhEQUE4RCxDQUFDLENBQUM7UUFDNUUsSUFBSSxHQUFHLENBQUMsSUFBSTtZQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyw4QkFBOEIsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDOztZQUUxRSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLENBQUM7UUFFN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsZUFBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1FBRWhGLE1BQU0sSUFBSSxHQUF3QixNQUFNLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQ3hFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxHQUFHLEtBQUssR0FBRyxlQUFLLENBQUMsSUFBSSxDQUFDLGNBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXJILDBCQUFlLEVBQUUsQ0FBQztJQUNwQixDQUFDO0NBQUE7QUFuQkQsdUJBbUJDO0FBRUQsU0FBUyw4QkFBOEI7O0lBQ3JDLE1BQU0sR0FBRyxHQUE2QyxFQUFFLENBQUM7SUFDekQsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLFdBQVcsQ0FBQztJQUNoRCxLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxFQUFFO1FBQ3pFLE1BQU0sR0FBRyxHQUE0QixHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ25ELEtBQUssTUFBTSxNQUFNLElBQUksUUFBUSxFQUFFO1lBQzdCLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQywwQ0FBRSxJQUFJLENBQUMsT0FBTyxDQUFDO1NBQ3BEO0tBQ0Y7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0c2xpbnQ6ZGlzYWJsZTogbm8tY29uc29sZVxuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IGxvZ0NvbmZpZyBmcm9tICcuLi9sb2ctY29uZmlnJztcbmltcG9ydCB7R2xvYmFsT3B0aW9uc30gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgKiBhcyBwa01nciBmcm9tICcuLi9wYWNrYWdlLW1ncic7XG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgTm9kZVBhY2thZ2UgZnJvbSAnLi4vcGFja2FnZU5vZGVJbnN0YW5jZSc7XG5pbXBvcnQge3ByaW50V29ya3NwYWNlc30gZnJvbSAnLi9jbGktaW5pdCc7XG5cbmludGVyZmFjZSBDb21wb25lbnRMaXN0SXRlbSB7XG4gIHBrOiBOb2RlUGFja2FnZTtcbiAgZGVzYzogc3RyaW5nO1xufVxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gbGlzdChvcHQ6IEdsb2JhbE9wdGlvbnMgJiB7anNvbjogYm9vbGVhbn0pIHtcbiAgYXdhaXQgY29uZmlnLmluaXQob3B0KTtcbiAgbG9nQ29uZmlnKGNvbmZpZygpKTtcbiAgY29uc3QgcG1ncjogdHlwZW9mIHBrTWdyID0gcmVxdWlyZSgnLi4vcGFja2FnZS1tZ3InKTtcblxuICBjb25zdCBwa1J1bm5lciA9IHJlcXVpcmUoJy4uLy4uL2xpYi9wYWNrYWdlTWdyL3BhY2thZ2VSdW5uZXInKTtcblxuICBjb25zb2xlLmxvZygnPT09PT09PT09PT09PT1bIExJTktFRCBQQUNLQUdFUyBJTiBQUk9KRUNUIF09PT09PT09PT09PT09PVxcbicpO1xuICBpZiAob3B0Lmpzb24pXG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoanNvbk9mTGlua2VkUGFja2FnZUZvclByb2plY3RzKCksIG51bGwsICcgICcpKTtcbiAgZWxzZVxuICAgIGNvbnNvbGUubG9nKHBtZ3IubGlzdFBhY2thZ2VzQnlQcm9qZWN0cygpKTtcblxuICBjb25zb2xlLmxvZygnXFxuJyArIGNoYWxrLmdyZWVuKF8ucGFkKCdbIFNFUlZFUiBDT01QT05FTlRTIF0nLCA1MCwgJz0nKSkgKyAnXFxuJyk7XG5cbiAgY29uc3QgbGlzdDogQ29tcG9uZW50TGlzdEl0ZW1bXSA9IGF3YWl0IHBrUnVubmVyLmxpc3RTZXJ2ZXJDb21wb25lbnRzKCk7XG4gIGxpc3QuZm9yRWFjaChyb3cgPT4gY29uc29sZS5sb2coJyAnICsgcm93LmRlc2MgKyAnICAgJyArIGNoYWxrLmJsdWUoUGF0aC5yZWxhdGl2ZShjb25maWcoKS5yb290UGF0aCwgcm93LnBrLnBhdGgpKSkpO1xuXG4gIHByaW50V29ya3NwYWNlcygpO1xufVxuXG5mdW5jdGlvbiBqc29uT2ZMaW5rZWRQYWNrYWdlRm9yUHJvamVjdHMoKSB7XG4gIGNvbnN0IGFsbDoge1twcmo6IHN0cmluZ106IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9fSA9IHt9O1xuICBjb25zdCBsaW5rZWRQa2dzID0gcGtNZ3IuZ2V0U3RhdGUoKS5zcmNQYWNrYWdlcztcbiAgZm9yIChjb25zdCBbcHJqLCBwa2dOYW1lc10gb2YgcGtNZ3IuZ2V0U3RhdGUoKS5wcm9qZWN0MlBhY2thZ2VzLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IGRlcDoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSBhbGxbcHJqXSA9IHt9O1xuICAgIGZvciAoY29uc3QgcGtOYW1lIG9mIHBrZ05hbWVzKSB7XG4gICAgICBkZXBbcGtOYW1lXSA9IGxpbmtlZFBrZ3MuZ2V0KHBrTmFtZSk/Lmpzb24udmVyc2lvbjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFsbDtcbn1cbiJdfQ==