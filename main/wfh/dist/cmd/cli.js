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
exports.withGlobalOptions = exports.drcpCommand = void 0;
// tslint:disable: max-line-length
const commander_1 = __importDefault(require("commander"));
const chalk_1 = __importDefault(require("chalk"));
const package_list_helper_1 = require("../package-mgr/package-list-helper");
// import Path from 'path';
const pk = require('../../../package');
// const WIDTH = 130;
const arrayOptionFn = (curr, prev) => {
    if (prev)
        prev.push(curr);
    return prev;
};
function drcpCommand(startTime) {
    return __awaiter(this, void 0, void 0, function* () {
        process.title = 'Plink - command line';
        // const {stateFactory}: typeof store = require('../store');
        yield Promise.resolve().then(() => __importStar(require('./cli-slice')));
        // stateFactory.configureStore();
        let cliExtensions;
        const program = new commander_1.default.Command('plink')
            .action(args => {
            program.outputHelp();
            // tslint:disable-next-line: no-console
            console.log('\nversion:', pk.version);
            if (cliExtensions && cliExtensions.length > 0) {
                // tslint:disable-next-line: no-console
                console.log(`Found ${cliExtensions.length} command line extension` +
                    `${cliExtensions.length > 1 ? 's' : ''}: ${cliExtensions.join(', ')}`);
            }
        });
        program.version(pk.version, '-v, --vers', 'output the current version');
        subDrcpCommand(program);
        if (process.env.PLINK_SAFE !== 'true') {
            cliExtensions = loadExtensionCommand(program);
        }
        else {
            // tslint:disable-next-line: no-console
            console.log('Value of environment varaible "PLINK_SAFE" is true, skip loading extension');
        }
        try {
            yield program.parseAsync(process.argv, { from: 'node' });
        }
        catch (e) {
            console.error(chalk_1.default.redBright(e), e.stack);
            process.exit(1);
        }
    });
}
exports.drcpCommand = drcpCommand;
function subDrcpCommand(program) {
    /**
     * command init
     */
    const initCmd = program.command('init [workspace-directory]')
        .description('Initialize workspace directory, generate basic configuration files for project and component packages')
        .option('-f, --force', 'Force run "npm install" in specific workspace directory', false)
        // .option('--yarn', 'Use Yarn to install component peer dependencies instead of using NPM', false)
        .option('--production', 'Add "--production" or "--only=prod" command line argument to "yarn/npm install"', false)
        .action((workspace) => __awaiter(this, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => __importStar(require('./cli-init')))).default(initCmd.opts(), workspace);
    }));
    withGlobalOptions(initCmd);
    /**
     * command project
     */
    program.command('project [add|remove] [project-dir...]')
        .description('Associate, disassociate or list associated project folders')
        .action((action, projectDir) => __awaiter(this, void 0, void 0, function* () {
        (yield Promise.resolve().then(() => __importStar(require('./cli-project')))).default(action, projectDir);
    }));
    /**
     * command lint
     */
    const lintCmd = program.command('lint [package...]')
        .description('source code style check')
        .option('--pj <project1,project2...>', 'lint only TS code from specific project', arrayOptionFn, [])
        .option('--fix', 'Run eslint/tslint fix, this could cause your source code being changed unexpectedly', false)
        .action((packages) => __awaiter(this, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => __importStar(require('./cli-lint')))).default(packages, lintCmd.opts());
    }));
    withGlobalOptions(lintCmd);
    lintCmd.usage(lintCmd.usage() +
        hl('\ndrcp lint --pj <project-dir..> [--fix]') + ' Lint TS files from specific project directory\n' +
        hl('\ndrcp lint <component-package..> [--fix]') + ' Lint TS files from specific component packages');
    /**
     * command clean
     */
    program.command('clean [symlink]').description('Clean whole "dist" directory or only symbolic links from node_modules')
        .action((symlink) => __awaiter(this, void 0, void 0, function* () {
        (yield Promise.resolve().then(() => __importStar(require('./cli-clean')))).default(symlink === 'symlink');
    }));
    /**
     * command ls
     */
    const listCmd = program.command('ls').alias('list')
        .option('-j, --json', 'list linked dependencies in form of JSON', false)
        .description('If you want to know how many packages will actually run, this command prints out a list and the priorities, including installed packages')
        .action(() => __awaiter(this, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => __importStar(require('./cli-ls')))).default(listCmd.opts());
    }));
    withGlobalOptions(listCmd);
    /**
     * command run
     */
    const runCmd = program.command('run <target> [arguments...]')
        .description('Run specific module\'s exported function\n')
        .action((target, args) => __awaiter(this, void 0, void 0, function* () {
        const config = yield (yield Promise.resolve().then(() => __importStar(require('../config')))).default;
        yield config.init(runCmd.opts());
        const logConfig = yield (yield Promise.resolve().then(() => __importStar(require('../log-config')))).default;
        logConfig(config());
        yield (yield Promise.resolve().then(() => __importStar(require('../package-runner')))).runSinglePackage({ target, args });
    }));
    withGlobalOptions(runCmd);
    runCmd.usage(runCmd.usage() + '\n' + chalk_1.default.green('plink run <target> [arguments...]\n') +
        `e.g.\n  ${chalk_1.default.green('plink run forbar-package/dist/file#function argument1 argument2...')}\n` +
        'execute exported function of TS/JS file from specific package or path\n\n' +
        '<target> - JS or TS file module path which can be resolved by Node.js (ts-node) followed by "#" and exported function name,\n' +
        'e.g. \n' +
        chalk_1.default.green('package-name/dist/foobar.js#myFunction') +
        ', function can be async which returns Promise\n' +
        chalk_1.default.green('node_modules/package-dir/dist/foobar.ts#myFunction') +
        ', relative or absolute path\n');
    /**
     * tsc command
     */
    const tscCmd = program.command('tsc [package...]')
        .description('Run Typescript compiler')
        .option('-w, --watch', 'Typescript compiler watch mode', false)
        .option('--pj, --project <project-dir,...>', 'Compile only specific project directory', (v, prev) => {
        prev.push(...v.split(','));
        return prev;
    }, [])
        // .option('--ws,--workspace <workspace-dir>', 'only include those linked packages which are dependency of specific workspaces',
        //   arrayOptionFn, [])
        .option('--jsx', 'includes TSX file', false)
        .option('--ed, --emitDeclarationOnly', 'Typescript compiler option: --emitDeclarationOnly.\nOnly emit ‘.d.ts’ declaration files.', false)
        .option('--source-map <inline|file>', 'Source map style: "inline" or "file"', 'inline')
        .action((packages) => __awaiter(this, void 0, void 0, function* () {
        const opt = tscCmd.opts();
        const config = yield (yield Promise.resolve().then(() => __importStar(require('../config')))).default;
        yield config.init(runCmd.opts());
        const logConfig = yield (yield Promise.resolve().then(() => __importStar(require('../log-config')))).default;
        logConfig(config());
        const tsCmd = yield Promise.resolve().then(() => __importStar(require('../ts-cmd')));
        yield tsCmd.tsc({
            package: packages,
            project: opt.project,
            watch: opt.watch,
            sourceMap: opt.sourceMap,
            jsx: opt.jsx,
            ed: opt.emitDeclarationOnly
        });
    }));
    withGlobalOptions(tscCmd);
    tscCmd.usage(tscCmd.usage() + '\n' + 'Run gulp-typescript to compile Node.js side Typescript files.\n\n' +
        'It compiles \n  "<package-directory>/ts/**/*.ts" to "<package-directory>/dist",\n' +
        '  or\n  "<package-directory>/isom/**/*.ts" to "<package-directory>/isom"\n for all @wfh packages.\n' +
        'I suggest to put Node.js side TS code in directory `ts`, and isomorphic TS code (meaning it runs in ' +
        'both Node.js and Browser) in directory `isom`.\n' +
        hlDesc('plink tsc\n') + 'Compile linked packages that are dependencies of current workspace (you shall run this command only in a workspace directory)\n' +
        hlDesc('plink tsc <package..>\n') + ' Only compile specific packages by providing package name or short name\n' +
        hlDesc('plink tsc [package...] -w\n') + ' Watch packages change and compile when new typescript file is changed or created\n\n');
    /**
     * Bump command
     */
    const bumpCmd = program.command('bump [package...]')
        .description('bump package.json version number for specific package, same as "npm version" does')
        .option('--pj, --project <project-dir,...>', 'only bump component packages from specific project directory', (value, prev) => {
        prev.push(...value.split(','));
        return prev;
    }, [])
        .option('-i, --incre-version <major | minor | patch | premajor | preminor | prepatch | prerelease>', 'version increment, valid values are: major, minor, patch, prerelease', 'patch')
        .action((packages) => __awaiter(this, void 0, void 0, function* () {
        (yield Promise.resolve().then(() => __importStar(require('./cli-bump')))).default(Object.assign(Object.assign({}, bumpCmd.opts()), { packages }));
    }));
    withGlobalOptions(bumpCmd);
    // bumpCmd.usage(bumpCmd.usage() + '\n' + hl('plink bump <package> ...') + ' to recursively bump package.json from multiple directories\n' +
    //   hl('plink bump <dir> -i minor') + ' to bump minor version number, default is patch number');
    /**
     * Pack command
     */
    const packCmd = program.command('pack [package...]')
        .description('npm pack every pakage into tarball files')
        .option('--dir <package directory>', 'pack packages by specifying directories', arrayOptionFn, [])
        .option('-w,--workspace <workspace-dir>', 'pack packages which are linked as dependency of specific workspaces', arrayOptionFn, [])
        .option('--pj, --project <project-dir>', 'project directories to be looked up for all packages which need to be packed to tarball files', arrayOptionFn, [])
        .action((packages) => __awaiter(this, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => __importStar(require('./cli-pack')))).pack(Object.assign(Object.assign({}, packCmd.opts()), { packages }));
    }));
    withGlobalOptions(packCmd);
    packCmd.usage(packCmd.usage() + '\nBy default, run "npm pack" for each linked package which are dependencies of current workspace');
    /**
     * Pack command
     */
    const publishCmd = program.command('publish [package...]')
        .description('run npm publish')
        .option('--dir <package directory>', 'publish packages by specifying directories', arrayOptionFn, [])
        .option('--pj, --project <project-dir,...>', 'project directories to be looked up for all packages which need to be packed to tarball files', (value, prev) => {
        prev.push(...value.split(','));
        return prev;
    }, [])
        .option('-w,--workspace <workspace-dir>', 'publish packages which are linked as dependency of specific workspaces', arrayOptionFn, [])
        .option('--public', 'same as "npm publish" command option "--access public"', false)
        .action((packages) => __awaiter(this, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => __importStar(require('./cli-pack')))).publish(Object.assign(Object.assign({}, publishCmd.opts()), { packages }));
    }));
    withGlobalOptions(publishCmd);
}
function loadExtensionCommand(program) {
    // const {getState} = require('./cli-slice') as typeof cliStore;
    const { getState: getPkgState, workspaceKey } = require('../package-mgr');
    const ws = getPkgState().workspaces.get(workspaceKey(process.cwd()));
    if (ws == null)
        return [];
    const origPgmCommand = program.command;
    let filePath = null;
    // const cmdInfoPacks = new Array<Parameters<typeof cliStore.cliActionDispatcher.updateLoadedCmd>[0] extends (infer I)[] ? I : unknown>(1);
    const loadedCmdMap = new Map();
    program.command = function (nameAndArgs, ...restArgs) {
        const cmdName = /^\S+/.exec(nameAndArgs)[0];
        if (loadedCmdMap.has(cmdName)) {
            throw new Error(`Conflict command name ${cmdName} from extensions "${filePath}" and "${loadedCmdMap.get(cmdName)}"`);
        }
        loadedCmdMap.set(cmdName, filePath);
        // cmdInfoPacks[0] = {cmd: cmdName, file: filePath!};
        // cliStore.cliActionDispatcher.updateLoadedCmd(cmdInfoPacks);
        // tslint:disable-next-line: no-console
        // console.log(`Loading command "${cmdName}" from extension ${filePath}`);
        return origPgmCommand.call(this, nameAndArgs, ...restArgs);
    };
    const availables = [];
    for (const pk of package_list_helper_1.packages4Workspace()) {
        const dr = pk.json.dr;
        if (dr == null || dr.cli == null)
            continue;
        const [pkgFilePath, funcName] = dr.cli.split('#');
        // if (!_.has(ws.originInstallJson.dependencies, extension.pkName) && !_.has(ws.originInstallJson.devDependencies, extension.pkName))
        //   continue;
        availables.push(pk.name);
        try {
            filePath = require.resolve(pk.name + '/' + pkgFilePath);
        }
        catch (e) { }
        if (filePath != null) {
            try {
                const subCmdFactory = funcName ? require(filePath)[funcName] :
                    require(filePath);
                subCmdFactory(program, withGlobalOptions);
            }
            catch (e) {
                // tslint:disable-next-line: no-console
                console.error('Failed to load command line extension in package ' + pk.name, e);
            }
        }
    }
    return availables;
}
function hl(text) {
    return chalk_1.default.green(text);
}
function hlDesc(text) {
    return chalk_1.default.green(text);
}
function withGlobalOptions(program) {
    program.option('-c, --config <config-file>', hlDesc('Read config files, if there are multiple files, the latter one overrides previous one'), (value, prev) => { prev.push(...value.split(',')); return prev; }, [])
        .option('--prop <property-path=value as JSON | literal>', hlDesc('<property-path>=<value as JSON | literal> ... directly set configuration properties, property name is lodash.set() path-like string\n e.g.\n') +
        '--prop port=8080 --prop devMode=false --prop @wfh/foobar.api=http://localhost:8080\n' +
        '--prop port=8080 --prop devMode=false --prop @wfh/foobar.api=http://localhost:8080\n' +
        '--prop arraylike.prop[0]=foobar\n' +
        '--prop ["@wfh/foo.bar","prop",0]=true', arrayOptionFn, []);
    // .option('--log-stat', hlDesc('Print internal Redux state/actions for debug'));
    return program;
}
exports.withGlobalOptions = withGlobalOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdHMvY21kL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0NBQWtDO0FBQ2xDLDBEQUFrQztBQUNsQyxrREFBMEI7QUFJMUIsNEVBQXNFO0FBRXRFLDJCQUEyQjtBQUMzQixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUN2QyxxQkFBcUI7QUFFckIsTUFBTSxhQUFhLEdBQUcsQ0FBQyxJQUFZLEVBQUUsSUFBMEIsRUFBRSxFQUFFO0lBQ2pFLElBQUksSUFBSTtRQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEIsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDLENBQUM7QUFFRixTQUFzQixXQUFXLENBQUMsU0FBaUI7O1FBQ2pELE9BQU8sQ0FBQyxLQUFLLEdBQUcsc0JBQXNCLENBQUM7UUFDdkMsNERBQTREO1FBQzVELHdEQUFhLGFBQWEsR0FBQyxDQUFDO1FBQzVCLGlDQUFpQztRQUdqQyxJQUFJLGFBQW1DLENBQUM7UUFDeEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxtQkFBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7YUFDN0MsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2IsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3JCLHVDQUF1QztZQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdEMsSUFBSSxhQUFhLElBQUksYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQzdDLHVDQUF1QztnQkFDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLGFBQWEsQ0FBQyxNQUFNLHlCQUF5QjtvQkFDbEUsR0FBRyxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxD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QUMsSUFBSSxDQUFDLENBQUM7QUFDM0IsQ0FBQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLE9BQTBCO0lBQzFELE9BQU8sQ0FBQyxNQUFNLENBQUMsNEJBQTRCLEVBQ3pDLE1BQU0sQ0FBQyx1RkFBdUYsQ0FBQyxFQUMvRixDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFBLENBQUMsRUFBRSxFQUFjLENBQUM7U0FDbEYsTUFBTSxDQUFDLGdEQUFnRCxFQUN0RCxNQUFNLENBQUMsOElBQThJLENBQUM7UUFDdEosc0ZBQXNGO1FBQ3RGLHNGQUFzRjtRQUN0RixtQ0FBbUM7UUFDbkMsdUNBQXVDLEVBQ3ZDLGFBQWEsRUFBRSxFQUFjLENBQUMsQ0FBQztJQUNqQyxpRkFBaUY7SUFFakYsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQztBQWRELDhDQWNDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gdHNsaW50OmRpc2FibGU6IG1heC1saW5lLWxlbmd0aFxuaW1wb3J0IGNvbW1hbmRlciBmcm9tICdjb21tYW5kZXInO1xuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbi8vIGltcG9ydCAqIGFzIHN0b3JlIGZyb20gJy4uL3N0b3JlJztcbmltcG9ydCAqIGFzIHRwIGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0ICogYXMgcGtnTWdyIGZyb20gJy4uL3BhY2thZ2UtbWdyJztcbmltcG9ydCB7cGFja2FnZXM0V29ya3NwYWNlfSBmcm9tICcuLi9wYWNrYWdlLW1nci9wYWNrYWdlLWxpc3QtaGVscGVyJztcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbi8vIGltcG9ydCBQYXRoIGZyb20gJ3BhdGgnO1xuY29uc3QgcGsgPSByZXF1aXJlKCcuLi8uLi8uLi9wYWNrYWdlJyk7XG4vLyBjb25zdCBXSURUSCA9IDEzMDtcblxuY29uc3QgYXJyYXlPcHRpb25GbiA9IChjdXJyOiBzdHJpbmcsIHByZXY6IHN0cmluZ1tdIHwgdW5kZWZpbmVkKSA9PiB7XG4gIGlmIChwcmV2KVxuICAgIHByZXYucHVzaChjdXJyKTtcbiAgcmV0dXJuIHByZXY7XG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZHJjcENvbW1hbmQoc3RhcnRUaW1lOiBudW1iZXIpIHtcbiAgcHJvY2Vzcy50aXRsZSA9ICdQbGluayAtIGNvbW1hbmQgbGluZSc7XG4gIC8vIGNvbnN0IHtzdGF0ZUZhY3Rvcnl9OiB0eXBlb2Ygc3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZScpO1xuICBhd2FpdCBpbXBvcnQoJy4vY2xpLXNsaWNlJyk7XG4gIC8vIHN0YXRlRmFjdG9yeS5jb25maWd1cmVTdG9yZSgpO1xuXG5cbiAgbGV0IGNsaUV4dGVuc2lvbnM6IHN0cmluZ1tdIHwgdW5kZWZpbmVkO1xuICBjb25zdCBwcm9ncmFtID0gbmV3IGNvbW1hbmRlci5Db21tYW5kKCdwbGluaycpXG4gIC5hY3Rpb24oYXJncyA9PiB7XG4gICAgcHJvZ3JhbS5vdXRwdXRIZWxwKCk7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2coJ1xcbnZlcnNpb246JywgcGsudmVyc2lvbik7XG4gICAgaWYgKGNsaUV4dGVuc2lvbnMgJiYgY2xpRXh0ZW5zaW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUubG9nKGBGb3VuZCAke2NsaUV4dGVuc2lvbnMubGVuZ3RofSBjb21tYW5kIGxpbmUgZXh0ZW5zaW9uYCArXG4gICAgICBgJHtjbGlFeHRlbnNpb25zLmxlbmd0aCA+IDEgPyAncycgOiAnJ306ICR7Y2xpRXh0ZW5zaW9ucy5qb2luKCcsICcpfWApO1xuICAgIH1cbiAgfSk7XG5cbiAgcHJvZ3JhbS52ZXJzaW9uKHBrLnZlcnNpb24sICctdiwgLS12ZXJzJywgJ291dHB1dCB0aGUgY3VycmVudCB2ZXJzaW9uJyk7XG4gIHN1YkRyY3BDb21tYW5kKHByb2dyYW0pO1xuICBpZiAocHJvY2Vzcy5lbnYuUExJTktfU0FGRSAhPT0gJ3RydWUnKSB7XG4gICAgY2xpRXh0ZW5zaW9ucyA9IGxvYWRFeHRlbnNpb25Db21tYW5kKHByb2dyYW0pO1xuICB9IGVsc2Uge1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKCdWYWx1ZSBvZiBlbnZpcm9ubWVudCB2YXJhaWJsZSBcIlBMSU5LX1NBRkVcIiBpcyB0cnVlLCBza2lwIGxvYWRpbmcgZXh0ZW5zaW9uJyk7XG4gIH1cblxuICB0cnkge1xuICAgIGF3YWl0IHByb2dyYW0ucGFyc2VBc3luYyhwcm9jZXNzLmFyZ3YsIHtmcm9tOiAnbm9kZSd9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoY2hhbGsucmVkQnJpZ2h0KGUpLCBlLnN0YWNrKTtcbiAgICBwcm9jZXNzLmV4aXQoMSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3ViRHJjcENvbW1hbmQocHJvZ3JhbTogY29tbWFuZGVyLkNvbW1hbmQpIHtcbiAgLyoqXG4gICAqIGNvbW1hbmQgaW5pdFxuICAgKi9cbiAgY29uc3QgaW5pdENtZCA9IHByb2dyYW0uY29tbWFuZCgnaW5pdCBbd29ya3NwYWNlLWRpcmVjdG9yeV0nKVxuICAuZGVzY3JpcHRpb24oJ0luaXRpYWxpemUgd29ya3NwYWNlIGRpcmVjdG9yeSwgZ2VuZXJhdGUgYmFzaWMgY29uZmlndXJhdGlvbiBmaWxlcyBmb3IgcHJvamVjdCBhbmQgY29tcG9uZW50IHBhY2thZ2VzJylcbiAgLm9wdGlvbignLWYsIC0tZm9yY2UnLCAnRm9yY2UgcnVuIFwibnBtIGluc3RhbGxcIiBpbiBzcGVjaWZpYyB3b3Jrc3BhY2UgZGlyZWN0b3J5JywgZmFsc2UpXG4gIC8vIC5vcHRpb24oJy0teWFybicsICdVc2UgWWFybiB0byBpbnN0YWxsIGNvbXBvbmVudCBwZWVyIGRlcGVuZGVuY2llcyBpbnN0ZWFkIG9mIHVzaW5nIE5QTScsIGZhbHNlKVxuICAub3B0aW9uKCctLXByb2R1Y3Rpb24nLCAnQWRkIFwiLS1wcm9kdWN0aW9uXCIgb3IgXCItLW9ubHk9cHJvZFwiIGNvbW1hbmQgbGluZSBhcmd1bWVudCB0byBcInlhcm4vbnBtIGluc3RhbGxcIicsIGZhbHNlKVxuICAuYWN0aW9uKGFzeW5jICh3b3Jrc3BhY2U6IHN0cmluZykgPT4ge1xuICAgIGF3YWl0IChhd2FpdCBpbXBvcnQoJy4vY2xpLWluaXQnKSkuZGVmYXVsdChpbml0Q21kLm9wdHMoKSBhcyBhbnksIHdvcmtzcGFjZSk7XG4gIH0pO1xuICB3aXRoR2xvYmFsT3B0aW9ucyhpbml0Q21kKTtcblxuICAvKipcbiAgICogY29tbWFuZCBwcm9qZWN0XG4gICAqL1xuICBwcm9ncmFtLmNvbW1hbmQoJ3Byb2plY3QgW2FkZHxyZW1vdmVdIFtwcm9qZWN0LWRpci4uLl0nKVxuICAuZGVzY3JpcHRpb24oJ0Fzc29jaWF0ZSwgZGlzYXNzb2NpYXRlIG9yIGxpc3QgYXNzb2NpYXRlZCBwcm9qZWN0IGZvbGRlcnMnKVxuICAuYWN0aW9uKGFzeW5jIChhY3Rpb246ICdhZGQnfCdyZW1vdmUnfHVuZGVmaW5lZCwgcHJvamVjdERpcjogc3RyaW5nW10pID0+IHtcbiAgICAoYXdhaXQgaW1wb3J0KCcuL2NsaS1wcm9qZWN0JykpLmRlZmF1bHQoYWN0aW9uLCBwcm9qZWN0RGlyKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIGNvbW1hbmQgbGludFxuICAgKi9cbiAgY29uc3QgbGludENtZCA9IHByb2dyYW0uY29tbWFuZCgnbGludCBbcGFja2FnZS4uLl0nKVxuICAuZGVzY3JpcHRpb24oJ3NvdXJjZSBjb2RlIHN0eWxlIGNoZWNrJylcbiAgLm9wdGlvbignLS1waiA8cHJvamVjdDEscHJvamVjdDIuLi4+JywgJ2xpbnQgb25seSBUUyBjb2RlIGZyb20gc3BlY2lmaWMgcHJvamVjdCcsIGFycmF5T3B0aW9uRm4sIFtdKVxuICAub3B0aW9uKCctLWZpeCcsICdSdW4gZXNsaW50L3RzbGludCBmaXgsIHRoaXMgY291bGQgY2F1c2UgeW91ciBzb3VyY2UgY29kZSBiZWluZyBjaGFuZ2VkIHVuZXhwZWN0ZWRseScsIGZhbHNlKVxuICAuYWN0aW9uKGFzeW5jIHBhY2thZ2VzID0+IHtcbiAgICBhd2FpdCAoYXdhaXQgaW1wb3J0KCcuL2NsaS1saW50JykpLmRlZmF1bHQocGFja2FnZXMsIGxpbnRDbWQub3B0cygpIGFzIGFueSk7XG4gIH0pO1xuICB3aXRoR2xvYmFsT3B0aW9ucyhsaW50Q21kKTtcbiAgbGludENtZC51c2FnZShsaW50Q21kLnVzYWdlKCkgK1xuICAgIGhsKCdcXG5kcmNwIGxpbnQgLS1waiA8cHJvamVjdC1kaXIuLj4gWy0tZml4XScpICsgJyBMaW50IFRTIGZpbGVzIGZyb20gc3BlY2lmaWMgcHJvamVjdCBkaXJlY3RvcnlcXG4nICtcbiAgICBobCgnXFxuZHJjcCBsaW50IDxjb21wb25lbnQtcGFja2FnZS4uPiBbLS1maXhdJykgKyAnIExpbnQgVFMgZmlsZXMgZnJvbSBzcGVjaWZpYyBjb21wb25lbnQgcGFja2FnZXMnKTtcblxuICAvKipcbiAgICogY29tbWFuZCBjbGVhblxuICAgKi9cbiAgcHJvZ3JhbS5jb21tYW5kKCdjbGVhbiBbc3ltbGlua10nKS5kZXNjcmlwdGlvbignQ2xlYW4gd2hvbGUgXCJkaXN0XCIgZGlyZWN0b3J5IG9yIG9ubHkgc3ltYm9saWMgbGlua3MgZnJvbSBub2RlX21vZHVsZXMnKVxuICAuYWN0aW9uKGFzeW5jIChzeW1saW5rOiAnc3ltbGluaycgfCB1bmRlZmluZWQpID0+IHtcbiAgICAoYXdhaXQgaW1wb3J0KCcuL2NsaS1jbGVhbicpKS5kZWZhdWx0KHN5bWxpbmsgPT09ICdzeW1saW5rJyk7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBjb21tYW5kIGxzXG4gICAqL1xuICBjb25zdCBsaXN0Q21kID0gcHJvZ3JhbS5jb21tYW5kKCdscycpLmFsaWFzKCdsaXN0JylcbiAgLm9wdGlvbignLWosIC0tanNvbicsICdsaXN0IGxpbmtlZCBkZXBlbmRlbmNpZXMgaW4gZm9ybSBvZiBKU09OJywgZmFsc2UpXG4gIC5kZXNjcmlwdGlvbignSWYgeW91IHdhbnQgdG8ga25vdyBob3cgbWFueSBwYWNrYWdlcyB3aWxsIGFjdHVhbGx5IHJ1biwgdGhpcyBjb21tYW5kIHByaW50cyBvdXQgYSBsaXN0IGFuZCB0aGUgcHJpb3JpdGllcywgaW5jbHVkaW5nIGluc3RhbGxlZCBwYWNrYWdlcycpXG4gIC5hY3Rpb24oYXN5bmMgKCkgPT4ge1xuICAgIGF3YWl0IChhd2FpdCBpbXBvcnQoJy4vY2xpLWxzJykpLmRlZmF1bHQobGlzdENtZC5vcHRzKCkgYXMgYW55KTtcbiAgfSk7XG4gIHdpdGhHbG9iYWxPcHRpb25zKGxpc3RDbWQpO1xuXG4gIC8qKlxuICAgKiBjb21tYW5kIHJ1blxuICAgKi9cbiAgY29uc3QgcnVuQ21kID0gcHJvZ3JhbS5jb21tYW5kKCdydW4gPHRhcmdldD4gW2FyZ3VtZW50cy4uLl0nKVxuICAuZGVzY3JpcHRpb24oJ1J1biBzcGVjaWZpYyBtb2R1bGVcXCdzIGV4cG9ydGVkIGZ1bmN0aW9uXFxuJylcbiAgLmFjdGlvbihhc3luYyAodGFyZ2V0OiBzdHJpbmcsIGFyZ3M6IHN0cmluZ1tdKSA9PiB7XG4gICAgY29uc3QgY29uZmlnID0gYXdhaXQgKGF3YWl0IGltcG9ydCgnLi4vY29uZmlnJykpLmRlZmF1bHQ7XG4gICAgYXdhaXQgY29uZmlnLmluaXQocnVuQ21kLm9wdHMoKSBhcyB0cC5HbG9iYWxPcHRpb25zKTtcbiAgICBjb25zdCBsb2dDb25maWcgPSBhd2FpdCAoYXdhaXQgaW1wb3J0KCcuLi9sb2ctY29uZmlnJykpLmRlZmF1bHQ7XG4gICAgbG9nQ29uZmlnKGNvbmZpZygpKTtcbiAgICBhd2FpdCAoYXdhaXQgaW1wb3J0KCcuLi9wYWNrYWdlLXJ1bm5lcicpKS5ydW5TaW5nbGVQYWNrYWdlKHt0YXJnZXQsIGFyZ3N9KTtcbiAgfSk7XG4gIHdpdGhHbG9iYWxPcHRpb25zKHJ1bkNtZCk7XG4gIHJ1bkNtZC51c2FnZShydW5DbWQudXNhZ2UoKSArICdcXG4nICsgY2hhbGsuZ3JlZW4oJ3BsaW5rIHJ1biA8dGFyZ2V0PiBbYXJndW1lbnRzLi4uXVxcbicpICtcbiAgYGUuZy5cXG4gICR7Y2hhbGsuZ3JlZW4oJ3BsaW5rIHJ1biBmb3JiYXItcGFja2FnZS9kaXN0L2ZpbGUjZnVuY3Rpb24gYXJndW1lbnQxIGFyZ3VtZW50Mi4uLicpfVxcbmAgK1xuICAnZXhlY3V0ZSBleHBvcnRlZCBmdW5jdGlvbiBvZiBUUy9KUyBmaWxlIGZyb20gc3BlY2lmaWMgcGFja2FnZSBvciBwYXRoXFxuXFxuJyArXG4gICc8dGFyZ2V0PiAtIEpTIG9yIFRTIGZpbGUgbW9kdWxlIHBhdGggd2hpY2ggY2FuIGJlIHJlc29sdmVkIGJ5IE5vZGUuanMgKHRzLW5vZGUpIGZvbGxvd2VkIGJ5IFwiI1wiIGFuZCBleHBvcnRlZCBmdW5jdGlvbiBuYW1lLFxcbicgK1xuICAnZS5nLiBcXG4nICtcbiAgY2hhbGsuZ3JlZW4oJ3BhY2thZ2UtbmFtZS9kaXN0L2Zvb2Jhci5qcyNteUZ1bmN0aW9uJykgK1xuICAnLCBmdW5jdGlvbiBjYW4gYmUgYXN5bmMgd2hpY2ggcmV0dXJucyBQcm9taXNlXFxuJyArXG4gIGNoYWxrLmdyZWVuKCdub2RlX21vZHVsZXMvcGFja2FnZS1kaXIvZGlzdC9mb29iYXIudHMjbXlGdW5jdGlvbicpICtcbiAgJywgcmVsYXRpdmUgb3IgYWJzb2x1dGUgcGF0aFxcbicpO1xuXG4gIC8qKlxuICAgKiB0c2MgY29tbWFuZFxuICAgKi9cbiAgY29uc3QgdHNjQ21kID0gcHJvZ3JhbS5jb21tYW5kKCd0c2MgW3BhY2thZ2UuLi5dJylcbiAgLmRlc2NyaXB0aW9uKCdSdW4gVHlwZXNjcmlwdCBjb21waWxlcicpXG4gIC5vcHRpb24oJy13LCAtLXdhdGNoJywgJ1R5cGVzY3JpcHQgY29tcGlsZXIgd2F0Y2ggbW9kZScsIGZhbHNlKVxuICAub3B0aW9uKCctLXBqLCAtLXByb2plY3QgPHByb2plY3QtZGlyLC4uLj4nLCAnQ29tcGlsZSBvbmx5IHNwZWNpZmljIHByb2plY3QgZGlyZWN0b3J5JywgKHYsIHByZXYpID0+IHtcbiAgICBwcmV2LnB1c2goLi4udi5zcGxpdCgnLCcpKTsgcmV0dXJuIHByZXY7XG4gIH0sIFtdIGFzIHN0cmluZ1tdKVxuICAvLyAub3B0aW9uKCctLXdzLC0td29ya3NwYWNlIDx3b3Jrc3BhY2UtZGlyPicsICdvbmx5IGluY2x1ZGUgdGhvc2UgbGlua2VkIHBhY2thZ2VzIHdoaWNoIGFyZSBkZXBlbmRlbmN5IG9mIHNwZWNpZmljIHdvcmtzcGFjZXMnLFxuICAvLyAgIGFycmF5T3B0aW9uRm4sIFtdKVxuICAub3B0aW9uKCctLWpzeCcsICdpbmNsdWRlcyBUU1ggZmlsZScsIGZhbHNlKVxuICAub3B0aW9uKCctLWVkLCAtLWVtaXREZWNsYXJhdGlvbk9ubHknLCAnVHlwZXNjcmlwdCBjb21waWxlciBvcHRpb246IC0tZW1pdERlY2xhcmF0aW9uT25seS5cXG5Pbmx5IGVtaXQg4oCYLmQudHPigJkgZGVjbGFyYXRpb24gZmlsZXMuJywgZmFsc2UpXG4gIC5vcHRpb24oJy0tc291cmNlLW1hcCA8aW5saW5lfGZpbGU+JywgJ1NvdXJjZSBtYXAgc3R5bGU6IFwiaW5saW5lXCIgb3IgXCJmaWxlXCInLCAnaW5saW5lJylcbiAgLmFjdGlvbihhc3luYyAocGFja2FnZXM6IHN0cmluZ1tdKSA9PiB7XG4gICAgY29uc3Qgb3B0ID0gdHNjQ21kLm9wdHMoKTtcblxuICAgIGNvbnN0IGNvbmZpZyA9IGF3YWl0IChhd2FpdCBpbXBvcnQoJy4uL2NvbmZpZycpKS5kZWZhdWx0O1xuICAgIGF3YWl0IGNvbmZpZy5pbml0KHJ1bkNtZC5vcHRzKCkgYXMgdHAuR2xvYmFsT3B0aW9ucyk7XG4gICAgY29uc3QgbG9nQ29uZmlnID0gYXdhaXQgKGF3YWl0IGltcG9ydCgnLi4vbG9nLWNvbmZpZycpKS5kZWZhdWx0O1xuICAgIGxvZ0NvbmZpZyhjb25maWcoKSk7XG4gICAgY29uc3QgdHNDbWQgPSBhd2FpdCBpbXBvcnQoJy4uL3RzLWNtZCcpO1xuICAgIGF3YWl0IHRzQ21kLnRzYyh7XG4gICAgICBwYWNrYWdlOiBwYWNrYWdlcyxcbiAgICAgIHByb2plY3Q6IG9wdC5wcm9qZWN0LFxuICAgICAgd2F0Y2g6IG9wdC53YXRjaCxcbiAgICAgIHNvdXJjZU1hcDogb3B0LnNvdXJjZU1hcCxcbiAgICAgIGpzeDogb3B0LmpzeCxcbiAgICAgIGVkOiBvcHQuZW1pdERlY2xhcmF0aW9uT25seVxuICAgIH0pO1xuICB9KTtcbiAgd2l0aEdsb2JhbE9wdGlvbnModHNjQ21kKTtcbiAgdHNjQ21kLnVzYWdlKHRzY0NtZC51c2FnZSgpICsgJ1xcbicgKyAnUnVuIGd1bHAtdHlwZXNjcmlwdCB0byBjb21waWxlIE5vZGUuanMgc2lkZSBUeXBlc2NyaXB0IGZpbGVzLlxcblxcbicgK1xuICAnSXQgY29tcGlsZXMgXFxuICBcIjxwYWNrYWdlLWRpcmVjdG9yeT4vdHMvKiovKi50c1wiIHRvIFwiPHBhY2thZ2UtZGlyZWN0b3J5Pi9kaXN0XCIsXFxuJyArXG4gICcgIG9yXFxuICBcIjxwYWNrYWdlLWRpcmVjdG9yeT4vaXNvbS8qKi8qLnRzXCIgdG8gXCI8cGFja2FnZS1kaXJlY3Rvcnk+L2lzb21cIlxcbiBmb3IgYWxsIEB3ZmggcGFja2FnZXMuXFxuJyArXG4gICdJIHN1Z2dlc3QgdG8gcHV0IE5vZGUuanMgc2lkZSBUUyBjb2RlIGluIGRpcmVjdG9yeSBgdHNgLCBhbmQgaXNvbW9ycGhpYyBUUyBjb2RlIChtZWFuaW5nIGl0IHJ1bnMgaW4gJyArXG4gICdib3RoIE5vZGUuanMgYW5kIEJyb3dzZXIpIGluIGRpcmVjdG9yeSBgaXNvbWAuXFxuJyArXG4gIGhsRGVzYygncGxpbmsgdHNjXFxuJykgKyAnQ29tcGlsZSBsaW5rZWQgcGFja2FnZXMgdGhhdCBhcmUgZGVwZW5kZW5jaWVzIG9mIGN1cnJlbnQgd29ya3NwYWNlICh5b3Ugc2hhbGwgcnVuIHRoaXMgY29tbWFuZCBvbmx5IGluIGEgd29ya3NwYWNlIGRpcmVjdG9yeSlcXG4nICtcbiAgaGxEZXNjKCdwbGluayB0c2MgPHBhY2thZ2UuLj5cXG4nKSArICcgT25seSBjb21waWxlIHNwZWNpZmljIHBhY2thZ2VzIGJ5IHByb3ZpZGluZyBwYWNrYWdlIG5hbWUgb3Igc2hvcnQgbmFtZVxcbicgK1xuICBobERlc2MoJ3BsaW5rIHRzYyBbcGFja2FnZS4uLl0gLXdcXG4nKSArICcgV2F0Y2ggcGFja2FnZXMgY2hhbmdlIGFuZCBjb21waWxlIHdoZW4gbmV3IHR5cGVzY3JpcHQgZmlsZSBpcyBjaGFuZ2VkIG9yIGNyZWF0ZWRcXG5cXG4nKTtcblxuICAvKipcbiAgICogQnVtcCBjb21tYW5kXG4gICAqL1xuICBjb25zdCBidW1wQ21kID0gcHJvZ3JhbS5jb21tYW5kKCdidW1wIFtwYWNrYWdlLi4uXScpXG4gICAgLmRlc2NyaXB0aW9uKCdidW1wIHBhY2thZ2UuanNvbiB2ZXJzaW9uIG51bWJlciBmb3Igc3BlY2lmaWMgcGFja2FnZSwgc2FtZSBhcyBcIm5wbSB2ZXJzaW9uXCIgZG9lcycpXG4gICAgLm9wdGlvbjxzdHJpbmdbXT4oJy0tcGosIC0tcHJvamVjdCA8cHJvamVjdC1kaXIsLi4uPicsICdvbmx5IGJ1bXAgY29tcG9uZW50IHBhY2thZ2VzIGZyb20gc3BlY2lmaWMgcHJvamVjdCBkaXJlY3RvcnknLFxuICAgICAgKHZhbHVlLCBwcmV2KSA9PiB7XG4gICAgICAgIHByZXYucHVzaCguLi52YWx1ZS5zcGxpdCgnLCcpKTsgcmV0dXJuIHByZXY7XG4gICAgICB9LCBbXSlcbiAgICAub3B0aW9uKCctaSwgLS1pbmNyZS12ZXJzaW9uIDxtYWpvciB8IG1pbm9yIHwgcGF0Y2ggfCBwcmVtYWpvciB8IHByZW1pbm9yIHwgcHJlcGF0Y2ggfCBwcmVyZWxlYXNlPicsXG4gICAgICAndmVyc2lvbiBpbmNyZW1lbnQsIHZhbGlkIHZhbHVlcyBhcmU6IG1ham9yLCBtaW5vciwgcGF0Y2gsIHByZXJlbGVhc2UnLCAncGF0Y2gnKVxuICAgIC5hY3Rpb24oYXN5bmMgKHBhY2thZ2VzOiBzdHJpbmdbXSkgPT4ge1xuICAgICAgKGF3YWl0IGltcG9ydCgnLi9jbGktYnVtcCcpKS5kZWZhdWx0KHsuLi5idW1wQ21kLm9wdHMoKSBhcyB0cC5CdW1wT3B0aW9ucywgcGFja2FnZXN9KTtcbiAgICB9KTtcbiAgd2l0aEdsb2JhbE9wdGlvbnMoYnVtcENtZCk7XG4gIC8vIGJ1bXBDbWQudXNhZ2UoYnVtcENtZC51c2FnZSgpICsgJ1xcbicgKyBobCgncGxpbmsgYnVtcCA8cGFja2FnZT4gLi4uJykgKyAnIHRvIHJlY3Vyc2l2ZWx5IGJ1bXAgcGFja2FnZS5qc29uIGZyb20gbXVsdGlwbGUgZGlyZWN0b3JpZXNcXG4nICtcbiAgLy8gICBobCgncGxpbmsgYnVtcCA8ZGlyPiAtaSBtaW5vcicpICsgJyB0byBidW1wIG1pbm9yIHZlcnNpb24gbnVtYmVyLCBkZWZhdWx0IGlzIHBhdGNoIG51bWJlcicpO1xuXG4gIC8qKlxuICAgKiBQYWNrIGNvbW1hbmRcbiAgICovXG4gIGNvbnN0IHBhY2tDbWQgPSBwcm9ncmFtLmNvbW1hbmQoJ3BhY2sgW3BhY2thZ2UuLi5dJylcbiAgICAuZGVzY3JpcHRpb24oJ25wbSBwYWNrIGV2ZXJ5IHBha2FnZSBpbnRvIHRhcmJhbGwgZmlsZXMnKVxuICAgIC5vcHRpb24oJy0tZGlyIDxwYWNrYWdlIGRpcmVjdG9yeT4nLCAncGFjayBwYWNrYWdlcyBieSBzcGVjaWZ5aW5nIGRpcmVjdG9yaWVzJywgYXJyYXlPcHRpb25GbiwgW10pXG4gICAgLm9wdGlvbignLXcsLS13b3Jrc3BhY2UgPHdvcmtzcGFjZS1kaXI+JywgJ3BhY2sgcGFja2FnZXMgd2hpY2ggYXJlIGxpbmtlZCBhcyBkZXBlbmRlbmN5IG9mIHNwZWNpZmljIHdvcmtzcGFjZXMnLFxuICAgICAgYXJyYXlPcHRpb25GbiwgW10pXG4gICAgLm9wdGlvbignLS1waiwgLS1wcm9qZWN0IDxwcm9qZWN0LWRpcj4nLFxuICAgICAgJ3Byb2plY3QgZGlyZWN0b3JpZXMgdG8gYmUgbG9va2VkIHVwIGZvciBhbGwgcGFja2FnZXMgd2hpY2ggbmVlZCB0byBiZSBwYWNrZWQgdG8gdGFyYmFsbCBmaWxlcycsXG4gICAgICBhcnJheU9wdGlvbkZuLCBbXSlcbiAgICAuYWN0aW9uKGFzeW5jIChwYWNrYWdlczogc3RyaW5nW10pID0+IHtcbiAgICAgIGF3YWl0IChhd2FpdCBpbXBvcnQoJy4vY2xpLXBhY2snKSkucGFjayh7Li4ucGFja0NtZC5vcHRzKCkgYXMgdHAuUGFja09wdGlvbnMsIHBhY2thZ2VzfSk7XG4gICAgfSk7XG4gIHdpdGhHbG9iYWxPcHRpb25zKHBhY2tDbWQpO1xuICBwYWNrQ21kLnVzYWdlKHBhY2tDbWQudXNhZ2UoKSArICdcXG5CeSBkZWZhdWx0LCBydW4gXCJucG0gcGFja1wiIGZvciBlYWNoIGxpbmtlZCBwYWNrYWdlIHdoaWNoIGFyZSBkZXBlbmRlbmNpZXMgb2YgY3VycmVudCB3b3Jrc3BhY2UnKTtcblxuICAvKipcbiAgICogUGFjayBjb21tYW5kXG4gICAqL1xuICBjb25zdCBwdWJsaXNoQ21kID0gcHJvZ3JhbS5jb21tYW5kKCdwdWJsaXNoIFtwYWNrYWdlLi4uXScpXG4gICAgLmRlc2NyaXB0aW9uKCdydW4gbnBtIHB1Ymxpc2gnKVxuICAgIC5vcHRpb24oJy0tZGlyIDxwYWNrYWdlIGRpcmVjdG9yeT4nLCAncHVibGlzaCBwYWNrYWdlcyBieSBzcGVjaWZ5aW5nIGRpcmVjdG9yaWVzJywgYXJyYXlPcHRpb25GbiwgW10pXG4gICAgLm9wdGlvbjxzdHJpbmdbXT4oJy0tcGosIC0tcHJvamVjdCA8cHJvamVjdC1kaXIsLi4uPicsXG4gICAgJ3Byb2plY3QgZGlyZWN0b3JpZXMgdG8gYmUgbG9va2VkIHVwIGZvciBhbGwgcGFja2FnZXMgd2hpY2ggbmVlZCB0byBiZSBwYWNrZWQgdG8gdGFyYmFsbCBmaWxlcycsXG4gICAgICAodmFsdWUsIHByZXYpID0+IHtcbiAgICAgICAgcHJldi5wdXNoKC4uLnZhbHVlLnNwbGl0KCcsJykpOyByZXR1cm4gcHJldjtcbiAgICAgIH0sIFtdKVxuICAgIC5vcHRpb24oJy13LC0td29ya3NwYWNlIDx3b3Jrc3BhY2UtZGlyPicsICdwdWJsaXNoIHBhY2thZ2VzIHdoaWNoIGFyZSBsaW5rZWQgYXMgZGVwZW5kZW5jeSBvZiBzcGVjaWZpYyB3b3Jrc3BhY2VzJyxcbiAgICAgIGFycmF5T3B0aW9uRm4sIFtdKVxuICAgIC5vcHRpb24oJy0tcHVibGljJywgJ3NhbWUgYXMgXCJucG0gcHVibGlzaFwiIGNvbW1hbmQgb3B0aW9uIFwiLS1hY2Nlc3MgcHVibGljXCInLCBmYWxzZSlcbiAgICAuYWN0aW9uKGFzeW5jIChwYWNrYWdlczogc3RyaW5nW10pID0+IHtcbiAgICAgIGF3YWl0IChhd2FpdCBpbXBvcnQoJy4vY2xpLXBhY2snKSkucHVibGlzaCh7Li4ucHVibGlzaENtZC5vcHRzKCkgYXMgdHAuUHVibGlzaE9wdGlvbnMsIHBhY2thZ2VzfSk7XG4gICAgfSk7XG4gIHdpdGhHbG9iYWxPcHRpb25zKHB1Ymxpc2hDbWQpO1xufVxuXG5mdW5jdGlvbiBsb2FkRXh0ZW5zaW9uQ29tbWFuZChwcm9ncmFtOiBjb21tYW5kZXIuQ29tbWFuZCk6IHN0cmluZ1tdIHtcbiAgLy8gY29uc3Qge2dldFN0YXRlfSA9IHJlcXVpcmUoJy4vY2xpLXNsaWNlJykgYXMgdHlwZW9mIGNsaVN0b3JlO1xuICBjb25zdCB7Z2V0U3RhdGU6IGdldFBrZ1N0YXRlLCB3b3Jrc3BhY2VLZXl9ID0gcmVxdWlyZSgnLi4vcGFja2FnZS1tZ3InKSBhcyB0eXBlb2YgcGtnTWdyO1xuICBjb25zdCB3cyA9IGdldFBrZ1N0YXRlKCkud29ya3NwYWNlcy5nZXQod29ya3NwYWNlS2V5KHByb2Nlc3MuY3dkKCkpKTtcbiAgaWYgKHdzID09IG51bGwpXG4gICAgcmV0dXJuIFtdO1xuXG4gIGNvbnN0IG9yaWdQZ21Db21tYW5kID0gcHJvZ3JhbS5jb21tYW5kO1xuXG4gIGxldCBmaWxlUGF0aDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgLy8gY29uc3QgY21kSW5mb1BhY2tzID0gbmV3IEFycmF5PFBhcmFtZXRlcnM8dHlwZW9mIGNsaVN0b3JlLmNsaUFjdGlvbkRpc3BhdGNoZXIudXBkYXRlTG9hZGVkQ21kPlswXSBleHRlbmRzIChpbmZlciBJKVtdID8gSSA6IHVua25vd24+KDEpO1xuICBjb25zdCBsb2FkZWRDbWRNYXAgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuXG4gIHByb2dyYW0uY29tbWFuZCA9IGZ1bmN0aW9uKHRoaXM6IHR5cGVvZiBwcm9ncmFtLCBuYW1lQW5kQXJnczogc3RyaW5nLCAuLi5yZXN0QXJnczogYW55W10pIHtcbiAgICBjb25zdCBjbWROYW1lID0gL15cXFMrLy5leGVjKG5hbWVBbmRBcmdzKSFbMF07XG4gICAgaWYgKGxvYWRlZENtZE1hcC5oYXMoY21kTmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ29uZmxpY3QgY29tbWFuZCBuYW1lICR7Y21kTmFtZX0gZnJvbSBleHRlbnNpb25zIFwiJHtmaWxlUGF0aH1cIiBhbmQgXCIke2xvYWRlZENtZE1hcC5nZXQoY21kTmFtZSl9XCJgKTtcbiAgICB9XG4gICAgbG9hZGVkQ21kTWFwLnNldChjbWROYW1lLCBmaWxlUGF0aCEpO1xuICAgIC8vIGNtZEluZm9QYWNrc1swXSA9IHtjbWQ6IGNtZE5hbWUsIGZpbGU6IGZpbGVQYXRoIX07XG4gICAgLy8gY2xpU3RvcmUuY2xpQWN0aW9uRGlzcGF0Y2hlci51cGRhdGVMb2FkZWRDbWQoY21kSW5mb1BhY2tzKTtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWNvbnNvbGVcbiAgICAvLyBjb25zb2xlLmxvZyhgTG9hZGluZyBjb21tYW5kIFwiJHtjbWROYW1lfVwiIGZyb20gZXh0ZW5zaW9uICR7ZmlsZVBhdGh9YCk7XG4gICAgcmV0dXJuIG9yaWdQZ21Db21tYW5kLmNhbGwodGhpcywgbmFtZUFuZEFyZ3MsIC4uLnJlc3RBcmdzKTtcbiAgfSBhcyBhbnk7XG5cbiAgY29uc3QgYXZhaWxhYmxlczogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBwayBvZiBwYWNrYWdlczRXb3Jrc3BhY2UoKSkge1xuICAgIGNvbnN0IGRyID0gcGsuanNvbi5kcjtcbiAgICBpZiAoZHIgPT0gbnVsbCB8fCBkci5jbGkgPT0gbnVsbClcbiAgICAgIGNvbnRpbnVlO1xuICAgIGNvbnN0IFtwa2dGaWxlUGF0aCwgZnVuY05hbWVdID0gKGRyLmNsaSBhcyBzdHJpbmcpLnNwbGl0KCcjJyk7XG4gICAgLy8gaWYgKCFfLmhhcyh3cy5vcmlnaW5JbnN0YWxsSnNvbi5kZXBlbmRlbmNpZXMsIGV4dGVuc2lvbi5wa05hbWUpICYmICFfLmhhcyh3cy5vcmlnaW5JbnN0YWxsSnNvbi5kZXZEZXBlbmRlbmNpZXMsIGV4dGVuc2lvbi5wa05hbWUpKVxuICAgIC8vICAgY29udGludWU7XG5cbiAgICBhdmFpbGFibGVzLnB1c2gocGsubmFtZSk7XG5cbiAgICB0cnkge1xuICAgICAgZmlsZVBhdGggPSByZXF1aXJlLnJlc29sdmUocGsubmFtZSArICcvJyArIHBrZ0ZpbGVQYXRoKTtcbiAgICB9IGNhdGNoIChlKSB7fVxuXG4gICAgaWYgKGZpbGVQYXRoICE9IG51bGwpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHN1YkNtZEZhY3Rvcnk6IHRwLkNsaUV4dGVuc2lvbiA9IGZ1bmNOYW1lID8gcmVxdWlyZShmaWxlUGF0aClbZnVuY05hbWVdIDpcbiAgICAgICAgICByZXF1aXJlKGZpbGVQYXRoKTtcbiAgICAgICAgc3ViQ21kRmFjdG9yeShwcm9ncmFtLCB3aXRoR2xvYmFsT3B0aW9ucyk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gbG9hZCBjb21tYW5kIGxpbmUgZXh0ZW5zaW9uIGluIHBhY2thZ2UgJyArIHBrLm5hbWUsIGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gYXZhaWxhYmxlcztcbn1cblxuZnVuY3Rpb24gaGwodGV4dDogc3RyaW5nKSB7XG4gIHJldHVybiBjaGFsay5ncmVlbih0ZXh0KTtcbn1cblxuZnVuY3Rpb24gaGxEZXNjKHRleHQ6IHN0cmluZykge1xuICByZXR1cm4gY2hhbGsuZ3JlZW4odGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3aXRoR2xvYmFsT3B0aW9ucyhwcm9ncmFtOiBjb21tYW5kZXIuQ29tbWFuZCk6IGNvbW1hbmRlci5Db21tYW5kIHtcbiAgcHJvZ3JhbS5vcHRpb24oJy1jLCAtLWNvbmZpZyA8Y29uZmlnLWZpbGU+JyxcbiAgICBobERlc2MoJ1JlYWQgY29uZmlnIGZpbGVzLCBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgZmlsZXMsIHRoZSBsYXR0ZXIgb25lIG92ZXJyaWRlcyBwcmV2aW91cyBvbmUnKSxcbiAgICAodmFsdWUsIHByZXYpID0+IHsgcHJldi5wdXNoKC4uLnZhbHVlLnNwbGl0KCcsJykpOyByZXR1cm4gcHJldjt9LCBbXSBhcyBzdHJpbmdbXSlcbiAgLm9wdGlvbignLS1wcm9wIDxwcm9wZXJ0eS1wYXRoPXZhbHVlIGFzIEpTT04gfCBsaXRlcmFsPicsXG4gICAgaGxEZXNjKCc8cHJvcGVydHktcGF0aD49PHZhbHVlIGFzIEpTT04gfCBsaXRlcmFsPiAuLi4gZGlyZWN0bHkgc2V0IGNvbmZpZ3VyYXRpb24gcHJvcGVydGllcywgcHJvcGVydHkgbmFtZSBpcyBsb2Rhc2guc2V0KCkgcGF0aC1saWtlIHN0cmluZ1xcbiBlLmcuXFxuJykgK1xuICAgICctLXByb3AgcG9ydD04MDgwIC0tcHJvcCBkZXZNb2RlPWZhbHNlIC0tcHJvcCBAd2ZoL2Zvb2Jhci5hcGk9aHR0cDovL2xvY2FsaG9zdDo4MDgwXFxuJyArXG4gICAgJy0tcHJvcCBwb3J0PTgwODAgLS1wcm9wIGRldk1vZGU9ZmFsc2UgLS1wcm9wIEB3ZmgvZm9vYmFyLmFwaT1odHRwOi8vbG9jYWxob3N0OjgwODBcXG4nICtcbiAgICAnLS1wcm9wIGFycmF5bGlrZS5wcm9wWzBdPWZvb2JhclxcbicgK1xuICAgICctLXByb3AgW1wiQHdmaC9mb28uYmFyXCIsXCJwcm9wXCIsMF09dHJ1ZScsXG4gICAgYXJyYXlPcHRpb25GbiwgW10gYXMgc3RyaW5nW10pO1xuICAvLyAub3B0aW9uKCctLWxvZy1zdGF0JywgaGxEZXNjKCdQcmludCBpbnRlcm5hbCBSZWR1eCBzdGF0ZS9hY3Rpb25zIGZvciBkZWJ1ZycpKTtcblxuICByZXR1cm4gcHJvZ3JhbTtcbn1cblxuIl19