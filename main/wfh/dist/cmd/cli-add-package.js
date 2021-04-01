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
exports.addDependencyTo = void 0;
const json_sync_parser_1 = __importDefault(require("../utils/json-sync-parser"));
const utils_1 = require("./utils");
const patch_text_1 = __importDefault(require("../utils/patch-text"));
const process_utils_1 = require("../process-utils");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const log4js_1 = require("log4js");
const lodash_1 = __importDefault(require("lodash"));
const chalk_1 = __importDefault(require("chalk"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const misc_1 = require("../utils/misc");
const package_list_helper_1 = require("../package-mgr/package-list-helper");
const index_1 = require("../package-mgr/index");
const log = log4js_1.getLogger('plink.cli-add-package');
function addDependencyTo(packages, to, dev = false) {
    return __awaiter(this, void 0, void 0, function* () {
        if (packages.length === 0) {
            throw new Error('At least specify one dependency argument');
        }
        let wsDirs = [];
        if (to == null) {
            if (index_1.isCwdWorkspace()) {
                to = misc_1.plinkEnv.workDir;
            }
            else {
                const ws = index_1.getState().currWorkspace;
                if (ws == null) {
                    throw new Error('No worktree space is found for current directory, and no "--to" option is specified.\n' +
                        'Either execute this command with option "--to <pkg name | pkg dir | worktree space>"' +
                        'or in a workstree space directory.');
                }
                to = index_1.workspaceDir(ws);
            }
            wsDirs.push(to);
        }
        else {
            const tryWsKey = index_1.workspaceKey(to);
            if (index_1.getState().workspaces.has(tryWsKey)) {
                wsDirs.push(path_1.default.resolve(to));
            }
            else {
                const [foundPkg] = utils_1.findPackagesByNames([to]);
                if (foundPkg == null) {
                    throw new Error('No matched linked package or worktree space is found for option "--to"');
                }
                to = foundPkg.realPath;
                const rootDir = misc_1.plinkEnv.rootDir;
                wsDirs = Array.from(package_list_helper_1.workspacesOfDependencies(foundPkg.name))
                    .map(ws => path_1.default.resolve(rootDir, ws));
            }
        }
        yield add(packages, to, dev);
        setImmediate(() => {
            for (const wsDir of wsDirs) {
                index_1.actionDispatcher.updateWorkspace({ dir: wsDir, isForce: false, createHook: false });
            }
        });
    });
}
exports.addDependencyTo = addDependencyTo;
function add(packages, toDir, dev = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const targetJsonFile = path_1.default.resolve(toDir, 'package.json');
        const pkgJsonStr = fs_1.default.readFileSync(targetJsonFile, 'utf-8');
        const objAst = json_sync_parser_1.default(pkgJsonStr);
        const patches = [];
        const depsAst = dev ? objAst.properties.find(prop => prop.name.text === '"devDependencies"') :
            objAst.properties.find(prop => prop.name.text === '"dependencies"');
        const depsSet = depsAst == null ?
            new Set() :
            new Set(depsAst.value.properties.map(prop => prop.name.text.slice(1, -1)));
        log.debug('existing:', depsSet);
        const input = packages.map(rawName => {
            const m = /^((?:@[^/]+\/)?[^/@]+)(?:@([^]+))?$/.exec(rawName);
            if (m) {
                return [m[1], m[2]];
            }
            else {
                throw new Error(`Invalid package name: ${rawName}, valid name should be like "<pkg name>[@<version>]"`);
            }
        });
        let i = 0;
        let newLines = '';
        const srcPkgs = Array.from(utils_1.findPackagesByNames(input.map(item => item[0])));
        yield Promise.all(srcPkgs.map((pkg) => __awaiter(this, void 0, void 0, function* () {
            const inputItem = input[i++];
            let version = inputItem[1];
            if (pkg == null || (pkg.json.dr == null && pkg.json.plink == null)) {
                const name = inputItem[0];
                if (depsSet.has(name)) {
                    log.warn(`Found duplicate existing dependency ${chalk_1.default.red(name)}`);
                    return;
                }
                if (version == null) {
                    version = yield fetchRemoteVersion(name);
                }
                log.info(`Package ${name}@${version} is not a linked package, add as 3rd party dependency`);
                newLines += `    "${name}": "${version}",\n`;
            }
            else {
                if (depsSet.has(pkg.name)) {
                    log.warn(`Duplicate with existing dependency ${chalk_1.default.red(pkg.name)}`);
                    return;
                }
                log.info(`Add package ${chalk_1.default.cyan(pkg.name)} ${version || ''}`);
                newLines += `    "${pkg.name}": "${version || pkg.json.version}",\n`;
            }
        })));
        if (newLines.length > 0)
            newLines = newLines.slice(0, newLines.length - 2); // trim last comma
        else
            return;
        log.debug(newLines);
        if (depsAst == null) {
            const last = objAst.properties[objAst.properties.length - 1];
            const pos = last.value.end;
            patches.push({ start: pos, end: pos,
                text: `,\n  "${dev ? 'devDependencies' : 'dependencies'}": {\n${newLines}\n  }` });
        }
        else {
            const props = depsAst.value.properties;
            let start = 0;
            if (props.length > 0) {
                start = props[props.length - 1].value.end;
                newLines = ',\n' + newLines;
            }
            else {
                start = depsAst.value.end - 1;
            }
            patches.push({ start, end: start, text: newLines });
        }
        const newJsonText = patch_text_1.default(pkgJsonStr, patches);
        log.info(`Write file: ${targetJsonFile}:\n` + newJsonText);
        fs_1.default.writeFileSync(targetJsonFile, newJsonText);
    });
}
function fetchRemoteVersion(pkgName) {
    return __awaiter(this, void 0, void 0, function* () {
        const text = strip_ansi_1.default(yield process_utils_1.exe('npm', 'view', pkgName, { silent: true }).promise);
        const rPattern = lodash_1.default.escapeRegExp(pkgName) + '@(\\S*)\\s';
        const pattern = new RegExp(rPattern);
        const m = pattern.exec(text);
        if (m) {
            return m[1];
        }
        throw new Error(`Failed to fetch dependency latest version (pattern: ${pattern}) from message:\n ${text}`);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLWFkZC1wYWNrYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdHMvY21kL2NsaS1hZGQtcGFja2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpRkFBMkQ7QUFDM0QsbUNBQTRDO0FBQzVDLHFFQUFnRTtBQUNoRSxvREFBcUM7QUFDckMsNENBQW9CO0FBQ3BCLGdEQUF3QjtBQUN4QixtQ0FBaUM7QUFDakMsb0RBQXVCO0FBQ3ZCLGtEQUEwQjtBQUMxQiw0REFBbUM7QUFDbkMsd0NBQXVDO0FBQ3ZDLDRFQUE0RTtBQUM1RSxnREFBMkg7QUFDM0gsTUFBTSxHQUFHLEdBQUcsa0JBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0FBRS9DLFNBQXNCLGVBQWUsQ0FBQyxRQUFrQixFQUFFLEVBQVcsRUFBRSxHQUFHLEdBQUcsS0FBSzs7UUFDaEYsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUN6QixNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7U0FDN0Q7UUFDRCxJQUFJLE1BQU0sR0FBYSxFQUFFLENBQUM7UUFDMUIsSUFBSSxFQUFFLElBQUksSUFBSSxFQUFFO1lBQ2QsSUFBSSxzQkFBYyxFQUFFLEVBQUU7Z0JBQ3BCLEVBQUUsR0FBRyxlQUFRLENBQUMsT0FBTyxDQUFDO2FBQ3ZCO2lCQUFNO2dCQUNMLE1BQU0sRUFBRSxHQUFHLGdCQUFRLEVBQUUsQ0FBQyxhQUFhLENBQUM7Z0JBQ3BDLElBQUksRUFBRSxJQUFJLElBQUksRUFBRTtvQkFDZCxNQUFNLElBQUksS0FBSyxDQUFDLHdGQUF3Rjt3QkFDdEcsc0ZBQXNGO3dCQUN0RixvQ0FBb0MsQ0FBQyxDQUFDO2lCQUN6QztnQkFDRCxFQUFFLEdBQUcsb0JBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUN2QjtZQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDakI7YUFBTTtZ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QUFPLENBQUMsQ0FBQztRQUNsRixNQUFNLFFBQVEsR0FBRyxnQkFBQyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxZQUFZLENBQUM7UUFDeEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckMsTUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QixJQUFJLENBQUMsRUFBRTtZQUNMLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2I7UUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLHVEQUF1RCxPQUFPLHFCQUFxQixJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzdHLENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXJzZSwge09iamVjdEFzdH0gZnJvbSAnLi4vdXRpbHMvanNvbi1zeW5jLXBhcnNlcic7XG5pbXBvcnQge2ZpbmRQYWNrYWdlc0J5TmFtZXN9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHJlcGxhY2VUZXh0LCB7UmVwbGFjZW1lbnRJbmZ9IGZyb20gJy4uL3V0aWxzL3BhdGNoLXRleHQnO1xuaW1wb3J0IHtleGV9IGZyb20gJy4uL3Byb2Nlc3MtdXRpbHMnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtnZXRMb2dnZXJ9IGZyb20gJ2xvZzRqcyc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbmltcG9ydCBzdHJpcEFuc2kgZnJvbSAnc3RyaXAtYW5zaSc7XG5pbXBvcnQge3BsaW5rRW52fSBmcm9tICcuLi91dGlscy9taXNjJztcbmltcG9ydCB7d29ya3NwYWNlc09mRGVwZW5kZW5jaWVzfSBmcm9tICcuLi9wYWNrYWdlLW1nci9wYWNrYWdlLWxpc3QtaGVscGVyJztcbmltcG9ydCB7YWN0aW9uRGlzcGF0Y2hlciBhcyBwa2dEaXNwYXRlciwgaXNDd2RXb3Jrc3BhY2UsIGdldFN0YXRlLCB3b3Jrc3BhY2VEaXIsIHdvcmtzcGFjZUtleX0gZnJvbSAnLi4vcGFja2FnZS1tZ3IvaW5kZXgnO1xuY29uc3QgbG9nID0gZ2V0TG9nZ2VyKCdwbGluay5jbGktYWRkLXBhY2thZ2UnKTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFkZERlcGVuZGVuY3lUbyhwYWNrYWdlczogc3RyaW5nW10sIHRvPzogc3RyaW5nLCBkZXYgPSBmYWxzZSkge1xuICBpZiAocGFja2FnZXMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBdCBsZWFzdCBzcGVjaWZ5IG9uZSBkZXBlbmRlbmN5IGFyZ3VtZW50Jyk7XG4gIH1cbiAgbGV0IHdzRGlyczogc3RyaW5nW10gPSBbXTtcbiAgaWYgKHRvID09IG51bGwpIHtcbiAgICBpZiAoaXNDd2RXb3Jrc3BhY2UoKSkge1xuICAgICAgdG8gPSBwbGlua0Vudi53b3JrRGlyO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB3cyA9IGdldFN0YXRlKCkuY3VycldvcmtzcGFjZTtcbiAgICAgIGlmICh3cyA9PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gd29ya3RyZWUgc3BhY2UgaXMgZm91bmQgZm9yIGN1cnJlbnQgZGlyZWN0b3J5LCBhbmQgbm8gXCItLXRvXCIgb3B0aW9uIGlzIHNwZWNpZmllZC5cXG4nICtcbiAgICAgICAgICAnRWl0aGVyIGV4ZWN1dGUgdGhpcyBjb21tYW5kIHdpdGggb3B0aW9uIFwiLS10byA8cGtnIG5hbWUgfCBwa2cgZGlyIHwgd29ya3RyZWUgc3BhY2U+XCInICtcbiAgICAgICAgICAnb3IgaW4gYSB3b3Jrc3RyZWUgc3BhY2UgZGlyZWN0b3J5LicpO1xuICAgICAgfVxuICAgICAgdG8gPSB3b3Jrc3BhY2VEaXIod3MpO1xuICAgIH1cbiAgICB3c0RpcnMucHVzaCh0byk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdHJ5V3NLZXkgPSB3b3Jrc3BhY2VLZXkodG8pO1xuICAgIGlmIChnZXRTdGF0ZSgpLndvcmtzcGFjZXMuaGFzKHRyeVdzS2V5KSkge1xuICAgICAgd3NEaXJzLnB1c2goUGF0aC5yZXNvbHZlKHRvKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IFtmb3VuZFBrZ10gPSBmaW5kUGFja2FnZXNCeU5hbWVzKFt0b10pO1xuICAgICAgaWYgKGZvdW5kUGtnID09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBtYXRjaGVkIGxpbmtlZCBwYWNrYWdlIG9yIHdvcmt0cmVlIHNwYWNlIGlzIGZvdW5kIGZvciBvcHRpb24gXCItLXRvXCInKTtcbiAgICAgIH1cbiAgICAgIHRvID0gZm91bmRQa2cucmVhbFBhdGg7XG4gICAgICBjb25zdCByb290RGlyID0gcGxpbmtFbnYucm9vdERpcjtcbiAgICAgIHdzRGlycyA9IEFycmF5LmZyb20od29ya3NwYWNlc09mRGVwZW5kZW5jaWVzKGZvdW5kUGtnLm5hbWUpKVxuICAgICAgICAubWFwKHdzID0+IFBhdGgucmVzb2x2ZShyb290RGlyLCB3cykpO1xuICAgIH1cbiAgfVxuICBhd2FpdCBhZGQocGFja2FnZXMsIHRvLCBkZXYpO1xuICBzZXRJbW1lZGlhdGUoKCkgPT4ge1xuICAgIGZvciAoY29uc3Qgd3NEaXIgb2Ygd3NEaXJzKSB7XG4gICAgICBwa2dEaXNwYXRlci51cGRhdGVXb3Jrc3BhY2Uoe2Rpcjogd3NEaXIsIGlzRm9yY2U6IGZhbHNlLCBjcmVhdGVIb29rOiBmYWxzZX0pO1xuICAgIH1cbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFkZChwYWNrYWdlczogc3RyaW5nW10sIHRvRGlyOiBzdHJpbmcsIGRldiA9IGZhbHNlKSB7XG4gIGNvbnN0IHRhcmdldEpzb25GaWxlID0gUGF0aC5yZXNvbHZlKHRvRGlyLCAncGFja2FnZS5qc29uJyk7XG4gIGNvbnN0IHBrZ0pzb25TdHIgPSBmcy5yZWFkRmlsZVN5bmModGFyZ2V0SnNvbkZpbGUsICd1dGYtOCcpO1xuICBjb25zdCBvYmpBc3QgPSBwYXJzZShwa2dKc29uU3RyKTtcbiAgY29uc3QgcGF0Y2hlczogUmVwbGFjZW1lbnRJbmZbXSA9IFtdO1xuXG4gIGNvbnN0IGRlcHNBc3QgPSBkZXYgPyBvYmpBc3QucHJvcGVydGllcy5maW5kKHByb3AgPT4gcHJvcC5uYW1lLnRleHQgPT09ICdcImRldkRlcGVuZGVuY2llc1wiJykgOlxuICAgIG9iakFzdC5wcm9wZXJ0aWVzLmZpbmQocHJvcCA9PiBwcm9wLm5hbWUudGV4dCA9PT0gJ1wiZGVwZW5kZW5jaWVzXCInKTtcblxuICBjb25zdCBkZXBzU2V0ID0gZGVwc0FzdCA9PSBudWxsID9cbiAgICBuZXcgU2V0PHN0cmluZz4oKSA6XG4gICAgbmV3IFNldDxzdHJpbmc+KChkZXBzQXN0LnZhbHVlIGFzIE9iamVjdEFzdCkucHJvcGVydGllcy5tYXAocHJvcCA9PiBwcm9wLm5hbWUudGV4dC5zbGljZSgxLCAtMSkpKTtcblxuICBsb2cuZGVidWcoJ2V4aXN0aW5nOicsIGRlcHNTZXQpO1xuICBjb25zdCBpbnB1dCA9IHBhY2thZ2VzLm1hcChyYXdOYW1lID0+IHtcbiAgICBjb25zdCBtID0gL14oKD86QFteL10rXFwvKT9bXi9AXSspKD86QChbXl0rKSk/JC8uZXhlYyhyYXdOYW1lKTtcbiAgICBpZiAobSkge1xuICAgICAgcmV0dXJuIFttWzFdLCBtWzJdXSBhcyBbbmFtZTogc3RyaW5nLCB2ZXI6IHN0cmluZyB8IHVuZGVmaW5lZF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBwYWNrYWdlIG5hbWU6ICR7cmF3TmFtZX0sIHZhbGlkIG5hbWUgc2hvdWxkIGJlIGxpa2UgXCI8cGtnIG5hbWU+W0A8dmVyc2lvbj5dXCJgKTtcbiAgICB9XG4gIH0pO1xuICBsZXQgaSA9IDA7XG4gIGxldCBuZXdMaW5lcyA9ICcnO1xuICBjb25zdCBzcmNQa2dzID0gQXJyYXkuZnJvbShmaW5kUGFja2FnZXNCeU5hbWVzKGlucHV0Lm1hcChpdGVtID0+IGl0ZW1bMF0pKSk7XG5cbiAgYXdhaXQgUHJvbWlzZS5hbGwoc3JjUGtncy5tYXAoYXN5bmMgcGtnID0+IHtcbiAgICBjb25zdCBpbnB1dEl0ZW0gPSBpbnB1dFtpKytdO1xuICAgIGxldCB2ZXJzaW9uID0gaW5wdXRJdGVtWzFdO1xuXG4gICAgaWYgKHBrZyA9PSBudWxsIHx8IChwa2cuanNvbi5kciA9PSBudWxsICYmIHBrZy5qc29uLnBsaW5rID09IG51bGwpKSB7XG4gICAgICBjb25zdCBuYW1lID0gaW5wdXRJdGVtWzBdO1xuICAgICAgaWYgKGRlcHNTZXQuaGFzKG5hbWUpKSB7XG4gICAgICAgIGxvZy53YXJuKGBGb3VuZCBkdXBsaWNhdGUgZXhpc3RpbmcgZGVwZW5kZW5jeSAke2NoYWxrLnJlZChuYW1lKX1gKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHZlcnNpb24gPT0gbnVsbCkge1xuICAgICAgICB2ZXJzaW9uID0gYXdhaXQgZmV0Y2hSZW1vdGVWZXJzaW9uKG5hbWUpO1xuICAgICAgfVxuICAgICAgbG9nLmluZm8oYFBhY2thZ2UgJHtuYW1lfUAke3ZlcnNpb259IGlzIG5vdCBhIGxpbmtlZCBwYWNrYWdlLCBhZGQgYXMgM3JkIHBhcnR5IGRlcGVuZGVuY3lgKTtcbiAgICAgIG5ld0xpbmVzICs9IGAgICAgXCIke25hbWV9XCI6IFwiJHt2ZXJzaW9ufVwiLFxcbmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChkZXBzU2V0Lmhhcyhwa2cubmFtZSkpIHtcbiAgICAgICAgbG9nLndhcm4oYER1cGxpY2F0ZSB3aXRoIGV4aXN0aW5nIGRlcGVuZGVuY3kgJHtjaGFsay5yZWQocGtnLm5hbWUpfWApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2cuaW5mbyhgQWRkIHBhY2thZ2UgJHtjaGFsay5jeWFuKHBrZy5uYW1lKX0gJHt2ZXJzaW9uIHx8ICcnfWApO1xuICAgICAgbmV3TGluZXMgKz0gYCAgICBcIiR7cGtnLm5hbWV9XCI6IFwiJHt2ZXJzaW9uIHx8IHBrZy5qc29uLnZlcnNpb259XCIsXFxuYDtcbiAgICB9XG4gIH0pKTtcbiAgaWYgKG5ld0xpbmVzLmxlbmd0aCA+IDApXG4gICAgbmV3TGluZXMgPSBuZXdMaW5lcy5zbGljZSgwLCBuZXdMaW5lcy5sZW5ndGggLSAyKTsgLy8gdHJpbSBsYXN0IGNvbW1hXG4gIGVsc2VcbiAgICByZXR1cm47XG4gIGxvZy5kZWJ1ZyhuZXdMaW5lcyk7XG5cbiAgaWYgKGRlcHNBc3QgPT0gbnVsbCkge1xuICAgIGNvbnN0IGxhc3QgPSBvYmpBc3QucHJvcGVydGllc1tvYmpBc3QucHJvcGVydGllcy5sZW5ndGggLSAxXTtcbiAgICBjb25zdCBwb3MgPSBsYXN0LnZhbHVlLmVuZDtcbiAgICBwYXRjaGVzLnB1c2goe3N0YXJ0OiBwb3MsIGVuZDogcG9zLFxuICAgICAgdGV4dDogYCxcXG4gIFwiJHtkZXYgPyAnZGV2RGVwZW5kZW5jaWVzJyA6ICdkZXBlbmRlbmNpZXMnfVwiOiB7XFxuJHtuZXdMaW5lc31cXG4gIH1gfSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcHJvcHMgPSAoZGVwc0FzdC52YWx1ZSBhcyBPYmplY3RBc3QpLnByb3BlcnRpZXM7XG4gICAgbGV0IHN0YXJ0ID0gMDtcbiAgICBpZiAocHJvcHMubGVuZ3RoID4gMCkge1xuICAgICAgc3RhcnQgPSBwcm9wc1twcm9wcy5sZW5ndGggLSAxXS52YWx1ZS5lbmQ7XG4gICAgICBuZXdMaW5lcyA9ICcsXFxuJyArIG5ld0xpbmVzO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydCA9IGRlcHNBc3QudmFsdWUuZW5kIC0gMTtcbiAgICB9XG5cbiAgICBwYXRjaGVzLnB1c2goe3N0YXJ0LCBlbmQ6IHN0YXJ0LCB0ZXh0OiBuZXdMaW5lc30pO1xuICB9XG5cbiAgY29uc3QgbmV3SnNvblRleHQgPSByZXBsYWNlVGV4dChwa2dKc29uU3RyLCBwYXRjaGVzKTtcbiAgbG9nLmluZm8oYFdyaXRlIGZpbGU6ICR7dGFyZ2V0SnNvbkZpbGV9OlxcbmAgKyBuZXdKc29uVGV4dCk7XG4gIGZzLndyaXRlRmlsZVN5bmModGFyZ2V0SnNvbkZpbGUsIG5ld0pzb25UZXh0KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hSZW1vdGVWZXJzaW9uKHBrZ05hbWU6IHN0cmluZykge1xuICBjb25zdCB0ZXh0ID0gc3RyaXBBbnNpKGF3YWl0IGV4ZSgnbnBtJywgJ3ZpZXcnLCBwa2dOYW1lLCB7c2lsZW50OiB0cnVlfSkucHJvbWlzZSk7XG4gIGNvbnN0IHJQYXR0ZXJuID0gXy5lc2NhcGVSZWdFeHAocGtnTmFtZSkgKyAnQChcXFxcUyopXFxcXHMnO1xuICBjb25zdCBwYXR0ZXJuID0gbmV3IFJlZ0V4cChyUGF0dGVybik7XG4gIGNvbnN0IG0gPSBwYXR0ZXJuLmV4ZWModGV4dCk7XG4gIGlmIChtKSB7XG4gICAgcmV0dXJuIG1bMV07XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggZGVwZW5kZW5jeSBsYXRlc3QgdmVyc2lvbiAocGF0dGVybjogJHtwYXR0ZXJufSkgZnJvbSBtZXNzYWdlOlxcbiAke3RleHR9YCk7XG59XG4iXX0=