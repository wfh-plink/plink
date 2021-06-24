"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printWorkspaceHoistedDeps = exports.printWorkspaces = void 0;
/* eslint-disable no-console, max-len */
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
        package_mgr_1.actionDispatcher.updateWorkspace({ dir: workspace, isForce: opt.force, cache: opt.cache, useNpmCi: opt.useCi });
    }
    else {
        package_mgr_1.actionDispatcher.initRootDir({ isForce: opt.force, cache: opt.cache, useNpmCi: opt.useCi });
        setImmediate(() => cli_project_1.listProject());
    }
    // setImmediate(() => printWorkspaces());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLWluaXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9jbWQvY2xpLWluaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsd0NBQXdDO0FBQ3hDLGtEQUEwQjtBQUMxQixnREFBd0I7QUFDeEIsK0JBQTJCO0FBQzNCLDhDQUF1RTtBQUN2RSxnREFBZ0c7QUFDaEcsNEJBQTBCO0FBQzFCLG9EQUF5RDtBQUN6RCw4Q0FBOEM7QUFDOUMsK0NBQTRDO0FBQzVDLG9EQUF1QjtBQUV2Qix3Q0FBdUQ7QUFFdkQsbUJBQXdCLEdBQWtELEVBQUUsU0FBa0I7SUFDNUYsTUFBTSxHQUFHLEdBQUcsZUFBUSxDQUFDLE9BQU8sQ0FBQztJQUM3QixzQkFBUSxFQUFFLENBQUMsSUFBSSxDQUNiLGdDQUFvQixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLHNCQUFzQixLQUFLLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxFQUN6RixnQkFBSSxDQUFDLENBQUMsQ0FBQyxFQUNQLGVBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFDdkIsZUFBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1FBQ2hCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFFOUMsTUFBTSxLQUFLLEdBQUcscUJBQWMsQ0FBQztZQUMzQixlQUFlLEVBQUUsS0FBSztZQUN0QixTQUFTLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDO1NBQzdCLENBQUMsQ0FBQztRQUNILEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekUsS0FBSyxDQUFDLElBQUksQ0FBQyxD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Q0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUN0SDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlLCBtYXgtbGVuICovXG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQge21lcmdlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGRpc3RpbmN0VW50aWxDaGFuZ2VkLCBtYXAsIHNraXAsIHNjYW4gfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBhY3Rpb25EaXNwYXRjaGVyIGFzIGFjdGlvbnMsIGdldFN0YXRlLCBnZXRTdG9yZSwgV29ya3NwYWNlU3RhdGV9IGZyb20gJy4uL3BhY2thZ2UtbWdyJztcbmltcG9ydCAnLi4vZWRpdG9yLWhlbHBlcic7XG5pbXBvcnQgeyBwYWNrYWdlczRXb3Jrc3BhY2VLZXkgfSBmcm9tICcuLi9wYWNrYWdlLXV0aWxzJztcbi8vIGltcG9ydCB7IGdldFJvb3REaXIgfSBmcm9tICcuLi91dGlscy9taXNjJztcbmltcG9ydCB7IGxpc3RQcm9qZWN0IH0gZnJvbSAnLi9jbGktcHJvamVjdCc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgb3B0aW9ucyBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7Y3JlYXRlQ2xpVGFibGUsIHBsaW5rRW52fSBmcm9tICcuLi91dGlscy9taXNjJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24ob3B0OiBvcHRpb25zLkluaXRDbWRPcHRpb25zICYgb3B0aW9ucy5OcG1DbGlPcHRpb24sIHdvcmtzcGFjZT86IHN0cmluZykge1xuICBjb25zdCBjd2QgPSBwbGlua0Vudi53b3JrRGlyO1xuICBnZXRTdG9yZSgpLnBpcGUoXG4gICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKHMxLCBzMikgPT4gczEucGFja2FnZXNVcGRhdGVDaGVja3N1bSA9PT0gczIucGFja2FnZXNVcGRhdGVDaGVja3N1bSksXG4gICAgc2tpcCgxKSxcbiAgICBtYXAocyA9PiBzLnNyY1BhY2thZ2VzKSxcbiAgICBtYXAoc3JjUGFja2FnZXMgPT4ge1xuICAgICAgY29uc3QgcGFrcyA9IEFycmF5LmZyb20oc3JjUGFja2FnZXMudmFsdWVzKCkpO1xuXG4gICAgICBjb25zdCB0YWJsZSA9IGNyZWF0ZUNsaVRhYmxlKHtcbiAgICAgICAgaG9yaXpvbnRhbExpbmVzOiBmYWxzZSxcbiAgICAgICAgY29sQWxpZ25zOiBbJ3JpZ2h0JywgJ2xlZnQnXVxuICAgICAgfSk7XG4gICAgICB0YWJsZS5wdXNoKFt7Y29sU3BhbjogMywgY29udGVudDogJ0xpbmtlZCBwYWNrYWdlcycsIGhBbGlnbjogJ2NlbnRlcid9XSk7XG4gICAgICB0YWJsZS5wdXNoKFsnUGFja2FnZSBuYW1lJywgJ1ZlcnNpb24nLCAnUGF0aCddLFxuICAgICAgICAgICAgICAgICBbJy0tLS0tLS0tLS0tLScsICctLS0tLS0tJywgJy0tLS0nXSk7XG4gICAgICBmb3IgKGNvbnN0IHBrIG9mIHBha3MpIHtcbiAgICAgICAgdGFibGUucHVzaChbcGsubmFtZSwgKHBrLmpzb24gYXMge3ZlcnNpb246IHN0cmluZ30pLnZlcnNpb24sIGNoYWxrLmdyYXkoUGF0aC5yZWxhdGl2ZShjd2QsIHBrLnJlYWxQYXRoKSldKTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKHRhYmxlLnRvU3RyaW5nKCkpO1xuICAgICAgcHJpbnRXb3Jrc3BhY2VzKCk7XG4gICAgfSlcbiAgKS5zdWJzY3JpYmUoKTtcblxuICBjb25zdCBleGlzdGluZ1dzS2V5cyA9IGdldFN0YXRlKCkud29ya3NwYWNlcztcblxuICAvLyBwcmludCBuZXdseSBhZGRlZCB3b3Jrc3BhY2UgaG9pc3RlZCBkZXBlbmRlbmN5IGluZm9ybWF0aW9uXG4gIGdldFN0b3JlKCkucGlwZShtYXAocyA9PiBzLmxhc3RDcmVhdGVkV29ya3NwYWNlKSxcbiAgICBkaXN0aW5jdFVudGlsQ2hhbmdlZCgpLFxuICAgIHNjYW4oKHByZXYsIGN1cnIpID0+IHtcbiAgICAgIGlmIChjdXJyICYmICFleGlzdGluZ1dzS2V5cy5oYXMoY3VycikpIHtcbiAgICAgICAgcHJpbnRXb3Jrc3BhY2VIb2lzdGVkRGVwcyhnZXRTdGF0ZSgpLndvcmtzcGFjZXMuZ2V0KGN1cnIpISk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY3VycjtcbiAgICB9KVxuICApLnN1YnNjcmliZSgpO1xuXG4gIC8vIHByaW50IGV4aXN0aW5nIHdvcmtzcGFjZSBDSEFOR0VEIGhvaXN0ZWQgZGVwZW5kZW5jeSBpbmZvcm1hdGlvblxuICBtZXJnZSguLi5BcnJheS5mcm9tKGdldFN0YXRlKCkud29ya3NwYWNlcy5rZXlzKCkpLm1hcCh3c0tleSA9PiBnZXRTdG9yZSgpLnBpcGUoXG4gICAgbWFwKHMgPT4gcy53b3Jrc3BhY2VzKSxcbiAgICBkaXN0aW5jdFVudGlsQ2hhbmdlZCgpLFxuICAgIG1hcChzID0+IHMuZ2V0KHdzS2V5KSksXG4gICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKHMxLCBzMikgPT4gczEhLmhvaXN0SW5mbyA9PT0gczIhLmhvaXN0SW5mbyAmJiBzMSEuaG9pc3RQZWVyRGVwSW5mbyA9PT0gczIhLmhvaXN0UGVlckRlcEluZm8pLFxuICAgIHNjYW4oKHdzT2xkLCB3c05ldykgPT4ge1xuICAgICAgLy8gY29uc29sZS5sb2coJyoqKioqKioqKioqKioqKioqJywgd3NLZXkpO1xuICAgICAgcHJpbnRXb3Jrc3BhY2VIb2lzdGVkRGVwcyh3c05ldyEpO1xuICAgICAgcmV0dXJuIHdzTmV3O1xuICAgIH0pXG4gICkpKS5zdWJzY3JpYmUoKTtcblxuICBpZiAod29ya3NwYWNlKSB7XG4gICAgYWN0aW9ucy51cGRhdGVXb3Jrc3BhY2Uoe2Rpcjogd29ya3NwYWNlLCBpc0ZvcmNlOiBvcHQuZm9yY2UsIGNhY2hlOiBvcHQuY2FjaGUsIHVzZU5wbUNpOiBvcHQudXNlQ2l9KTtcbiAgfSBlbHNlIHtcbiAgICBhY3Rpb25zLmluaXRSb290RGlyKHtpc0ZvcmNlOiBvcHQuZm9yY2UsIGNhY2hlOiBvcHQuY2FjaGUsIHVzZU5wbUNpOiBvcHQudXNlQ2l9KTtcbiAgICBzZXRJbW1lZGlhdGUoKCkgPT4gbGlzdFByb2plY3QoKSk7XG4gIH1cbiAgLy8gc2V0SW1tZWRpYXRlKCgpID0+IHByaW50V29ya3NwYWNlcygpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByaW50V29ya3NwYWNlcygpIHtcbiAgY29uc3QgdGFibGUgPSBjcmVhdGVDbGlUYWJsZSh7XG4gICAgaG9yaXpvbnRhbExpbmVzOiBmYWxzZSxcbiAgICBjb2xBbGlnbnM6IFsncmlnaHQnLCAncmlnaHQnXVxuICB9KTtcbiAgY29uc3Qgc2VwID0gWyctLS0tLS0tLS0tLS0tLScsICctLS0tLS0tLS0tLS0tLS0tLS0nLCAnLS0tLS0tLS0tLS0tJywgJy0tLS0tLS0tLS0nLCAnLS0tLS0nXS5tYXAoaXRlbSA9PiBjaGFsay5ncmF5KGl0ZW0pKTtcbiAgdGFibGUucHVzaChbe2NvbFNwYW46IDUsIGNvbnRlbnQ6IGNoYWxrLnVuZGVybGluZSgnV29ya3RyZWUgU3BhY2UgYW5kIGxpbmtlZCBkZXBlbmRlbmNpZXNcXG4nKSwgaEFsaWduOiAnY2VudGVyJ31dLFxuICAgIFsnV09SS1RSRUUgU1BBQ0UnLCAnREVQRU5ERU5DWSBQQUNLQUdFJywgJ0VYUEVDVEVEIFZFUlNJT04nLCAnQUNUVUFMIFZFUlNJT04nLCAnU1RBVEUnXS5tYXAoaXRlbSA9PiBjaGFsay5ncmF5KGl0ZW0pKSxcbiAgICBzZXApO1xuXG4gIGxldCB3c0lkeCA9IDA7XG4gIGZvciAoY29uc3QgcmVsZGlyIG9mIGdldFN0YXRlKCkud29ya3NwYWNlcy5rZXlzKCkpIHtcbiAgICBpZiAod3NJZHggPiAwKSB7XG4gICAgICB0YWJsZS5wdXNoKHNlcCk7XG4gICAgfVxuXG4gICAgbGV0IGkgPSAwO1xuICAgIGNvbnN0IHBrSnNvbiA9IGdldFN0YXRlKCkud29ya3NwYWNlcy5nZXQocmVsZGlyKSEub3JpZ2luSW5zdGFsbEpzb247XG4gICAgLy8gY29uc29sZS5sb2cocGtKc29uKTtcbiAgICBsZXQgd29ya3NwYWNlTGFiZWwgPSByZWxkaXIgPyBgICAke3JlbGRpcn1gIDogJyAgKHJvb3QgZGlyZWN0b3J5KSc7XG4gICAgaWYgKGdldFN0YXRlKCkuY3VycldvcmtzcGFjZSA9PT0gcmVsZGlyKSB7XG4gICAgICB3b3Jrc3BhY2VMYWJlbCA9IGNoYWxrLmludmVyc2Uod29ya3NwYWNlTGFiZWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB3b3Jrc3BhY2VMYWJlbCA9IGNoYWxrLmdyYXkod29ya3NwYWNlTGFiZWwpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qge25hbWU6IGRlcCwganNvbjoge3ZlcnNpb246IHZlcn0sIGlzSW5zdGFsbGVkfSBvZiBwYWNrYWdlczRXb3Jrc3BhY2VLZXkocmVsZGlyKSkge1xuICAgICAgY29uc3QgZXhwZWN0ZWRWZXIgPSBjb252ZXJ0VmVyc2lvbihwa0pzb24sIGRlcCk7XG4gICAgICBjb25zdCBzYW1lID0gZXhwZWN0ZWRWZXIgPT09IHZlcjtcbiAgICAgIHRhYmxlLnB1c2goW1xuICAgICAgICBpID09PSAwID8gd29ya3NwYWNlTGFiZWwgOiAnJyxcbiAgICAgICAgc2FtZSA/IGRlcCA6IGNoYWxrLnJlZChkZXApLFxuICAgICAgICBzYW1lID8gZXhwZWN0ZWRWZXIgOiBjaGFsay5iZ1JlZChleHBlY3RlZFZlciksXG4gICAgICAgIHZlcixcbiAgICAgICAgaXNJbnN0YWxsZWQgPyAnJyA6IGNoYWxrLmdyYXkoJ2xpbmtlZCcpXG4gICAgICBdKTtcbiAgICAgIGkrKztcbiAgICB9XG4gICAgd3NJZHgrKztcbiAgfVxuXG4gIGNvbnNvbGUubG9nKHRhYmxlLnRvU3RyaW5nKCkpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VmVyc2lvbihwa2dKc29uOiB7XG4gIGRlcGVuZGVuY2llcz86IHtbazogc3RyaW5nXTogc3RyaW5nfTtcbiAgZGV2RGVwZW5kZW5jaWVzPzoge1trOiBzdHJpbmddOiBzdHJpbmd9O1xufSwgZGVwTmFtZTogc3RyaW5nKSB7XG4gIGxldCB2ZXIgPSBwa2dKc29uLmRlcGVuZGVuY2llcyA/IHBrZ0pzb24uZGVwZW5kZW5jaWVzW2RlcE5hbWVdIDogbnVsbDtcbiAgaWYgKHZlciA9PSBudWxsICYmIHBrZ0pzb24uZGV2RGVwZW5kZW5jaWVzKSB7XG4gICAgdmVyID0gcGtnSnNvbi5kZXZEZXBlbmRlbmNpZXNbZGVwTmFtZV07XG4gIH1cbiAgaWYgKHZlciA9PSBudWxsKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIGlmICh2ZXIuc3RhcnRzV2l0aCgnLicpIHx8IHZlci5zdGFydHNXaXRoKCdmaWxlOicpKSB7XG4gICAgY29uc3QgbSA9IC9cXC0oXFxkKyg/OlxcLlxcZCspezEsMn0oPzpcXC1bXlxcLV0rKT8pXFwudGd6JC8uZXhlYyh2ZXIpO1xuICAgIGlmIChtKSB7XG4gICAgICByZXR1cm4gbVsxXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByaW50V29ya3NwYWNlSG9pc3RlZERlcHMod29ya3NwYWNlOiBXb3Jrc3BhY2VTdGF0ZSkge1xuICBjb25zb2xlLmxvZyhjaGFsay5ib2xkKGBcXG5Ib2lzdGVkIFRyYW5zaXRpdmUgRGVwZW5kZW5jeSAmIERlcGVuZGVudHMgKCR7d29ya3NwYWNlLmlkIHx8ICc8cm9vdCBkaXJlY3Rvcnk+J30pYCkpO1xuICBjb25zdCB0YWJsZSA9IGNyZWF0ZVRhYmxlKCk7XG4gIHRhYmxlLnB1c2goWydERVBFTkRFTkNZJywgJ0RFUEVOREVOVCddLm1hcChpdGVtID0+IGNoYWxrLmdyYXkoaXRlbSkpLFxuICAgIFsnLS0tJywgJy0tLSddLm1hcChpdGVtID0+IGNoYWxrLmdyYXkoaXRlbSkpKTtcbiAgZm9yIChjb25zdCBbZGVwLCBkZXBlbmRlbnRzXSBvZiB3b3Jrc3BhY2UuaG9pc3RJbmZvLmVudHJpZXMoKSkge1xuICAgIHRhYmxlLnB1c2gocmVuZGVySG9pc3REZXBJbmZvKGRlcCwgZGVwZW5kZW50cykpO1xuICB9XG4gIGNvbnNvbGUubG9nKHRhYmxlLnRvU3RyaW5nKCkpO1xuICBpZiAod29ya3NwYWNlLmhvaXN0RGV2SW5mby5zaXplID4gMCkge1xuICAgIGNvbnN0IHRhYmxlID0gY3JlYXRlVGFibGUoKTtcbiAgICB0YWJsZS5wdXNoKFsnREVQRU5ERU5DWScsICdERVBFTkRFTlQnXS5tYXAoaXRlbSA9PiBjaGFsay5ncmF5KGl0ZW0pKSxcbiAgICBbJy0tLScsICctLS0nXS5tYXAoaXRlbSA9PiBjaGFsay5ncmF5KGl0ZW0pKSk7XG4gICAgY29uc29sZS5sb2coY2hhbGsuYm9sZChgXFxuSG9pc3RlZCBUcmFuc2l0aXZlIChkZXYpIERlcGVuZGVuY3kgJiBEZXBlbmRlbnRzICgke3dvcmtzcGFjZS5pZCB8fCAnPHJvb3QgZGlyZWN0b3J5Pid9KWApKTtcbiAgICBmb3IgKGNvbnN0IFtkZXAsIGRlcGVuZGVudHNdIG9mIHdvcmtzcGFjZS5ob2lzdERldkluZm8uZW50cmllcygpKSB7XG4gICAgICB0YWJsZS5wdXNoKHJlbmRlckhvaXN0RGVwSW5mbyhkZXAsIGRlcGVuZGVudHMpKTtcbiAgICB9XG4gICAgY29uc29sZS5sb2codGFibGUudG9TdHJpbmcoKSk7XG4gIH1cbiAgaWYgKHdvcmtzcGFjZS5ob2lzdFBlZXJEZXBJbmZvLnNpemUgPiAwKSB7XG4gICAgY29uc29sZS5sb2coY2hhbGsuYm9sZChgSG9pc3RlZCBUcmFuc2l0aXZlIFBlZXIgRGVwZW5kZW5jaWVzICgke3dvcmtzcGFjZS5pZCB8fCAnPHJvb3QgZGlyZWN0b3J5Pid9KWApKTtcbiAgICBjb25zdCB0YWJsZSA9IGNyZWF0ZVRhYmxlKCk7XG4gICAgdGFibGUucHVzaChbJ0RFUEVOREVOQ1knLCAnREVQRU5ERU5UJ10ubWFwKGl0ZW0gPT4gY2hhbGsuZ3JheShpdGVtKSksXG4gICAgWyctLS0nLCAnLS0tJ10ubWFwKGl0ZW0gPT4gY2hhbGsuZ3JheShpdGVtKSkpO1xuICAgIGZvciAoY29uc3QgW2RlcCwgZGVwZW5kZW50c10gb2Ygd29ya3NwYWNlLmhvaXN0UGVlckRlcEluZm8uZW50cmllcygpKSB7XG4gICAgICB0YWJsZS5wdXNoKHJlbmRlckhvaXN0UGVlckRlcEluZm8oZGVwLCBkZXBlbmRlbnRzKSk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKHRhYmxlLnRvU3RyaW5nKCkpO1xuICB9XG4gIGlmICh3b3Jrc3BhY2UuaG9pc3REZXZQZWVyRGVwSW5mby5zaXplID4gMCkge1xuICAgIGNvbnNvbGUubG9nKGNoYWxrLnllbGxvd0JyaWdodChgXFxuSG9pc3RlZCBUcmFuc2l0aXZlIFBlZXIgRGVwZW5kZW5jaWVzIChkZXYpICgke3dvcmtzcGFjZS5pZCB8fCAnPHJvb3QgZGlyZWN0b3J5Pid9KWApKTtcbiAgICBjb25zdCB0YWJsZSA9IGNyZWF0ZVRhYmxlKCk7XG4gICAgdGFibGUucHVzaChbJ0RFUEVOREVOQ1knLCAnREVQRU5ERU5UJ10ubWFwKGl0ZW0gPT4gY2hhbGsuZ3JheShpdGVtKSksXG4gICAgWyctLS0nLCAnLS0tJ10ubWFwKGl0ZW0gPT4gY2hhbGsuZ3JheShpdGVtKSkpO1xuICAgIGZvciAoY29uc3QgW2RlcCwgZGVwZW5kZW50c10gb2Ygd29ya3NwYWNlLmhvaXN0RGV2UGVlckRlcEluZm8uZW50cmllcygpKSB7XG4gICAgICB0YWJsZS5wdXNoKHJlbmRlckhvaXN0UGVlckRlcEluZm8oZGVwLCBkZXBlbmRlbnRzKSk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKHRhYmxlLnRvU3RyaW5nKCkpO1xuICB9XG4gIHByaW50Q29sb3JFeHBsYWluYXRpb24od29ya3NwYWNlKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVGFibGUoKSB7XG4gIGNvbnN0IHRhYmxlID0gY3JlYXRlQ2xpVGFibGUoe1xuICAgIGhvcml6b250YWxMaW5lczogZmFsc2UsXG4gICAgLy8gc3R5bGU6IHtoZWFkOiBbXX0sXG4gICAgY29sQWxpZ25zOiBbJ3JpZ2h0JywgJ2xlZnQnXVxuICB9KTtcbiAgcmV0dXJuIHRhYmxlO1xufVxuXG50eXBlIERlcGVuZGVudEluZm8gPSBXb3Jrc3BhY2VTdGF0ZVsnaG9pc3RJbmZvJ10gZXh0ZW5kcyBNYXA8c3RyaW5nLCBpbmZlciBUPiA/IFQgOiB1bmtub3duO1xuXG5mdW5jdGlvbiByZW5kZXJIb2lzdERlcEluZm8oZGVwOiBzdHJpbmcsIGRlcGVuZGVudHM6IERlcGVuZGVudEluZm8pOiBbZGVwOiBzdHJpbmcsIHZlcjogc3RyaW5nXSB7XG4gIHJldHVybiBbXG4gICAgZGVwZW5kZW50cy5zYW1lVmVyID8gZGVwIDogZGVwZW5kZW50cy5kaXJlY3QgPyBjaGFsay55ZWxsb3coZGVwKSA6IGNoYWxrLmJnUmVkKGRlcCksXG4gICAgZGVwZW5kZW50cy5ieS5tYXAoKGl0ZW0sIGlkeCkgPT5cbiAgICAgIGAke2RlcGVuZGVudHMuZGlyZWN0ICYmIGlkeCA9PT0gMCA/IGNoYWxrLmdyZWVuKGl0ZW0udmVyKSA6IGlkeCA+IDAgPyBjaGFsay5ncmF5KGl0ZW0udmVyKSA6IGNoYWxrLmN5YW4oaXRlbS52ZXIpfTogJHtjaGFsay5ncmV5KGl0ZW0ubmFtZSl9YFxuICAgICkuam9pbignXFxuJylcbiAgXTtcbn1cbmZ1bmN0aW9uIHJlbmRlckhvaXN0UGVlckRlcEluZm8oZGVwOiBzdHJpbmcsIGRlcGVuZGVudHM6IERlcGVuZGVudEluZm8pOiBbZGVwOiBzdHJpbmcsIHZlcjogc3RyaW5nXSB7XG4gIHJldHVybiBbXG4gICAgZGVwZW5kZW50cy5taXNzaW5nID8gY2hhbGsuYmdZZWxsb3coZGVwKSA6IChkZXBlbmRlbnRzLmR1cGxpY2F0ZVBlZXIgPyBkZXAgOiBjaGFsay5ncmVlbihkZXApKSxcbiAgICBkZXBlbmRlbnRzLmJ5Lm1hcCgoaXRlbSwgaWR4KSA9PlxuICAgICAgYCR7ZGVwZW5kZW50cy5kaXJlY3QgJiYgaWR4ID09PSAwID8gY2hhbGsuZ3JlZW4oaXRlbS52ZXIpIDogaWR4ID4gMCA/IGl0ZW0udmVyIDogY2hhbGsuY3lhbihpdGVtLnZlcil9OiAke2NoYWxrLmdyZXkoaXRlbS5uYW1lKX1gXG4gICAgKS5qb2luKCdcXG4nKVxuICBdO1xufVxuXG5mdW5jdGlvbiBwcmludENvbG9yRXhwbGFpbmF0aW9uKHdvcmtzcGFjZTogV29ya3NwYWNlU3RhdGUpIHtcbiAgY29uc3Qgc3VtbWFyeSA9IHdvcmtzcGFjZS5ob2lzdEluZm9TdW1tYXJ5O1xuICBpZiAoc3VtbWFyeSA9PSBudWxsKVxuICAgIHJldHVybjtcbiAgaWYgKHN1bW1hcnkuY29uZmxpY3REZXBzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zb2xlLmxvZyhgQWJvdmUgbGlzdGVkIHRyYW5zaXRpdmUgZGVwZW5kZW5jaWVzOiBcIiR7Y2hhbGsucmVkKHN1bW1hcnkuY29uZmxpY3REZXBzLmpvaW4oJywgJykpfVwiIGhhdmUgYCArXG4gICAgICAnY29uZmxpY3QgZGVwZW5kZW5jeSB2ZXJzaW9uLCByZXNvbHZlIHRoZW0gYnkgY2hvb3NpbmcgYSB2ZXJzaW9uIGFuZCBhZGQgdGhlbSB0byB3b3JrdHJlZSBzcGFjZS5cXG4nKTtcbiAgfVxuICBpZiAoXy5zaXplKHN1bW1hcnkubWlzc2luZ0RlcHMpID4gMCkge1xuICAgIGNvbnNvbGUubG9nKGBBYm92ZSBsaXN0ZWQgdHJhbnNpdGl2ZSBwZWVyIGRlcGVuZGVuY2llcyBpbiAke2NoYWxrLmJnWWVsbG93KCd5ZWxsb3cnKX0gc2hvdWxkIGJlIGFkZGVkIHRvIHdvcmt0cmVlIHNwYWNlIGFzIFwiZGVwZW5kZW5jaWVzXCI6XFxuYCArXG4gICAgICBjaGFsay55ZWxsb3coSlNPTi5zdHJpbmdpZnkoc3VtbWFyeS5taXNzaW5nRGVwcywgbnVsbCwgJyAgJykucmVwbGFjZSgvXihbXl0pL21nLCAobSwgcDEpID0+ICcgICcgKyBwMSkgKyAnXFxuJykpO1xuICB9XG4gIGlmIChfLnNpemUoc3VtbWFyeS5taXNzaW5nRGV2RGVwcykgPiAwKSB7XG4gICAgY29uc29sZS5sb2coJ0Fib3ZlIGxpc3RlZCB0cmFuc2l0aXZlIHBlZXIgZGVwZW5kZW5jaWVzIG1pZ2h0IHNob3VsZCBiZSBhZGRlZCB0byB3b3JrdHJlZSBzcGFjZSBhcyBcImRldkRlcGVuZGVuY2llc1wiOlxcbicgK1xuICAgICAgY2hhbGsueWVsbG93KEpTT04uc3RyaW5naWZ5KHN1bW1hcnkubWlzc2luZ0RldkRlcHMsIG51bGwsICcgICcpLnJlcGxhY2UoL14oW15dKS9tZywgKG0sIHAxKSA9PiAnICAnICsgcDEpKSArICdcXG4nKTtcbiAgfVxufVxuIl19