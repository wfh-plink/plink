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
exports.printWorkspaceHoistedDeps = exports.printWorkspaces = void 0;
// tslint:disable: no-console max-line-length
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const package_mgr_1 = require("../package-mgr");
require("../editor-helper");
const package_utils_1 = require("../package-utils");
// import { getRootDir } from '../utils/misc';
const cli_project_1 = require("./cli-project");
const lodash_1 = __importDefault(require("lodash"));
const misc_1 = require("../utils/misc");
function default_1(opt, workspace) {
    return __awaiter(this, void 0, void 0, function* () {
        const cwd = misc_1.plinkEnv.workDir;
        package_mgr_1.getStore().pipe(operators_1.distinctUntilChanged((s1, s2) => s1.packagesUpdateChecksum === s2.packagesUpdateChecksum), operators_1.skip(1), operators_1.map(s => s.srcPackages), operators_1.map(srcPackages => {
            const paks = Array.from(srcPackages.values());
            const table = misc_1.createCliTable({
                horizontalLines: false,
                colAligns: ['right', 'left']
            });
            table.push([{ colSpan: 3, content: 'Linked packages', hAlign: 'center' }]);
            table.push(['Package name', 'Version', 'Path'], ['------------', '-------', '----']);
            for (const pk of paks) {
                table.push([pk.name, pk.json.version, chalk_1.default.gray(path_1.default.relative(cwd, pk.realPath))]);
            }
            console.log(table.toString());
            printWorkspaces();
        })).subscribe();
        const existingWsKeys = package_mgr_1.getState().workspaces;
        // print newly added workspace hoisted dependency information
        package_mgr_1.getStore().pipe(operators_1.map(s => s.lastCreatedWorkspace), operators_1.distinctUntilChanged(), operators_1.scan((prev, curr) => {
            if (curr && !existingWsKeys.has(curr)) {
                printWorkspaceHoistedDeps(package_mgr_1.getState().workspaces.get(curr));
            }
            return curr;
        })).subscribe();
        // print existing workspace CHANGED hoisted dependency information
        rxjs_1.merge(...Array.from(package_mgr_1.getState().workspaces.keys()).map(wsKey => package_mgr_1.getStore().pipe(operators_1.map(s => s.workspaces), operators_1.distinctUntilChanged(), operators_1.map(s => s.get(wsKey)), operators_1.distinctUntilChanged((s1, s2) => s1.hoistInfo === s2.hoistInfo && s1.hoistPeerDepInfo === s2.hoistPeerDepInfo), operators_1.scan((wsOld, wsNew) => {
            // console.log('*****************', wsKey);
            printWorkspaceHoistedDeps(wsNew);
            return wsNew;
        })))).subscribe();
        if (workspace) {
            package_mgr_1.actionDispatcher.updateWorkspace({ dir: workspace, isForce: opt.force, createHook: opt.lintHook });
        }
        else {
            package_mgr_1.actionDispatcher.initRootDir({ isForce: opt.force, createHook: opt.lintHook });
            setImmediate(() => cli_project_1.listProject());
        }
        // setImmediate(() => printWorkspaces());
    });
}
exports.default = default_1;
function printWorkspaces() {
    const table = misc_1.createCliTable({
        horizontalLines: false,
        colAligns: ['right', 'right']
    });
    const sep = ['--------------', '------------------', '------------', '----------', '-----'].map(item => chalk_1.default.gray(item));
    table.push([{ colSpan: 5, content: chalk_1.default.underline('Worktree Space and linked dependencies\n'), hAlign: 'center' }], ['WORKTREE SPACE', 'DEPENDENCY PACKAGE', 'EXPECTED VERSION', 'ACTUAL VERSION', 'STATE'].map(item => chalk_1.default.gray(item)), sep);
    let wsIdx = 0;
    for (const reldir of package_mgr_1.getState().workspaces.keys()) {
        if (wsIdx > 0) {
            table.push(sep);
        }
        let i = 0;
        const pkJson = package_mgr_1.getState().workspaces.get(reldir).originInstallJson;
        // console.log(pkJson);
        let workspaceLabel = reldir ? `  ${reldir}` : '  (root directory)';
        if (package_mgr_1.getState().currWorkspace === reldir) {
            workspaceLabel = chalk_1.default.inverse(workspaceLabel);
        }
        else {
            workspaceLabel = chalk_1.default.gray(workspaceLabel);
        }
        for (const { name: dep, json: { version: ver }, isInstalled } of package_utils_1.packages4WorkspaceKey(reldir)) {
            const expectedVer = convertVersion(pkJson, dep);
            const same = expectedVer === ver;
            table.push([
                i === 0 ? workspaceLabel : '',
                same ? dep : chalk_1.default.red(dep),
                same ? expectedVer : chalk_1.default.bgRed(expectedVer),
                ver,
                isInstalled ? '' : chalk_1.default.gray('linked')
            ]);
            i++;
        }
        wsIdx++;
    }
    console.log(table.toString());
}
exports.printWorkspaces = printWorkspaces;
function convertVersion(pkgJson, depName) {
    let ver = pkgJson.dependencies ? pkgJson.dependencies[depName] : null;
    if (ver == null && pkgJson.devDependencies) {
        ver = pkgJson.devDependencies[depName];
    }
    if (ver == null) {
        return '';
    }
    if (ver.startsWith('.') || ver.startsWith('file:')) {
        const m = /\-(\d+(?:\.\d+){1,2}(?:\-[^\-]+)?)\.tgz$/.exec(ver);
        if (m) {
            return m[1];
        }
    }
    return ver;
}
function printWorkspaceHoistedDeps(workspace) {
    console.log(chalk_1.default.bold(`\nHoisted Transitive Dependency & Dependents (${workspace.id || '<root directory>'})`));
    const table = createTable();
    table.push(['DEPENDENCY', 'DEPENDENT'].map(item => chalk_1.default.gray(item)), ['---', '---'].map(item => chalk_1.default.gray(item)));
    for (const [dep, dependents] of workspace.hoistInfo.entries()) {
        table.push(renderHoistDepInfo(dep, dependents));
    }
    console.log(table.toString());
    if (workspace.hoistDevInfo.size > 0) {
        const table = createTable();
        table.push(['DEPENDENCY', 'DEPENDENT'].map(item => chalk_1.default.gray(item)), ['---', '---'].map(item => chalk_1.default.gray(item)));
        console.log(chalk_1.default.bold(`\nHoisted Transitive (dev) Dependency & Dependents (${workspace.id || '<root directory>'})`));
        for (const [dep, dependents] of workspace.hoistDevInfo.entries()) {
            table.push(renderHoistDepInfo(dep, dependents));
        }
        console.log(table.toString());
    }
    if (workspace.hoistPeerDepInfo.size > 0) {
        console.log(chalk_1.default.bold(`Hoisted Transitive Peer Dependencies (${workspace.id || '<root directory>'})`));
        const table = createTable();
        table.push(['DEPENDENCY', 'DEPENDENT'].map(item => chalk_1.default.gray(item)), ['---', '---'].map(item => chalk_1.default.gray(item)));
        for (const [dep, dependents] of workspace.hoistPeerDepInfo.entries()) {
            table.push(renderHoistPeerDepInfo(dep, dependents));
        }
        console.log(table.toString());
    }
    if (workspace.hoistDevPeerDepInfo.size > 0) {
        console.log(chalk_1.default.yellowBright(`\nHoisted Transitive Peer Dependencies (dev) (${workspace.id || '<root directory>'})`));
        const table = createTable();
        table.push(['DEPENDENCY', 'DEPENDENT'].map(item => chalk_1.default.gray(item)), ['---', '---'].map(item => chalk_1.default.gray(item)));
        for (const [dep, dependents] of workspace.hoistDevPeerDepInfo.entries()) {
            table.push(renderHoistPeerDepInfo(dep, dependents));
        }
        console.log(table.toString());
    }
    printColorExplaination(workspace);
}
exports.printWorkspaceHoistedDeps = printWorkspaceHoistedDeps;
function createTable() {
    const table = misc_1.createCliTable({
        horizontalLines: false,
        // style: {head: []},
        colAligns: ['right', 'left']
    });
    return table;
}
function renderHoistDepInfo(dep, dependents) {
    return [
        dependents.sameVer ? dep : dependents.direct ? chalk_1.default.yellow(dep) : chalk_1.default.bgRed(dep),
        dependents.by.map((item, idx) => `${dependents.direct && idx === 0 ? chalk_1.default.green(item.ver) : idx > 0 ? chalk_1.default.gray(item.ver) : chalk_1.default.cyan(item.ver)}: ${chalk_1.default.grey(item.name)}`).join('\n')
    ];
}
function renderHoistPeerDepInfo(dep, dependents) {
    return [
        dependents.missing ? chalk_1.default.bgYellow(dep) : (dependents.duplicatePeer ? dep : chalk_1.default.green(dep)),
        dependents.by.map((item, idx) => `${dependents.direct && idx === 0 ? chalk_1.default.green(item.ver) : idx > 0 ? item.ver : chalk_1.default.cyan(item.ver)}: ${chalk_1.default.grey(item.name)}`).join('\n')
    ];
}
function printColorExplaination(workspace) {
    const summary = workspace.hoistInfoSummary;
    if (summary == null)
        return;
    if (summary.conflictDeps.length > 0) {
        console.log(`Above listed transitive dependencies: "${chalk_1.default.red(summary.conflictDeps.join(', '))}" have ` +
            'conflict dependency version, resolve them by choosing a version and add them to worktree space.\n');
    }
    if (lodash_1.default.size(summary.missingDeps) > 0) {
        console.log(`Above listed transitive peer dependencies in ${chalk_1.default.bgYellow('yellow')} should be added to worktree space as "dependencies":\n` +
            chalk_1.default.yellow(JSON.stringify(summary.missingDeps, null, '  ').replace(/^([^])/mg, (m, p1) => '  ' + p1) + '\n'));
    }
    if (lodash_1.default.size(summary.missingDevDeps) > 0) {
        console.log('Above listed transitive peer dependencies might should be added to worktree space as "devDependencies":\n' +
            chalk_1.default.yellow(JSON.stringify(summary.missingDevDeps, null, '  ').replace(/^([^])/mg, (m, p1) => '  ' + p1)) + '\n');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLWluaXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9jbWQvY2xpLWluaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsNkNBQTZDO0FBQzdDLGtEQUEwQjtBQUMxQixnREFBd0I7QUFDeEIsK0JBQTJCO0FBQzNCLDhDQUF1RTtBQUN2RSxnREFBZ0c7QUFDaEcsNEJBQTBCO0FBQzFCLG9EQUF5RDtBQUN6RCw4Q0FBOEM7QUFDOUMsK0NBQTRDO0FBQzVDLG9EQUF1QjtBQUV2Qix3Q0FBdUQ7QUFFdkQsbUJBQThCLEdBQTJCLEVBQUUsU0FBa0I7O1FBQzNFLE1BQU0sR0FBRyxHQUFHLGVBQVEsQ0FBQyxPQUFPLENBQUM7UUFDN0Isc0JBQVEsRUFBRSxDQUFDLElBQUksQ0FDYixnQ0FBb0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxzQkFBc0IsS0FBSyxFQUFFLENBQUMsc0JBQXNCLENBQUMsRUFDekYsZ0JBQUksQ0FBQyxDQUFDLENBQUMsRUFDUCxlQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEVBQ3ZCLGVBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUNoQixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBRTlDLE1BQU0sS0FBSyxHQUFHLHFCQUFjLENBQUM7Z0JBQzNCLGVBQWUsRUFBRSxLQUFLO2dCQUN0QixTQUFTLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDO2FBQzdCLENBQUMsQ0FBQztZQUNILEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekUsS0FBSyxDQUFD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QUMsQ0FBQztLQUN0SDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0c2xpbnQ6ZGlzYWJsZTogbm8tY29uc29sZSBtYXgtbGluZS1sZW5ndGhcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7bWVyZ2V9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgZGlzdGluY3RVbnRpbENoYW5nZWQsIG1hcCwgc2tpcCwgc2NhbiB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IGFjdGlvbkRpc3BhdGNoZXIgYXMgYWN0aW9ucywgZ2V0U3RhdGUsIGdldFN0b3JlLCBXb3Jrc3BhY2VTdGF0ZX0gZnJvbSAnLi4vcGFja2FnZS1tZ3InO1xuaW1wb3J0ICcuLi9lZGl0b3ItaGVscGVyJztcbmltcG9ydCB7IHBhY2thZ2VzNFdvcmtzcGFjZUtleSB9IGZyb20gJy4uL3BhY2thZ2UtdXRpbHMnO1xuLy8gaW1wb3J0IHsgZ2V0Um9vdERpciB9IGZyb20gJy4uL3V0aWxzL21pc2MnO1xuaW1wb3J0IHsgbGlzdFByb2plY3QgfSBmcm9tICcuL2NsaS1wcm9qZWN0JztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBvcHRpb25zIGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtjcmVhdGVDbGlUYWJsZSwgcGxpbmtFbnZ9IGZyb20gJy4uL3V0aWxzL21pc2MnO1xuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbihvcHQ6IG9wdGlvbnMuSW5pdENtZE9wdGlvbnMsIHdvcmtzcGFjZT86IHN0cmluZykge1xuICBjb25zdCBjd2QgPSBwbGlua0Vudi53b3JrRGlyO1xuICBnZXRTdG9yZSgpLnBpcGUoXG4gICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKHMxLCBzMikgPT4gczEucGFja2FnZXNVcGRhdGVDaGVja3N1bSA9PT0gczIucGFja2FnZXNVcGRhdGVDaGVja3N1bSksXG4gICAgc2tpcCgxKSxcbiAgICBtYXAocyA9PiBzLnNyY1BhY2thZ2VzKSxcbiAgICBtYXAoc3JjUGFja2FnZXMgPT4ge1xuICAgICAgY29uc3QgcGFrcyA9IEFycmF5LmZyb20oc3JjUGFja2FnZXMudmFsdWVzKCkpO1xuXG4gICAgICBjb25zdCB0YWJsZSA9IGNyZWF0ZUNsaVRhYmxlKHtcbiAgICAgICAgaG9yaXpvbnRhbExpbmVzOiBmYWxzZSxcbiAgICAgICAgY29sQWxpZ25zOiBbJ3JpZ2h0JywgJ2xlZnQnXVxuICAgICAgfSk7XG4gICAgICB0YWJsZS5wdXNoKFt7Y29sU3BhbjogMywgY29udGVudDogJ0xpbmtlZCBwYWNrYWdlcycsIGhBbGlnbjogJ2NlbnRlcid9XSk7XG4gICAgICB0YWJsZS5wdXNoKFsnUGFja2FnZSBuYW1lJywgJ1ZlcnNpb24nLCAnUGF0aCddLFxuICAgICAgICAgICAgICAgICBbJy0tLS0tLS0tLS0tLScsICctLS0tLS0tJywgJy0tLS0nXSk7XG4gICAgICBmb3IgKGNvbnN0IHBrIG9mIHBha3MpIHtcbiAgICAgICAgdGFibGUucHVzaChbcGsubmFtZSwgcGsuanNvbi52ZXJzaW9uLCBjaGFsay5ncmF5KFBhdGgucmVsYXRpdmUoY3dkLCBway5yZWFsUGF0aCkpXSk7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyh0YWJsZS50b1N0cmluZygpKTtcbiAgICAgIHByaW50V29ya3NwYWNlcygpO1xuICAgIH0pXG4gICkuc3Vic2NyaWJlKCk7XG5cbiAgY29uc3QgZXhpc3RpbmdXc0tleXMgPSBnZXRTdGF0ZSgpLndvcmtzcGFjZXM7XG5cbiAgLy8gcHJpbnQgbmV3bHkgYWRkZWQgd29ya3NwYWNlIGhvaXN0ZWQgZGVwZW5kZW5jeSBpbmZvcm1hdGlvblxuICBnZXRTdG9yZSgpLnBpcGUobWFwKHMgPT4gcy5sYXN0Q3JlYXRlZFdvcmtzcGFjZSksXG4gICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKSxcbiAgICBzY2FuKChwcmV2LCBjdXJyKSA9PiB7XG4gICAgICBpZiAoY3VyciAmJiAhZXhpc3RpbmdXc0tleXMuaGFzKGN1cnIpKSB7XG4gICAgICAgIHByaW50V29ya3NwYWNlSG9pc3RlZERlcHMoZ2V0U3RhdGUoKS53b3Jrc3BhY2VzLmdldChjdXJyKSEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGN1cnI7XG4gICAgfSlcbiAgKS5zdWJzY3JpYmUoKTtcblxuICAvLyBwcmludCBleGlzdGluZyB3b3Jrc3BhY2UgQ0hBTkdFRCBob2lzdGVkIGRlcGVuZGVuY3kgaW5mb3JtYXRpb25cbiAgbWVyZ2UoLi4uQXJyYXkuZnJvbShnZXRTdGF0ZSgpLndvcmtzcGFjZXMua2V5cygpKS5tYXAod3NLZXkgPT4gZ2V0U3RvcmUoKS5waXBlKFxuICAgIG1hcChzID0+IHMud29ya3NwYWNlcyksXG4gICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKSxcbiAgICBtYXAocyA9PiBzLmdldCh3c0tleSkpLFxuICAgIGRpc3RpbmN0VW50aWxDaGFuZ2VkKChzMSwgczIpID0+IHMxIS5ob2lzdEluZm8gPT09IHMyIS5ob2lzdEluZm8gJiYgczEhLmhvaXN0UGVlckRlcEluZm8gPT09IHMyIS5ob2lzdFBlZXJEZXBJbmZvKSxcbiAgICBzY2FuKCh3c09sZCwgd3NOZXcpID0+IHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCcqKioqKioqKioqKioqKioqKicsIHdzS2V5KTtcbiAgICAgIHByaW50V29ya3NwYWNlSG9pc3RlZERlcHMod3NOZXchKTtcbiAgICAgIHJldHVybiB3c05ldztcbiAgICB9KVxuICApKSkuc3Vic2NyaWJlKCk7XG5cbiAgaWYgKHdvcmtzcGFjZSkge1xuICAgIGFjdGlvbnMudXBkYXRlV29ya3NwYWNlKHtkaXI6IHdvcmtzcGFjZSwgaXNGb3JjZTogb3B0LmZvcmNlLCBjcmVhdGVIb29rOiBvcHQubGludEhvb2t9KTtcbiAgfSBlbHNlIHtcbiAgICBhY3Rpb25zLmluaXRSb290RGlyKHtpc0ZvcmNlOiBvcHQuZm9yY2UsIGNyZWF0ZUhvb2s6IG9wdC5saW50SG9va30pO1xuICAgIHNldEltbWVkaWF0ZSgoKSA9PiBsaXN0UHJvamVjdCgpKTtcbiAgfVxuICAvLyBzZXRJbW1lZGlhdGUoKCkgPT4gcHJpbnRXb3Jrc3BhY2VzKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJpbnRXb3Jrc3BhY2VzKCkge1xuICBjb25zdCB0YWJsZSA9IGNyZWF0ZUNsaVRhYmxlKHtcbiAgICBob3Jpem9udGFsTGluZXM6IGZhbHNlLFxuICAgIGNvbEFsaWduczogWydyaWdodCcsICdyaWdodCddXG4gIH0pO1xuICBjb25zdCBzZXAgPSBbJy0tLS0tLS0tLS0tLS0tJywgJy0tLS0tLS0tLS0tLS0tLS0tLScsICctLS0tLS0tLS0tLS0nLCAnLS0tLS0tLS0tLScsICctLS0tLSddLm1hcChpdGVtID0+IGNoYWxrLmdyYXkoaXRlbSkpO1xuICB0YWJsZS5wdXNoKFt7Y29sU3BhbjogNSwgY29udGVudDogY2hhbGsudW5kZXJsaW5lKCdXb3JrdHJlZSBTcGFjZSBhbmQgbGlua2VkIGRlcGVuZGVuY2llc1xcbicpLCBoQWxpZ246ICdjZW50ZXInfV0sXG4gICAgWydXT1JLVFJFRSBTUEFDRScsICdERVBFTkRFTkNZIFBBQ0tBR0UnLCAnRVhQRUNURUQgVkVSU0lPTicsICdBQ1RVQUwgVkVSU0lPTicsICdTVEFURSddLm1hcChpdGVtID0+IGNoYWxrLmdyYXkoaXRlbSkpLFxuICAgIHNlcCk7XG5cbiAgbGV0IHdzSWR4ID0gMDtcbiAgZm9yIChjb25zdCByZWxkaXIgb2YgZ2V0U3RhdGUoKS53b3Jrc3BhY2VzLmtleXMoKSkge1xuICAgIGlmICh3c0lkeCA+IDApIHtcbiAgICAgIHRhYmxlLnB1c2goc2VwKTtcbiAgICB9XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgY29uc3QgcGtKc29uID0gZ2V0U3RhdGUoKS53b3Jrc3BhY2VzLmdldChyZWxkaXIpIS5vcmlnaW5JbnN0YWxsSnNvbjtcbiAgICAvLyBjb25zb2xlLmxvZyhwa0pzb24pO1xuICAgIGxldCB3b3Jrc3BhY2VMYWJlbCA9IHJlbGRpciA/IGAgICR7cmVsZGlyfWAgOiAnICAocm9vdCBkaXJlY3RvcnkpJztcbiAgICBpZiAoZ2V0U3RhdGUoKS5jdXJyV29ya3NwYWNlID09PSByZWxkaXIpIHtcbiAgICAgIHdvcmtzcGFjZUxhYmVsID0gY2hhbGsuaW52ZXJzZSh3b3Jrc3BhY2VMYWJlbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdvcmtzcGFjZUxhYmVsID0gY2hhbGsuZ3JheSh3b3Jrc3BhY2VMYWJlbCk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB7bmFtZTogZGVwLCBqc29uOiB7dmVyc2lvbjogdmVyfSwgaXNJbnN0YWxsZWR9IG9mIHBhY2thZ2VzNFdvcmtzcGFjZUtleShyZWxkaXIpKSB7XG4gICAgICBjb25zdCBleHBlY3RlZFZlciA9IGNvbnZlcnRWZXJzaW9uKHBrSnNvbiwgZGVwKTtcbiAgICAgIGNvbnN0IHNhbWUgPSBleHBlY3RlZFZlciA9PT0gdmVyO1xuICAgICAgdGFibGUucHVzaChbXG4gICAgICAgIGkgPT09IDAgPyB3b3Jrc3BhY2VMYWJlbCA6ICcnLFxuICAgICAgICBzYW1lID8gZGVwIDogY2hhbGsucmVkKGRlcCksXG4gICAgICAgIHNhbWUgPyBleHBlY3RlZFZlciA6IGNoYWxrLmJnUmVkKGV4cGVjdGVkVmVyKSxcbiAgICAgICAgdmVyLFxuICAgICAgICBpc0luc3RhbGxlZCA/ICcnIDogY2hhbGsuZ3JheSgnbGlua2VkJylcbiAgICAgIF0pO1xuICAgICAgaSsrO1xuICAgIH1cbiAgICB3c0lkeCsrO1xuICB9XG5cbiAgY29uc29sZS5sb2codGFibGUudG9TdHJpbmcoKSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRWZXJzaW9uKHBrZ0pzb246IHtcbiAgZGVwZW5kZW5jaWVzPzoge1trOiBzdHJpbmddOiBzdHJpbmd9LFxuICBkZXZEZXBlbmRlbmNpZXM/OiB7W2s6IHN0cmluZ106IHN0cmluZ31cbn0sIGRlcE5hbWU6IHN0cmluZykge1xuICBsZXQgdmVyID0gcGtnSnNvbi5kZXBlbmRlbmNpZXMgPyBwa2dKc29uLmRlcGVuZGVuY2llc1tkZXBOYW1lXSA6IG51bGw7XG4gIGlmICh2ZXIgPT0gbnVsbCAmJiBwa2dKc29uLmRldkRlcGVuZGVuY2llcykge1xuICAgIHZlciA9IHBrZ0pzb24uZGV2RGVwZW5kZW5jaWVzW2RlcE5hbWVdO1xuICB9XG4gIGlmICh2ZXIgPT0gbnVsbCkge1xuICAgIHJldHVybiAnJztcbiAgfVxuICBpZiAodmVyLnN0YXJ0c1dpdGgoJy4nKSB8fCB2ZXIuc3RhcnRzV2l0aCgnZmlsZTonKSkge1xuICAgIGNvbnN0IG0gPSAvXFwtKFxcZCsoPzpcXC5cXGQrKXsxLDJ9KD86XFwtW15cXC1dKyk/KVxcLnRneiQvLmV4ZWModmVyKTtcbiAgICBpZiAobSkge1xuICAgICAgcmV0dXJuIG1bMV07XG4gICAgfVxuICB9XG4gIHJldHVybiB2ZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcmludFdvcmtzcGFjZUhvaXN0ZWREZXBzKHdvcmtzcGFjZTogV29ya3NwYWNlU3RhdGUpIHtcbiAgY29uc29sZS5sb2coY2hhbGsuYm9sZChgXFxuSG9pc3RlZCBUcmFuc2l0aXZlIERlcGVuZGVuY3kgJiBEZXBlbmRlbnRzICgke3dvcmtzcGFjZS5pZCB8fCAnPHJvb3QgZGlyZWN0b3J5Pid9KWApKTtcbiAgY29uc3QgdGFibGUgPSBjcmVhdGVUYWJsZSgpO1xuICB0YWJsZS5wdXNoKFsnREVQRU5ERU5DWScsICdERVBFTkRFTlQnXS5tYXAoaXRlbSA9PiBjaGFsay5ncmF5KGl0ZW0pKSxcbiAgICBbJy0tLScsICctLS0nXS5tYXAoaXRlbSA9PiBjaGFsay5ncmF5KGl0ZW0pKSk7XG4gIGZvciAoY29uc3QgW2RlcCwgZGVwZW5kZW50c10gb2Ygd29ya3NwYWNlLmhvaXN0SW5mbyEuZW50cmllcygpKSB7XG4gICAgdGFibGUucHVzaChyZW5kZXJIb2lzdERlcEluZm8oZGVwLCBkZXBlbmRlbnRzKSk7XG4gIH1cbiAgY29uc29sZS5sb2codGFibGUudG9TdHJpbmcoKSk7XG4gIGlmICh3b3Jrc3BhY2UuaG9pc3REZXZJbmZvLnNpemUgPiAwKSB7XG4gICAgY29uc3QgdGFibGUgPSBjcmVhdGVUYWJsZSgpO1xuICAgIHRhYmxlLnB1c2goWydERVBFTkRFTkNZJywgJ0RFUEVOREVOVCddLm1hcChpdGVtID0+IGNoYWxrLmdyYXkoaXRlbSkpLFxuICAgIFsnLS0tJywgJy0tLSddLm1hcChpdGVtID0+IGNoYWxrLmdyYXkoaXRlbSkpKTtcbiAgICBjb25zb2xlLmxvZyhjaGFsay5ib2xkKGBcXG5Ib2lzdGVkIFRyYW5zaXRpdmUgKGRldikgRGVwZW5kZW5jeSAmIERlcGVuZGVudHMgKCR7d29ya3NwYWNlLmlkIHx8ICc8cm9vdCBkaXJlY3Rvcnk+J30pYCkpO1xuICAgIGZvciAoY29uc3QgW2RlcCwgZGVwZW5kZW50c10gb2Ygd29ya3NwYWNlLmhvaXN0RGV2SW5mbyEuZW50cmllcygpKSB7XG4gICAgICB0YWJsZS5wdXNoKHJlbmRlckhvaXN0RGVwSW5mbyhkZXAsIGRlcGVuZGVudHMpKTtcbiAgICB9XG4gICAgY29uc29sZS5sb2codGFibGUudG9TdHJpbmcoKSk7XG4gIH1cbiAgaWYgKHdvcmtzcGFjZS5ob2lzdFBlZXJEZXBJbmZvLnNpemUgPiAwKSB7XG4gICAgY29uc29sZS5sb2coY2hhbGsuYm9sZChgSG9pc3RlZCBUcmFuc2l0aXZlIFBlZXIgRGVwZW5kZW5jaWVzICgke3dvcmtzcGFjZS5pZCB8fCAnPHJvb3QgZGlyZWN0b3J5Pid9KWApKTtcbiAgICBjb25zdCB0YWJsZSA9IGNyZWF0ZVRhYmxlKCk7XG4gICAgdGFibGUucHVzaChbJ0RFUEVOREVOQ1knLCAnREVQRU5ERU5UJ10ubWFwKGl0ZW0gPT4gY2hhbGsuZ3JheShpdGVtKSksXG4gICAgWyctLS0nLCAnLS0tJ10ubWFwKGl0ZW0gPT4gY2hhbGsuZ3JheShpdGVtKSkpO1xuICAgIGZvciAoY29uc3QgW2RlcCwgZGVwZW5kZW50c10gb2Ygd29ya3NwYWNlLmhvaXN0UGVlckRlcEluZm8hLmVudHJpZXMoKSkge1xuICAgICAgdGFibGUucHVzaChyZW5kZXJIb2lzdFBlZXJEZXBJbmZvKGRlcCwgZGVwZW5kZW50cykpO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyh0YWJsZS50b1N0cmluZygpKTtcbiAgfVxuICBpZiAod29ya3NwYWNlLmhvaXN0RGV2UGVlckRlcEluZm8uc2l6ZSA+IDApIHtcbiAgICBjb25zb2xlLmxvZyhjaGFsay55ZWxsb3dCcmlnaHQoYFxcbkhvaXN0ZWQgVHJhbnNpdGl2ZSBQZWVyIERlcGVuZGVuY2llcyAoZGV2KSAoJHt3b3Jrc3BhY2UuaWQgfHwgJzxyb290IGRpcmVjdG9yeT4nfSlgKSk7XG4gICAgY29uc3QgdGFibGUgPSBjcmVhdGVUYWJsZSgpO1xuICAgIHRhYmxlLnB1c2goWydERVBFTkRFTkNZJywgJ0RFUEVOREVOVCddLm1hcChpdGVtID0+IGNoYWxrLmdyYXkoaXRlbSkpLFxuICAgIFsnLS0tJywgJy0tLSddLm1hcChpdGVtID0+IGNoYWxrLmdyYXkoaXRlbSkpKTtcbiAgICBmb3IgKGNvbnN0IFtkZXAsIGRlcGVuZGVudHNdIG9mIHdvcmtzcGFjZS5ob2lzdERldlBlZXJEZXBJbmZvIS5lbnRyaWVzKCkpIHtcbiAgICAgIHRhYmxlLnB1c2gocmVuZGVySG9pc3RQZWVyRGVwSW5mbyhkZXAsIGRlcGVuZGVudHMpKTtcbiAgICB9XG4gICAgY29uc29sZS5sb2codGFibGUudG9TdHJpbmcoKSk7XG4gIH1cbiAgcHJpbnRDb2xvckV4cGxhaW5hdGlvbih3b3Jrc3BhY2UpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVUYWJsZSgpIHtcbiAgY29uc3QgdGFibGUgPSBjcmVhdGVDbGlUYWJsZSh7XG4gICAgaG9yaXpvbnRhbExpbmVzOiBmYWxzZSxcbiAgICAvLyBzdHlsZToge2hlYWQ6IFtdfSxcbiAgICBjb2xBbGlnbnM6IFsncmlnaHQnLCAnbGVmdCddXG4gIH0pO1xuICByZXR1cm4gdGFibGU7XG59XG5cbnR5cGUgRGVwZW5kZW50SW5mbyA9IFdvcmtzcGFjZVN0YXRlWydob2lzdEluZm8nXSBleHRlbmRzIE1hcDxzdHJpbmcsIGluZmVyIFQ+ID8gVCA6IHVua25vd247XG5cbmZ1bmN0aW9uIHJlbmRlckhvaXN0RGVwSW5mbyhkZXA6IHN0cmluZywgZGVwZW5kZW50czogRGVwZW5kZW50SW5mbyk6IFtkZXA6IHN0cmluZywgdmVyOiBzdHJpbmddIHtcbiAgcmV0dXJuIFtcbiAgICBkZXBlbmRlbnRzLnNhbWVWZXIgPyBkZXAgOiBkZXBlbmRlbnRzLmRpcmVjdCA/IGNoYWxrLnllbGxvdyhkZXApIDogY2hhbGsuYmdSZWQoZGVwKSxcbiAgICBkZXBlbmRlbnRzLmJ5Lm1hcCgoaXRlbSwgaWR4KSA9PlxuICAgICAgYCR7ZGVwZW5kZW50cy5kaXJlY3QgJiYgaWR4ID09PSAwID8gY2hhbGsuZ3JlZW4oaXRlbS52ZXIpIDogaWR4ID4gMCA/IGNoYWxrLmdyYXkoaXRlbS52ZXIpIDogY2hhbGsuY3lhbihpdGVtLnZlcil9OiAke2NoYWxrLmdyZXkoaXRlbS5uYW1lKX1gXG4gICAgKS5qb2luKCdcXG4nKVxuICBdO1xufVxuZnVuY3Rpb24gcmVuZGVySG9pc3RQZWVyRGVwSW5mbyhkZXA6IHN0cmluZywgZGVwZW5kZW50czogRGVwZW5kZW50SW5mbyk6IFtkZXA6IHN0cmluZywgdmVyOiBzdHJpbmddIHtcbiAgcmV0dXJuIFtcbiAgICBkZXBlbmRlbnRzLm1pc3NpbmcgPyBjaGFsay5iZ1llbGxvdyhkZXApIDogKGRlcGVuZGVudHMuZHVwbGljYXRlUGVlciA/IGRlcCA6IGNoYWxrLmdyZWVuKGRlcCkpLFxuICAgIGRlcGVuZGVudHMuYnkubWFwKChpdGVtLCBpZHgpID0+XG4gICAgICBgJHtkZXBlbmRlbnRzLmRpcmVjdCAmJiBpZHggPT09IDAgPyBjaGFsay5ncmVlbihpdGVtLnZlcikgOiBpZHggPiAwID8gaXRlbS52ZXIgOiBjaGFsay5jeWFuKGl0ZW0udmVyKX06ICR7Y2hhbGsuZ3JleShpdGVtLm5hbWUpfWBcbiAgICApLmpvaW4oJ1xcbicpXG4gIF07XG59XG5cbmZ1bmN0aW9uIHByaW50Q29sb3JFeHBsYWluYXRpb24od29ya3NwYWNlOiBXb3Jrc3BhY2VTdGF0ZSkge1xuICBjb25zdCBzdW1tYXJ5ID0gd29ya3NwYWNlLmhvaXN0SW5mb1N1bW1hcnk7XG4gIGlmIChzdW1tYXJ5ID09IG51bGwpXG4gICAgcmV0dXJuO1xuICBpZiAoc3VtbWFyeS5jb25mbGljdERlcHMubGVuZ3RoID4gMCkge1xuICAgIGNvbnNvbGUubG9nKGBBYm92ZSBsaXN0ZWQgdHJhbnNpdGl2ZSBkZXBlbmRlbmNpZXM6IFwiJHtjaGFsay5yZWQoc3VtbWFyeS5jb25mbGljdERlcHMuam9pbignLCAnKSl9XCIgaGF2ZSBgICtcbiAgICAgICdjb25mbGljdCBkZXBlbmRlbmN5IHZlcnNpb24sIHJlc29sdmUgdGhlbSBieSBjaG9vc2luZyBhIHZlcnNpb24gYW5kIGFkZCB0aGVtIHRvIHdvcmt0cmVlIHNwYWNlLlxcbicpO1xuICB9XG4gIGlmIChfLnNpemUoc3VtbWFyeS5taXNzaW5nRGVwcykgPiAwKSB7XG4gICAgY29uc29sZS5sb2coYEFib3ZlIGxpc3RlZCB0cmFuc2l0aXZlIHBlZXIgZGVwZW5kZW5jaWVzIGluICR7Y2hhbGsuYmdZZWxsb3coJ3llbGxvdycpfSBzaG91bGQgYmUgYWRkZWQgdG8gd29ya3RyZWUgc3BhY2UgYXMgXCJkZXBlbmRlbmNpZXNcIjpcXG5gICtcbiAgICAgIGNoYWxrLnllbGxvdyhKU09OLnN0cmluZ2lmeShzdW1tYXJ5Lm1pc3NpbmdEZXBzLCBudWxsLCAnICAnKS5yZXBsYWNlKC9eKFteXSkvbWcsIChtLCBwMSkgPT4gJyAgJyArIHAxKSArICdcXG4nKSk7XG4gIH1cbiAgaWYgKF8uc2l6ZShzdW1tYXJ5Lm1pc3NpbmdEZXZEZXBzKSA+IDApIHtcbiAgICBjb25zb2xlLmxvZygnQWJvdmUgbGlzdGVkIHRyYW5zaXRpdmUgcGVlciBkZXBlbmRlbmNpZXMgbWlnaHQgc2hvdWxkIGJlIGFkZGVkIHRvIHdvcmt0cmVlIHNwYWNlIGFzIFwiZGV2RGVwZW5kZW5jaWVzXCI6XFxuJyArXG4gICAgICBjaGFsay55ZWxsb3coSlNPTi5zdHJpbmdpZnkoc3VtbWFyeS5taXNzaW5nRGV2RGVwcywgbnVsbCwgJyAgJykucmVwbGFjZSgvXihbXl0pL21nLCAobSwgcDEpID0+ICcgICcgKyBwMSkpICsgJ1xcbicpO1xuICB9XG59XG4iXX0=